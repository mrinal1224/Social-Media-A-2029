# Social Media A-2029 — Class-wise Course Notes

These notes are organized around the actual **teaching day**, not individual topics. Every calendar day represented in the Git history is treated as one class, and all meaningful commits from that day are grouped into that class.

## How the notes are organized

```text
notes/
├── README.md
├── Class-01-24-08-2026.md
├── Class-02-25-08-2026.md
├── Class-03-31-08-2026.md
├── Class-04-01-09-2026.md
├── Class-05-02-09-2026.md
└── Class-06-03-09-2026.md
```

The rule is simple:

> **One teaching day = one class file.**

If a day contains multiple commits, those commits belong to the same class and are explained together as one progression.

## Recovered class progression

| Class | Date | Commits / milestones covered |
|---|---|---|
| Class 01 | 24 August 2026 | Password hashing, salt and bcrypt |
| Class 02 | 25 August 2026 | JWT → decoded user → cookies and server authentication |
| Class 03 | 31 August 2026 | Frontend/backend auth integration, Axios credentials, AuthContext foundations, environment consistency |
| Class 04 | 1 September 2026 | AuthContext, PublicRoute/ProtectedRoute, navigation, Hooks bug, login/signup flow fixes |
| Class 05 | 2 September 2026 | Auth hardening, response contracts, JWT configuration, logout, `.env` hygiene and debugging |
| Class 06 | 3 September 2026 | Final authentication integration, verification matrix, security hygiene and full-stack debugging methodology |

The newer classes are intentionally grouped around the actual commit progression rather than splitting every fix into a separate lesson. The goal is to show learners how a feature evolves in a real repository: **implement → run → observe → debug → stabilise**.

## What each class contains

Each class note is written as a teaching narrative rather than a reference manual. It includes:

- What we built during that class
- The complete commit progression for the day
- Why we made each change
- Before/after architecture
- Important files and code snippets
- Step-by-step implementation reasoning
- Request/response flows
- Real-life analogies where they clarify the concept
- Common mistakes and the bugs they create
- A systematic debugging procedure
- Production improvements and engineering trade-offs
- Interview questions
- Deliberate bug-injection exercises
- A final implementation task
- A final mental model for revision

## Current project architecture

```text
Social-Media-A-2029/
├── backend/
│   ├── controllers/
│   │   └── user.controllers.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── post.model.js
│   │   └── user.model.js
│   ├── routes/
│   │   └── user.routes.js
│   ├── utils/
│   │   └── generateToken.js
│   ├── index.js
│   ├── package.json
│   └── .env.example
└── frontend/
    └── vite-project/
        └── src/
            ├── axiosCalls/
            │   └── axios.js
            ├── components/
            │   ├── ProtectedRoute.jsx
            │   └── PublicRoute.jsx
            ├── context/
            │   └── AuthContext.jsx
            ├── pages/
            │   ├── Login.jsx
            │   ├── SignUp.jsx
            │   └── Home.jsx
            └── App.jsx
```

The current repository contains both backend authentication infrastructure and the React authentication integration built on top of it. fileciteturn7file0

## Big-picture authentication flow

```text
REGISTRATION
Client
  -> POST /users/register
  -> validate input
  -> normalise email
  -> check username/email
  -> bcrypt hash password
  -> save user
  -> generate JWT
  -> set authentication cookie
  -> return public user object

LOGIN
Client
  -> POST /users/login
  -> normalise email
  -> find user
  -> bcrypt.compare(password, stored hash)
  -> generate JWT
  -> set authentication cookie
  -> return public user object

SESSION RESTORATION
React starts
  -> AuthContext loading=true
  -> GET /users/me
  -> browser sends cookie
  -> cookie-parser exposes req.cookies.token
  -> auth middleware verifies JWT
  -> middleware loads current user
  -> middleware attaches req.user
  -> /users/me returns user
  -> AuthContext sets user
  -> loading=false

ROUTING
AuthContext
  -> PublicRoute for guest pages
  -> ProtectedRoute for authenticated pages

LOGOUT
Client
  -> POST /users/logout
  -> clear cookie
  -> setUser(null)
```

The current backend route structure exposes `/register`, `/login`, `/logout` and `/me`, with authentication middleware protecting the session-dependent endpoints. fileciteturn19file0

## The most important mental model

Authentication is not one feature living in one file.

It is a chain of contracts:

```text
React form
    ↕
Axios
    ↕
HTTP request/response
    ↕
Express route
    ↕
Controller
    ↕
JWT + Cookie
    ↕
Browser
    ↕
Auth middleware
    ↕
MongoDB user
    ↕
AuthContext
    ↕
Route guards
```

A system can have perfectly correct individual files and still fail because **two layers disagree**.

That is why these notes spend significant time on debugging, response shapes, environment names, cookie configuration, lifecycle timing and routing behaviour rather than only showing final code.

## Security checklist

- Never store plaintext passwords.
- Prefer a dedicated password-hashing algorithm rather than a general-purpose fast hash.
- Never commit real production secrets.
- Keep `.env` out of version control and provide a safe `.env.example` template.
- Remember that `.gitignore` does not erase secrets already committed to history.
- Rotate credentials that have been exposed.
- Use HttpOnly authentication cookies for appropriate browser architectures.
- Use Secure cookies over HTTPS in production.
- Choose SameSite deliberately and understand the CSRF model.
- Return immediately after sending an authentication error response.
- Never expose password hashes through API responses.
- Keep JWT payloads small and non-sensitive.
- Never trust an unverified JWT payload for authentication decisions.
- Keep frontend route protection separate from backend API authorization.
- Use consistent JWT environment configuration for signing and verification.
- Validate and normalise input at the API boundary.
- Test both happy paths and failure paths.

## Teaching philosophy of the notes

The goal is not to produce learners who can copy:

```js
jwt.sign(...)
```

or:

```jsx
<ProtectedRoute>...</ProtectedRoute>
```

The goal is to produce learners who can explain:

```text
Why is this code needed?
What happens if I remove it?
Which layer owns this responsibility?
What observable symptom would appear?
How do I prove the root cause?
What is the minimal correct fix?
```

Every class therefore ends with a practical instruction:

> **Implement the complete section yourself. Break it deliberately. Debug it deliberately. Then make it work again.**

That is the standard we should carry forward as the project moves from authentication into the actual social-media features.