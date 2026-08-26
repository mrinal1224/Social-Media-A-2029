# Social Media A-2029 — Class-wise Course Notes

These notes reconstruct the learning journey from the actual Git history of this repository and explain not only what was implemented, but why it was implemented, how the request flows through the system, what production-grade improvements should be made, and how to practise the concepts further.

## How to use these notes

Read the classes in order. Each class contains:

- What we built in the project
- Why the concept exists
- The relevant project architecture
- Code walkthroughs
- Real-world intuition where useful
- Common mistakes and debugging points
- Production / industry best practices
- Interview questions
- Practice problems
- Resources for deeper study

## Project architecture

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
│   │   └── genToken.js
│   ├── index.js
│   ├── package.json
│   └── .env
└── frontend/
    └── vite-project/
```

## Recovered class progression

| Date | Class / milestone | Git milestone |
|---|---|---|
| 24 Aug 2026 | Password hashing and salt | `salt generation` |
| 25 Aug 2026 | JWT generation and verification | `Push JWT` |
| 25 Aug 2026 | Decoded user and authenticated request flow | `push User Decoded` |
| 25 Aug 2026 | Cookies and server-side authentication | `feat (Cookies and server auth)` |

The repository currently has the authentication portion of the course represented most clearly in its Git history. The notes therefore focus deeply on this recovered sequence rather than inventing classes that are not represented by the code/history.

## Important note

Some code in the project is intentionally classroom-oriented. The notes explicitly distinguish between **what we wrote in class** and **what I would change in a production system** so that the learner understands both the implementation and the engineering trade-offs.

## Class files

- [Class 01 — Password Hashing, Salt and bcrypt](./01-password-hashing-and-bcrypt.md)
- [Class 02 — JWT: Tokens, Signing and Verification](./02-jwt-authentication.md)
- [Class 03 — Decoded User, Middleware and Request Context](./03-auth-middleware-and-decoded-user.md)
- [Class 04 — Cookies, HttpOnly and Server-side Authentication](./04-cookies-and-server-auth.md)
- [Architecture — Authentication Request Lifecycle](./05-authentication-architecture.md)
- [Practice — Authentication Problem Set](./06-practice-problems.md)

## Quick mental model

```text
REGISTER
Client
  -> POST /users/register
  -> validate input
  -> check existing user
  -> bcrypt hash password
  -> save user
  -> generate JWT
  -> send JWT as cookie

LOGIN
Client
  -> POST /users/login
  -> find user by email
  -> bcrypt.compare(password, storedHash)
  -> generate JWT
  -> send JWT as cookie

PROTECTED REQUEST
Client
  -> GET /users/me
  -> browser sends cookie
  -> cookie-parser exposes req.cookies.token
  -> middleware verifies JWT
  -> middleware loads user from DB
  -> middleware attaches req.user
  -> controller sends req.user
```

## Security checklist to remember

- Never store plaintext passwords.
- Never commit real secrets to Git.
- Prefer `httpOnly` cookies for browser-based authentication when the architecture supports it.
- Use `secure: true` over HTTPS in production.
- Choose `sameSite` deliberately and understand the CSRF implications.
- Return immediately after sending an error response.
- Do not expose password hashes in API responses.
- Use generic login errors when account enumeration is a concern.
- Validate input at the API boundary.
- Keep JWT payloads small and non-sensitive.
- Use an appropriate token expiration strategy and provide logout / revocation semantics.
