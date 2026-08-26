# Class 02 — JWT: Tokens, Signing and Verification

**Date:** 25 August 2026  
**Git milestone:** `Push JWT`  
**Commit:** `345af5b88cae2b5f642c9850d7b7e2474ddcd5e6`

## 1. Why do we need authentication state?

In the previous class, we solved password storage. We can now verify that a login attempt is legitimate.

But there is a second problem.

Imagine I successfully log in at 10:00 AM. At 10:01 AM I request:

```http
GET /users/me
```

How does the server know that this request is coming from the user who just logged in?

HTTP is stateless. Each request is independent unless we introduce a mechanism for carrying authentication state between requests.

Our application solves this using a **JSON Web Token (JWT)**.

The idea is simple:

```text
login succeeds
     |
     v
server creates a signed token
     |
     v
client stores/sends token
     |
     v
future request carries token
     |
     v
server verifies token
     |
     v
request is associated with a user
```

## 2. JWT is a signed token, not an encrypted password

A JWT is primarily a compact way of carrying claims between parties with integrity protection.

The most important distinction for this project is:

> **JWT signing does not mean the payload is secret.**

Do not put sensitive information in the payload assuming that nobody can read it.

A normal JWT has three conceptual parts:

```text
HEADER.PAYLOAD.SIGNATURE
```

For example:

```text
xxxxx.yyyyy.zzzzz
```

The header and payload are encoded, not magically hidden.

The signature exists so the server can determine whether the token has been modified and whether it was produced with the expected signing secret/key.

## 3. Our token utility

The project centralizes token creation in:

```text
backend/utils/genToken.js
```

The file currently contains:

```js
import jwt from 'jsonwebtoken'

const genToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.jwt_secret,
        { expiresIn: '7d' }
    )
}

export default genToken
```

This tiny utility is important because it removes duplicated JWT-generation logic from controllers.

If both registration and login need a token, both can call:

```js
const token = genToken(userId)
```

instead of rewriting the JWT configuration in multiple places.

## 4. Understanding `jwt.sign()`

The core call is:

```js
jwt.sign(payload, secret, options)
```

In our code:

```js
jwt.sign(
    { userId },
    process.env.jwt_secret,
    { expiresIn: '7d' }
)
```

Let's break this down.

### Payload

```js
{ userId }
```

This uses JavaScript shorthand. It is equivalent to:

```js
{ userId: userId }
```

The goal is to put the user's identifier inside the token so that, after verification, we know which database record to load.

### Secret

```js
process.env.jwt_secret
```

The signing secret comes from an environment variable rather than source code.

This is critical because we should not hardcode a production secret into Git.

### Expiration

```js
{ expiresIn: '7d' }
```

This means the token is considered expired after the configured lifetime.

A seven-day token is convenient for this project, but the correct production lifetime depends on the threat model, application type and refresh-token design.

## 5. Real-life analogy

Think of JWT as a signed visitor pass.

The security desk issues a pass containing:

```text
Visitor ID = 7821
Valid until = Friday
```

The desk signs the pass in a way that other people cannot forge without the signing secret/key.

At every restricted door, security checks the pass.

Notice something important: the visitor's secret password is not printed on the pass.

The pass simply tells the system **which identity the request claims to represent**, and the signature lets the system detect tampering.

## 6. Registration flow with JWT

After a new user is created, our controller does:

```js
const newUser = await User.create({
    username,
    name,
    password: hashedPassword,
    email
})

const token = genToken(newUser._id)
```

The sequence is:

```text
request body
   |
   v
validate user input
   |
   v
check username/email
   |
   v
hash password
   |
   v
create user in MongoDB
   |
   v
get newUser._id
   |
   v
generate JWT containing userId
```

This is deliberate: the token refers to the database identity rather than duplicating the entire user object.

## 7. Why not put the entire user object in the JWT?

We could technically put many claims in the token, but that creates multiple problems.

Suppose a user changes their name.

If the token contains the old name, the token and database can disagree until the token expires.

A cleaner approach for this application is:

```text
JWT -> userId

userId -> MongoDB -> current user record
```

This gives us one authoritative place for mutable profile data: the database.

## 8. JWT verification

The next stage of the project uses:

```js
const decoded = jwt.verify(
    token,
    process.env.jwt_secret
)
```

There are two related concepts here:

### Decode

Reading the token payload.

### Verify

Checking the token's signature and validating its claims such as expiration.

For authentication, verification is what matters.

Never treat an unverified decoded payload as trusted identity information.

## 9. The authenticated request flow

Imagine the browser sends:

```http
GET /users/me
```

with a JWT attached through the chosen transport.

The server performs:

```text
request
  |
  v
extract token
  |
  v
jwt.verify(token, secret)
  |
  +---- invalid -> reject
  |
  v
read decoded.userId
  |
  v
User.findById(decoded.userId)
  |
  v
attach user to request
  |
  v
controller runs
```

This architecture becomes especially useful once we protect many routes.

## 10. Why use a utility module?

Our structure is:

```text
backend/
├── controllers/
├── middlewares/
├── models/
├── routes/
└── utils/
    └── genToken.js
```

This is not just cosmetic organization.

The utility isolates a repeated concern:

> “How exactly do we create the authentication token?”

If token lifetime, algorithm or payload conventions change, there is one central place to update.

## 11. JWT does not replace the database

A common misconception is:

> “JWT means we don't need the database after login.”

Not in our architecture.

Our middleware still uses:

```js
const user = await User.findById(decoded.userId)
```

So JWT tells us **who the request claims to be**, and the database gives us the current user record.

This also allows us to reject an identity that no longer exists.

## 12. What an attacker can and cannot do

Suppose an attacker sees a valid JWT.

They may be able to read its header and payload because ordinary JWTs are not confidential.

However, without the signing secret/private key, they should not be able to produce a different valid signature.

So this is wrong thinking:

> “JWT is safe because the payload is hidden.”

The correct thinking is:

> “JWT protects integrity/authenticity through its signature; confidentiality requires encryption or a different mechanism.”

## 13. What should go into a JWT?

Good examples:

```json
{
  "userId": "...",
  "role": "user",
  "iat": 123456,
  "exp": 123456
}
```

Bad examples:

```json
{
  "password": "...",
  "creditCard": "...",
  "privateMedicalRecord": "..."
}
```

JWT payloads should remain small and should not contain secrets simply because they are convenient to access.

## 14. Expiration and refresh tokens

Our current project uses a simple seven-day access token.

Production systems often use a shorter-lived access token plus a refresh mechanism.

Conceptually:

```text
short-lived access token
        |
        | expires
        v
refresh token -> issue new access token
```

This reduces the blast radius of a stolen access token while still allowing long-lived sessions.

We are deliberately keeping the first implementation simpler so we can understand the mechanics before introducing refresh-token rotation, revocation and device/session management.

## 15. Production best practices

### Keep the secret strong

Never use:

```text
secret123
```

Use a high-entropy secret and manage it through secure secret storage.

### Never commit real secrets

The repository contains a `backend/.env` path in the current tree. In a production repository, real secrets must not be committed.

The safer pattern is:

```text
.env              -> local machine only
.env.example      -> variable names / fake example values
secret manager    -> production secrets
```

### Consider algorithm choices carefully

Do not blindly accept whatever token algorithm arrives in a request. Your application should explicitly configure the algorithms it supports.

### Keep claims minimal

A JWT should not become a duplicate database row.

## 16. Interview questions

1. What is a JWT?
2. What are the three parts of a JWT?
3. Is the JWT payload encrypted?
4. What is the difference between signing and encryption?
5. Why does the server need a secret/private key?
6. What happens when a JWT expires?
7. What is the difference between `jwt.decode()` and `jwt.verify()`?
8. Why should JWT payloads be small?
9. What is a refresh token?
10. What happens if the JWT signing secret is leaked?
11. How would you revoke a JWT before it expires?
12. How would you design “log out from all devices”?

## 17. Practice problems

### Beginner

1. Generate a JWT with a user ID and one additional claim.
2. Verify the token and print the decoded payload.
3. Create a token that expires in 30 seconds and observe its behavior.

### Intermediate

4. Add a `role` claim and create role-based authorization middleware.
5. Reject tokens with an expired `exp` claim.
6. Create a `requireAuth` middleware that attaches `req.userId`.

### Advanced

7. Design access-token + refresh-token authentication.
8. Design refresh-token rotation and reuse detection.
9. Design logout from all devices.
10. Explain how you would handle secret rotation without immediately logging every user out.

## 18. Further study

- RFC 7519 — JSON Web Token: https://www.rfc-editor.org/rfc/rfc7519
- jwt.io introduction: https://jwt.io/introduction
- OWASP JSON Web Token for Java Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html

## Class summary

Our project has now moved from **“Can I verify this password?”** to **“How can I carry verified identity across future HTTP requests?”**

JWT gives us a compact signed identity token.

The next important question is: after the token is verified, how do we make the authenticated user available to the rest of our request pipeline?

That leads directly to middleware and the decoded user flow.
