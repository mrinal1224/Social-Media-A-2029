# Social Media A-2029 — Class-wise Course Notes

These notes are organized around the actual **teaching day**, not individual topics. Every calendar day represented in the Git history is treated as one class, and all meaningful commits from that day are grouped into that class.

## How the notes are organized

```text
notes/
├── README.md
├── Class-01-24-08-2026.md
└── Class-02-25-08-2026.md
```

The rule is simple:

> **One teaching day = one class file.**

If a day contains multiple commits, those commits belong to the same class and are explained together as one progression.

## Recovered class progression

| Class | Date | Commits / milestones covered |
|---|---|---|
| Class 01 | 24 August 2026 | `salt generation` |
| Class 02 | 25 August 2026 | `Push JWT` → `push User Decoded` → `feat (Cookies and server auth)` |

The 25 August commits are intentionally combined into **one class**, because they happened on the same teaching day and represent one continuous authentication lesson.

## What each class contains

Each class note is written as a teaching narrative rather than a reference manual. It includes:

- What we built during that class
- The complete commit progression for the day
- Why we made each change
- Before/after folder architecture
- Every important file and code snippet
- Line-by-line reasoning where it helps
- Request/response flow
- Real-life analogies where they make the idea easier
- Common mistakes and debugging points
- Production-grade improvements
- Better practices and engineering trade-offs
- Interview questions
- Additional implementation exercises
- Resources for deeper study
- A final mental model / revision section

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
│   │   └── genToken.js
│   ├── index.js
│   ├── package.json
│   └── .env
└── frontend/
    └── vite-project/
```

## Big-picture authentication flow

```text
REGISTRATION
Client
  -> POST /users/register
  -> validate input
  -> check username/email
  -> bcrypt hash password
  -> save user
  -> generate JWT
  -> set authentication cookie

LOGIN
Client
  -> POST /users/login
  -> find user by email
  -> bcrypt.compare(password, stored hash)
  -> generate JWT
  -> set authentication cookie

PROTECTED REQUEST
Client
  -> GET /users/me
  -> browser sends cookie
  -> cookie-parser exposes req.cookies.token
  -> authentication middleware verifies JWT
  -> middleware loads current user
  -> middleware attaches req.user
  -> controller responds
```

## Important distinction

The notes preserve the actual classroom implementation, but they also explicitly call out places where the implementation can be improved for production. This is intentional: learners should understand both **what we wrote** and **why an experienced engineer may change it**.

## Security checklist

- Never store plaintext passwords.
- Never commit real production secrets.
- Prefer HttpOnly authentication cookies for appropriate browser architectures.
- Use Secure cookies over HTTPS in production.
- Choose SameSite deliberately and understand the CSRF model.
- Return immediately after sending an error response.
- Never expose password hashes through API responses.
- Keep JWT payloads small and non-sensitive.
- Use appropriate token expiry and logout/revocation semantics.
- Validate input at the API boundary.
