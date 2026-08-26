# Class 03 — Decoded User, Middleware and Request Context

**Date:** 25 August 2026  
**Git milestone:** `push User Decoded`  
**Commit:** `c7317077153da00aee35d4b965347822aa33d5c4`

## 1. Where we are now

At this point we have three pieces:

1. A user can register.
2. A user can log in and receive an authentication token.
3. We can verify that token.

Now we need to connect authentication to our normal Express request pipeline.

The problem is simple:

> The controller that needs the user should not have to repeat JWT parsing and database lookup on every route.

This is exactly what middleware is good at.

## 2. What is middleware?

In Express, middleware is a function that sits in the request pipeline.

The shape is typically:

```js
(req, res, next) => {
    // do something
    next()
}
```

Think of a building with multiple security checkpoints:

```text
Request
  |
  v
Security check
  |
  v
Permission check
  |
  v
Controller
  |
  v
Response
```

Authentication is one of those checkpoints.

## 3. The middleware file

Our authentication middleware lives at:

```text
backend/middlewares/authMiddleware.js
```

Current implementation:

```js
import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'

const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token

        if (!token) {
            res.status(404).json({ message: "No token Found" })
        }

        const decoded = jwt.verify(token, process.env.jwt_secret)
        const user = await User.findById(decoded.userId)

        if (!user) {
            res.status(404).json({ message: "User Not found" })
        }

        req.user = user
        next()
    } catch (error) {
        return res.status(500).json({ message: "Server Error" })
    }
}

export default isAuthenticated
```

This middleware does four important jobs:

```text
1. Get token
2. Verify token
3. Find user
4. Attach user to request
```

## 4. Why did we add `next`?

The earlier middleware version did not accept `next`.

We changed:

```js
const isAuthenticated = async (req, res) => {
```

to:

```js
const isAuthenticated = async (req, res, next) => {
```

The reason is that authentication is not itself the final response for a successful request.

It is a gatekeeper.

If authentication succeeds:

```js
next()
```

means:

> “The request passed this middleware. Continue to the next handler.”

## 5. Request pipeline for `/users/me`

Our route is:

```js
userRoutes.get(
    '/me',
    isAuthenticated,
    getUser
)
```

The request flows like this:

```text
GET /users/me
       |
       v
isAuthenticated
       |
       +---- no token -> reject
       |
       +---- invalid token -> reject
       |
       +---- user missing -> reject
       |
       v
   req.user = user
       |
       v
    next()
       |
       v
    getUser
       |
       v
    response
```

This is the core middleware concept I want you to understand.

## 6. `req`, `res`, and `next`

### `req`

The request object contains information coming into the server:

- headers
- URL
- method
- body
- cookies
- and, in Express, values that our own middleware can attach

### `res`

The response object is how we send a response back to the client.

Example:

```js
res.status(200).json({ message: 'OK' })
```

### `next`

`next()` transfers control to the next matching middleware/handler.

This makes middleware composable.

## 7. The most important line: `req.user = user`

This line is conceptually powerful:

```js
req.user = user
```

We are attaching authenticated identity to the request object.

Then any downstream handler can access it.

For example:

```js
export const getUser = (req, res) => {
    res.status(200).json(req.user)
}
```

The controller does not need to know how the token was extracted.

The controller does not need to know how JWT verification works.

The controller does not need to perform `User.findById()` again.

The authentication middleware has already established the context.

## 8. Real-life analogy

Think about entering an office building.

At the gate, security checks your ID.

Once verified, the security system gives the receptionist information saying:

```text
This visitor is Mrinal.
```

The receptionist doesn't need to scan the ID again.

That is `req.user`.

Authentication middleware establishes identity once, and downstream handlers can rely on that established request context.

## 9. Why not authenticate inside every controller?

Without middleware, we might write this in every protected controller:

```js
const token = req.cookies.token
const decoded = jwt.verify(token, process.env.jwt_secret)
const user = await User.findById(decoded.userId)
```

Then we repeat it across:

```text
GET /users/me
POST /posts
DELETE /posts/:id
POST /comments
POST /follow
DELETE /follow
...
```

That creates duplication and makes maintenance harder.

Instead:

```text
isAuthenticated -> shared authentication layer
```

## 10. Why does the middleware load the user from MongoDB?

We could stop after:

```js
const decoded = jwt.verify(token, secret)
```

and pass only `decoded.userId` forward.

But our project currently wants the authenticated user object itself:

```js
const user = await User.findById(decoded.userId)
```

This gives later controllers immediate access to current database state.

For example, if the user changed their bio after the token was issued, the database contains the latest value.

## 11. Authentication versus authorization

Do not mix these concepts.

### Authentication

> Who are you?

Example:

```text
JWT -> userId -> user exists
```

### Authorization

> Are you allowed to perform this action?

Example:

```text
user.role === 'admin'
```

Our `isAuthenticated` middleware is authentication.

Later, we could compose:

```js
isAuthenticated,
isAdmin,
controller
```

## 12. Current route architecture

Our user routes are:

```js
userRoutes.post('/register', resgiterUser)
userRoutes.post('/login', loginUser)
userRoutes.get('/me', isAuthenticated, getUser)
```

Because the backend mounts the router with:

```js
app.use('/users', userRoutes)
```

the real API endpoints become:

```text
POST /users/register
POST /users/login
GET  /users/me
```

That layering is worth understanding:

```text
app.use('/users', userRoutes)
                 |
                 +-- '/register'
                 +-- '/login'
                 +-- '/me'
```

## 13. One subtle bug in the current middleware

Current code:

```js
if (!token) {
    res.status(404).json({ message: "No token Found" })
}
```

There is no `return`.

So after sending the response, execution may continue to:

```js
jwt.verify(token, process.env.jwt_secret)
```

and `token` may be undefined.

The safer pattern is:

```js
if (!token) {
    return res.status(401).json({
        message: 'Authentication required'
    })
}
```

The same issue appears in the `!user` branch.

## 14. HTTP status code improvement

The current code uses:

```js
404
```

for missing authentication and user-not-found situations.

For a missing/invalid authentication credential, `401 Unauthorized` is usually the more appropriate status.

For a valid authenticated user trying to access something they are not allowed to use, `403 Forbidden` is typically appropriate.

Mental model:

```text
401 -> prove who you are
403 -> I know who you are, but you cannot do this
```

## 15. Better middleware version

A cleaner version would look like:

```js
const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token

        if (!token) {
            return res.status(401).json({
                message: 'Authentication required'
            })
        }

        const decoded = jwt.verify(
            token,
            process.env.jwt_secret
        )

        const user = await User.findById(decoded.userId)

        if (!user) {
            return res.status(401).json({
                message: 'Invalid authentication'
            })
        }

        req.user = user
        next()
    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token'
        })
    }
}
```

This version makes one important principle explicit:

> Authentication failures should not accidentally continue into the protected controller.

## 16. Another design option: attach only the user ID

Instead of:

```js
req.user = user
```

you could do:

```js
req.userId = decoded.userId
```

Then individual controllers load the data they need.

This can reduce unnecessary database work if a protected route does not need the full user record.

There is no universal winner.

The important engineering question is:

> What information should this middleware establish for downstream handlers, and at what cost?

## 17. Interview questions

1. What is Express middleware?
2. What does `next()` do?
3. Why is authentication a good use case for middleware?
4. What does `req.user = user` accomplish?
5. What is the difference between authentication and authorization?
6. Why should you return after sending an error response?
7. Why is 401 generally different from 403?
8. Should authentication middleware always fetch the entire user from the database?
9. How would you compose multiple middleware functions?
10. How would you implement role-based authorization on top of this middleware?

## 18. Practice problems

### Beginner

1. Create a logger middleware that prints HTTP method and URL.
2. Create a middleware that validates a custom request header.
3. Protect a `/users/me` route using authentication middleware.

### Intermediate

4. Add an `isAdmin` middleware.
5. Add a request ID to `req.requestId`.
6. Create a middleware that validates required request-body fields.

### Advanced

7. Design middleware for API-key authentication.
8. Implement route-level permissions such as `post:delete`.
9. Design a middleware chain for rate limiting + authentication + authorization.
10. Explain how you would avoid loading the same user from MongoDB multiple times in a single request.

## 19. Further study

- Express middleware guide: https://expressjs.com/en/guide/using-middleware.html
- Express routing: https://expressjs.com/en/guide/routing.html
- HTTP authentication concepts: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Authentication

## Class summary

The key architectural change is this:

```text
Token verification
      |
      v
Authentication middleware
      |
      v
req.user
      |
      v
Any protected controller
```

We have now built a reusable authentication layer.

The next problem is transport: **how does the browser actually carry the JWT from one request to another, and what security properties do cookies give us?**

That is the focus of the next class.
