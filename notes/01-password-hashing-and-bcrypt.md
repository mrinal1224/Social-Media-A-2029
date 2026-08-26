# Class 01 — Password Hashing, Salt and bcrypt

**Date:** 24 August 2026  
**Git milestone:** `salt generation`  
**Commit:** `305859ced295f1c8760f70ff7af3fad69451f8fd`

> In this class we are solving a very fundamental backend problem: **what should the server store when a user gives us a password?**

The first instinct is often to store the password directly in MongoDB. That is exactly what we must never do.

Imagine our database is a locker containing thousands of passwords. If somebody gets a copy of that database, plaintext passwords immediately become usable credentials. Our first job is therefore to transform the password into a form from which the original password is not practically recoverable.

## 1. Hashing is not encryption

This distinction is extremely important.

### Encryption

Encryption is designed to be reversible when you possess a key:

```text
plaintext --encrypt + key--> ciphertext
ciphertext --decrypt + key--> plaintext
```

This is useful when we actually need to recover the original data later.

### Password hashing

Password hashing is intended to be one-way:

```text
password --hash--> password hash
```

During login, we do not decrypt the stored value. Instead, we take the password supplied during login and ask bcrypt to verify it against the stored hash.

That is the mental model I want you to keep:

> **We do not need to know the user's password. We only need to know whether the password they entered matches the stored representation.**

## 2. Why a normal fast hash is not enough

A hash function such as SHA-256 is excellent for many integrity and cryptographic purposes, but password storage has a special requirement: we want password guessing to be expensive.

An attacker can try a huge number of likely passwords offline if they obtain a password database. For passwords, a deliberately expensive password-hashing algorithm is much more suitable.

That is why we use **bcrypt**.

## 3. What bcrypt gives us

bcrypt is designed specifically for password hashing. It includes a salt and a cost factor in its construction.

The useful properties for us are:

- The same password does not produce the same stored hash every time.
- The salt prevents precomputed tables from being directly reusable across accounts.
- The cost factor makes large-scale guessing more expensive.

Think of the salt as an ingredient that is unique to this password instance. Two people can both use `hello123`, but their bcrypt outputs can still differ because the salt differs.

## 4. The project dependency

Our backend installs bcrypt:

```json
{
  "dependencies": {
    "bcrypt": "^6.0.0"
  }
}
```

The backend is configured as an ES module application through:

```json
"type": "module"
```

This is why our imports look like:

```js
import bcrypt from 'bcrypt'
```

rather than CommonJS `require()` syntax.

## 5. Generating a salt

The class introduced:

```js
const salt = await bcrypt.genSalt(10)
```

The `10` is the bcrypt cost factor used in this example.

A common beginner misunderstanding is:

> "bcrypt runs the password transformation exactly 10 times."

That is not a good mental model. The cost parameter controls the computational work performed by bcrypt; describing it as simply “10 rounds of transforming the password” is misleading.

### Why do we need a salt?

Suppose two users have this password:

```text
password = hello123
```

Without a unique salt:

```text
hello123 -> same hash every time
```

With salts:

```text
hello123 + salt A -> hash A
hello123 + salt B -> hash B
```

This means observing identical or common passwords across accounts does not directly reveal that the same password was chosen.

## 6. What happens inside the stored bcrypt value?

A bcrypt encoded string contains information that allows bcrypt to perform verification later. You may see something conceptually like:

```text
$2b$10$<salt-and-derived-value...>
```

Important detail:

- `2b` identifies the bcrypt variant.
- `10` represents the cost setting.
- The remaining encoded material contains the salt and derived password data in bcrypt's format.

You do **not** need a separate database column just for bcrypt's salt when using the normal bcrypt API. The encoded bcrypt hash carries the information required for verification.

## 7. Password hashing in the registration flow

Our registration controller eventually performs:

```js
const hashedPassword = await bcrypt.hash(password, 10)
```

Then the database receives the hash rather than the plaintext password:

```js
const newUser = await User.create({
    username,
    name,
    password: hashedPassword,
    email
})
```

The important flow is:

```text
User enters password
        |
        v
   plaintext password
        |
        v
     bcrypt.hash
        |
        v
     hash string
        |
        v
      MongoDB
```

## 8. A subtle issue in our current classroom code

We currently have both:

```js
const salt = await bcrypt.genSalt(10)
const hashedPassword = await bcrypt.hash(password, 10)
```

The generated `salt` variable is not then used by `bcrypt.hash()`.

So this code is redundant.

Either do:

```js
const salt = await bcrypt.genSalt(10)
const hashedPassword = await bcrypt.hash(password, salt)
```

or more simply:

```js
const hashedPassword = await bcrypt.hash(password, 10)
```

When using the second form, bcrypt internally handles salt generation using the requested cost factor.

### Better production-style version

```js
const hashedPassword = await bcrypt.hash(password, 10)
```

Keep the code simple unless you have a reason to control the salt generation separately.

## 9. How login works

During login we do **not** run:

```js
bcrypt.hash(password, 10)
```

and compare strings manually.

Instead, our code uses:

```js
const correctPassword = bcrypt.compareSync(
    password,
    userExists.password
)
```

Conceptually:

```text
Login password
     |
     v
bcrypt.compare
     |
     +---- read salt/cost from stored bcrypt hash
     |
     +---- perform bcrypt verification
     |
     v
true / false
```

This is one of the most important things to understand:

> **The salt does not need to be separately supplied at login because bcrypt knows how to obtain the necessary salt information from the stored encoded hash.**

## 10. Why does guessing become slower?

Suppose an attacker steals 1 million password hashes.

With a very fast general-purpose hash, trying billions of guesses can be comparatively cheap on modern hardware.

A password hashing algorithm deliberately increases the cost of each guess.

Even when the attacker knows the hash, salt and algorithm, they still have to do the expensive computation for each candidate password.

That is what we mean by making brute-force attacks **computationally expensive**.

## 11. The model we use

Our current `User` schema stores:

```js
password: {
    type: String,
    required: true,
}
```

The important thing is what goes into this field.

It must be something like:

```text
bcrypt encoded hash
```

and never:

```text
myRealPassword123
```

## 12. Things I want you to notice in the schema

Our user model also contains:

```js
followers: []
followings: []
posts: []
stories: []
reels: []
```

The intention is to store references/IDs to related social-media entities.

At this stage these arrays are only placeholders; in a production schema I would explicitly define the referenced type, usually with ObjectId and `ref`, for example:

```js
followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
}]
```

We will cover relational modelling more deeply when the social graph grows.

## 13. Security rules I want you to remember

### Never log passwords

Do not write:

```js
console.log(password)
```

especially in a shared development environment.

### Do not return the password hash to clients

Our current classroom code returns `newUser` / `userExists`, which means the object can include the password field. That is not ideal.

Production code should explicitly remove it or use a DTO / serializer:

```js
const userResponse = {
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email
}
```

### Validate password policy deliberately

The class currently checks:

```js
if (password.length <= 6) {
    return res.status(400).json({
        message: 'Password length should be greater or Equal to 6'
    })
}
```

A production policy should be designed around risk and usability rather than blindly imposing old complexity rules. At minimum, avoid extremely weak credentials and consider rate limiting and breached-password detection where appropriate.

## 14. Real-life analogy

Imagine a gym locker system.

You do not hand the receptionist your actual secret diary and ask them to keep it in a drawer.

Instead, the system stores a specially prepared representation that lets it answer:

> “Does this submitted secret match the original?”

Bcrypt is the machine performing that secure transformation and verification.

The salt is like adding a unique ingredient before making the secure representation, so the same input does not produce the same stored result across users.

## 15. Interview questions

1. Why should passwords be hashed instead of encrypted?
2. What is a salt?
3. Why does every password need a unique salt?
4. Is the bcrypt salt secret?
5. Can you retrieve a plaintext password from a bcrypt hash?
6. What is the bcrypt cost factor?
7. Why are password-hashing algorithms intentionally slow?
8. Why should we use `bcrypt.compare()` instead of manually hashing and comparing?
9. What is the difference between bcrypt and SHA-256 for password storage?
10. Where is the salt stored in a normal bcrypt hash?

## 16. Practice questions

### Beginner

1. Write a small Node.js program that hashes three different passwords with bcrypt.
2. Hash the same password five times. Explain why the results differ.
3. Write a login verifier using `bcrypt.compare()`.

### Intermediate

4. Remove the plaintext password from the API response without mutating the database object.
5. Add a password confirmation field to registration.
6. Add password validation middleware.

### Advanced

7. Explain why an attacker who has both the hash and salt can still be unable to recover the password directly.
8. Compare bcrypt, scrypt and Argon2 at a high level.
9. Design a password reset flow without ever sending the existing password to the user.
10. Design account lockout / rate limiting after repeated failed login attempts.

## 17. Further study

- bcrypt package documentation: https://www.npmjs.com/package/bcrypt
- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

## Class summary

The complete lesson can be reduced to one sentence:

> **A password is a secret that the server should verify, not a piece of data that the server should be able to read back.**

From here, the next question is: after a password is verified, **how do we remember that this request belongs to an authenticated user?**

That is where JWT enters the project.
