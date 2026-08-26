# Architecture — How the Authentication System Works End-to-End

This chapter is the place to connect the individual classes into one mental model.

## 1. Current backend structure

Based on the current repository, the backend is organized as:

```text
backend/
├── controllers/
│   └── user.controllers.js
├── middlewares/
│   └── authMiddleware.js
├── models/
│   ├── post.model.js
│   └── user.model.js
├── routes/
│   └── user.routes.js
├── utils/
│   └── genToken.js
├── index.js
├── package.json
└── .env
```

Each directory has a responsibility.

### `controllers/`

Controllers contain the application logic for handling a request and producing a response.

For example:

```js
export const loginUser = async (req, res) => {
    // validate request
    // find user
    // compare password
    // create token
    // send response
}
```

### `middlewares/`

Middleware contains reusable request-pipeline logic.

Authentication belongs here because many routes may need it.

### `models/`

Models describe how MongoDB documents are represented through Mongoose.

### `routes/`

Routes decide which controller/middleware chain handles each HTTP endpoint.

### `utils/`

Utilities contain reusable functions that do not belong to a single route.

`genToken.js` is a good example.

## 2. What `index.js` is doing

The application entry point imports:

```js
import express from "express";
import mongoose from "mongoose";
import dotenv from 'dotenv'
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";
```

Then:

```js
dotenv.config()
```

loads environment variables.

Next:

```js
const app = express()
```

creates the Express application.

The database connection is initialized using:

```js
mongoose.connect(process.env.dbURL)
```

Then middleware is registered:

```js
app.use(express.json())
app.use(cookieParser())
```

And the user router is mounted:

```js
app.use('/users', userRoutes)
```

Finally:

```js
app.listen(port, () => {
    console.log(`Server Started at ${port}`)
})
```

starts the HTTP server.

## 3. Why order matters

Middleware order is not just formatting.

For example:

```js
app.use(cookieParser())
app.use('/users', userRoutes)
```

means cookie parsing has been installed before routes that expect:

```js
req.cookies
```

If middleware is registered in the wrong place, later handlers may not see the data they expect.

## 4. Route composition

The user router contains:

```js
userRoutes.post('/register', resgiterUser)
userRoutes.post('/login', loginUser)
userRoutes.get('/me', isAuthenticated, getUser)
```

The `/users` prefix is added in `index.js`:

```js
app.use('/users', userRoutes)
```

Therefore:

```text
POST /users/register
POST /users/login
GET  /users/me
```

The third route is particularly important because it composes middleware and controller:

```text
GET /users/me
       |
       v
isAuthenticated
       |
       v
getUser
```

## 5. Registration sequence

Let's follow registration completely.

### Client

```http
POST /users/register
```

with:

```json
{
  "name": "A",
  "username": "a123",
  "email": "a@example.com",
  "password": "secret123"
}
```

### Controller receives body

```js
const { name, username, email, password } = req.body
```

### Input validation

```js
if (!username || !name || !password || !email) {
    return res.status(422).json({
        message: 'All fields Required!'
    })
}
```

### Duplicate username check

```js
const user = await User.findOne({ username })
```

### Duplicate email check

```js
const emailExists = await User.findOne({ email })
```

### Password hashing

```js
const hashedPassword = await bcrypt.hash(password, 10)
```

### Database write

```js
const newUser = await User.create({
    username,
    name,
    password: hashedPassword,
    email
})
```

### JWT creation

```js
const token = genToken(newUser._id)
```

### Cookie response

```js
res.cookie("token", token, cookieOptions)
```

The complete picture is:

```text
Browser
  |
  | registration data
  v
Express route
  |
  v
Controller
  |
  +--> validation
  |
  +--> Mongo checks
  |
  +--> bcrypt
  |
  +--> Mongo create
  |
  +--> JWT utility
  |
  +--> Set-Cookie
  |
  v
Browser
```

## 6. Login sequence

Login is similar but does not create a new user.

```text
credentials
   |
   v
find user by email
   |
   v
bcrypt.compare
   |
   +---- false -> reject
   |
   v
JWT generation
   |
   v
Set-Cookie
   |
   v
success response
```

The controller uses:

```js
const userExists = await User.findOne({ email })
```

and:

```js
const correctPassword = bcrypt.compareSync(
    password,
    userExists.password
)
```

A production implementation will generally prefer the asynchronous comparison API to avoid blocking the event-loop thread while doing password verification.

For example:

```js
const correctPassword = await bcrypt.compare(
    password,
    userExists.password
)
```

## 7. Protected `/me` request

Now imagine the user is already logged in.

The browser sends:

```http
GET /users/me
Cookie: token=...
```

Express processes:

```js
app.use(cookieParser())
```

Then routing finds:

```js
userRoutes.get('/me', isAuthenticated, getUser)
```

Authentication middleware extracts:

```js
const token = req.cookies.token
```

Verifies:

```js
const decoded = jwt.verify(
    token,
    process.env.jwt_secret
)
```

Finds the user:

```js
const user = await User.findById(decoded.userId)
```

Attaches it:

```js
req.user = user
```

and continues:

```js
next()
```

The controller then returns:

```js
res.status(200).json(req.user)
```

## 8. Why this architecture scales conceptually

Suppose tomorrow we add:

```text
POST /posts
DELETE /posts/:id
POST /comments
POST /follow
GET /feed
```

We do not need to copy-paste token verification into each controller.

We can write:

```js
router.post('/posts', isAuthenticated, createPost)
router.delete('/posts/:id', isAuthenticated, deletePost)
router.post('/comments', isAuthenticated, createComment)
router.post('/follow', isAuthenticated, followUser)
```

This is the main benefit of middleware-based authentication.

## 9. Layering mental model

I want you to think of a backend as layers, not as one giant `index.js` file.

```text
HTTP Layer
   |
   v
Routes
   |
   v
Middleware
   |
   v
Controller
   |
   v
Model / Database
```

Each layer answers a different question.

### Routes

> Which code handles this URL + HTTP method?

### Middleware

> What must be checked or prepared before the controller runs?

### Controller

> What should happen for this use case?

### Model / DB

> How do we read and write persistent data?

## 10. Separation of concerns

Imagine putting every piece of code into `index.js`:

```js
app.post('/login', async (req, res) => {
    // validation
    // DB query
    // bcrypt
    // JWT
    // cookie
    // response
})
```

That works for a tiny demo, but becomes difficult to maintain.

Our directory structure gives us clear responsibility boundaries.

The goal is not to create folders just to impress someone.

The goal is to make the system easier to reason about.

## 11. Production improvements I would make next

### Add centralized error handling

Instead of repeating:

```js
try {
   ...
} catch {
   res.status(500)...
}
```

we can use an Express error-handling middleware.

### Use async bcrypt comparison

Prefer:

```js
await bcrypt.compare(...)
```

over the synchronous API inside request handlers.

### Do not expose password hashes

Never return the Mongoose user object directly if it includes password hashes.

### Add database-level uniqueness carefully

Our schema uses:

```js
unique: true
```

for username and email.

Remember that application checks and database indexes solve different parts of the problem. Concurrent requests can still race, so the database must be trusted as the final uniqueness boundary.

### Add input validation library / schema

For larger systems, use a validation layer such as Zod, Joi, or another schema-validation approach.

### Add rate limiting

Especially for:

```text
/login
/register
/password reset
```

because attackers can repeatedly automate these endpoints.

## 12. Potential architecture evolution

As the project grows, a clean backend might become:

```text
backend/
├── config/
├── controllers/
├── middlewares/
├── models/
├── routes/
├── services/
├── validators/
├── utils/
├── app.js
└── server.js
```

A service layer can isolate business logic from HTTP-specific concerns.

For example:

```text
controller
   |
   v
userService.login(...)
   |
   +--> repository/model
   +--> password service
   +--> token service
```

Do not introduce every layer prematurely. Introduce abstractions when the complexity actually justifies them.

## 13. Interview questions

1. Explain the complete request lifecycle in this backend.
2. Why do we separate routes, middleware and controllers?
3. What is the role of a service layer?
4. Where should validation happen?
5. Where should authentication happen?
6. How would you structure a large Express application?
7. Why might synchronous bcrypt APIs be problematic in Node.js servers?
8. What happens if two users simultaneously register the same username?
9. How would you centralize API error handling?
10. How would you test this architecture?

## 14. Architecture exercise

Draw this from memory:

```text
Client
  |
  v
Express
  |
  +--> JSON parser
  |
  +--> Cookie parser
  |
  +--> Router
          |
          +--> Auth middleware
          |       |
          |       +--> JWT verify
          |       +--> Mongo user lookup
          |       +--> req.user
          |
          +--> Controller
                  |
                  v
                Model
                  |
                  v
               MongoDB
```

If you can explain every arrow without looking at the notes, you understand the architecture.
