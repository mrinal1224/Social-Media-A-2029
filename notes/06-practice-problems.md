# Practice Workbook — Authentication Module

The goal of these questions is not to memorise code. The goal is to force you to reconstruct the system yourself.

## Level 1 — Understand the code

### 1. Registration flow

Explain every step between:

```http
POST /users/register
```

and the final database write.

Your explanation must include:

- route resolution
- request body extraction
- validation
- duplicate checks
- password hashing
- Mongoose `create`
- JWT generation
- cookie creation
- response

### 2. Login flow

Explain why login uses:

```js
bcrypt.compare(password, userExists.password)
```

instead of trying to reverse the stored bcrypt hash.

### 3. JWT flow

Explain:

```js
jwt.sign()
```

versus:

```js
jwt.verify()
```

### 4. Middleware flow

Explain why this works:

```js
router.get('/me', isAuthenticated, getUser)
```

and why `getUser` does not need to verify the JWT again.

## Level 2 — Fix the code

### 5. Fix missing returns

The current middleware contains patterns like:

```js
if (!token) {
    res.status(404).json({ message: 'No token Found' })
}
```

Rewrite it so execution stops after the response.

### 6. Fix password response leakage

The current controller can return the full Mongoose user object.

Create a safe response object that never includes the password hash.

### 7. Fix bcrypt usage

The registration flow currently creates a salt explicitly but then calls `bcrypt.hash(password, 10)` separately.

Rewrite the code in the simplest correct way.

### 8. Improve login password comparison

Rewrite synchronous bcrypt comparison as asynchronous code appropriate for a Node.js request handler.

## Level 3 — Build features

### 9. Logout

Implement:

```http
POST /users/logout
```

Requirements:

- clear the authentication cookie
- return a success response
- use the same cookie scope that was used for setting the cookie

### 10. Current-user endpoint

Build:

```http
GET /users/me
```

Requirements:

- must be protected
- must return safe user information
- must never return password hash

### 11. Role-based authorization

Add a `role` field:

```js
role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
}
```

Then write:

```js
isAuthenticated
isAdmin
```

and protect:

```http
DELETE /users/:id
```

### 12. Account rate limiting

Design protection for `/users/login` so an attacker cannot make unlimited password guesses.

Discuss:

- per-IP limiting
- per-account limiting
- temporary lockout
- distributed systems concerns

## Level 4 — Security thinking

### 13. XSS versus CSRF

Explain why:

```js
httpOnly: true
```

helps with cookie theft through JavaScript but does not itself eliminate CSRF.

### 14. Cookie configuration

Design cookie settings for:

#### Local development

```text
Frontend: http://localhost:5173
Backend:  http://localhost:8082
```

#### Production

```text
Frontend: https://app.example.com
Backend:  https://api.example.com
```

Explain the differences in:

- `secure`
- `httpOnly`
- `sameSite`
- CORS
- credentials

### 15. Stolen JWT

A user logs in and an attacker somehow obtains the access token.

Explain why simply deleting the user's browser cookie does not necessarily invalidate the attacker's copy.

Then design a stronger logout/revocation system.

### 16. Logout all devices

Design a system where:

```text
Device A -> logged in
Device B -> logged in
Device C -> logged in
```

and the user clicks:

```text
Log out all devices
```

Discuss JWT-only and server-backed approaches.

## Level 5 — System design

### 17. Authentication service

Design a reusable authentication module for:

- register
- login
- logout
- refresh session
- current user
- change password
- forgot password
- reset password
- logout all devices

Draw the API boundaries.

### 18. Refresh-token architecture

Design:

```text
Access token -> short-lived
Refresh token -> long-lived
```

Explain:

- where each token is stored
- how rotation works
- how revocation works
- what happens when a refresh token is reused

### 19. Session store versus JWT

Compare:

```text
server-side sessions + session DB/cache
```

against:

```text
self-contained JWTs
```

Discuss:

- scalability
- revocation
- server memory
- operational complexity
- security
- multi-device sessions

### 20. Authentication at scale

Imagine the social-media platform reaches:

```text
10 million users
100k requests/second
```

Explain what changes in the authentication architecture.

Think about:

- caching
- database load
- token verification
- key management
- rate limiting
- observability
- distributed session state

## Mini implementation project

Build the following complete API on top of this repository:

```text
POST   /users/register
POST   /users/login
POST   /users/logout
GET    /users/me
PATCH  /users/me
POST   /users/change-password
POST   /users/forgot-password
POST   /users/reset-password
POST   /users/logout-all
```

Requirements:

- bcrypt password hashing
- JWT authentication
- HttpOnly cookies
- correct `SameSite` strategy
- HTTPS-ready cookie configuration
- protected routes
- role-based authorization
- password reset tokens
- rate limiting on authentication endpoints
- safe API responses
- centralized error handling
- input validation
- tests

## Viva / interview drill

Try answering these without opening the notes:

1. Why can't we decrypt bcrypt?
2. What is the salt?
3. Why does bcrypt need a cost factor?
4. What is inside a JWT?
5. Is JWT encrypted?
6. Why verify instead of decode?
7. What does `next()` mean?
8. Why attach `req.user`?
9. What does HttpOnly protect against?
10. What does SameSite protect against?
11. What does Secure protect against?
12. Why can cookies create CSRF risk?
13. Why do we still query MongoDB after JWT verification?
14. Why should password hashes never be returned to the client?
15. How would you revoke a JWT before expiration?

## Final challenge

Close the notes and implement authentication from scratch in a blank Express project.

Use only this mental sequence:

```text
Registration
  -> validate
  -> hash password
  -> save user
  -> issue token
  -> set cookie

Login
  -> find user
  -> compare password
  -> issue token
  -> set cookie

Protected request
  -> read cookie
  -> verify token
  -> load user
  -> attach req.user
  -> next()
```

Then explain every security decision you made.
