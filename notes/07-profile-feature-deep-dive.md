# Profile Feature — Deep Dive

## Commit progression
- a2931350 — get user details API
- 16cbdf4 — create profile UI
- b05b8a8 — profile section built

## Core problem
Before profile, the application mainly answered: “am I logged in?” Profile adds: “which user's resource am I viewing?”

## Full request chain
```text
/profile/james123
      ↓
/profile/:username
      ↓
useParams() → username = james123
      ↓
GET /users/profile/james123
      ↓
Express req.params.username
      ↓
User.findOne({ username })
      ↓
JSON response
      ↓
setUserData()
      ↓
Profile UI
```

### Analogy
`/profile/:username` is a hotel address template. `james123` is the room identifier supplied at runtime.

## Why /users/me is different
`/users/me` means “give me the current authenticated identity.”
`/users/profile/:username` means “give me the resource identified by this username.”

A logged-in user can therefore browse many profiles without changing who they are authenticated as.

## Frontend responsibility
The profile page reads the parameter, makes the request, keeps a loading state, and renders the result.

Loading is not the same as “profile missing”.

```text
LOADING → request pending
SUCCESS → profile data exists
ERROR   → request failed / user not found
```

### Analogy
You cannot say “the parcel is missing” while the courier database is still searching for it.

## Backend responsibility
The backend reads `req.params.username`, queries MongoDB, and excludes the password from the response. A public profile representation must not accidentally become an authentication-secret endpoint.

## Why API-first?
The commit progression starts with the backend contract and then introduces the UI. This allows backend testing before React becomes part of the debugging surface.

```text
backend contract
      ↓
minimal client
      ↓
feature UI
```

## Debugging useParams()
When `useParams()` appears empty, check in this order:
1. Browser URL.
2. App route definition.
3. Whether ProtectedRoute redirected before Profile mounted.
4. Value returned by useParams().
5. Axios request URL.
6. Express req.params.
7. MongoDB lookup.

A “useParams bug” is often a routing or authentication lifecycle bug upstream.

## Interview questions
1. Route params vs query params vs body?
2. Why separate /users/me from /users/profile/:username?
3. Why exclude password?
4. Why is loading a distinct state?
5. Username vs ObjectId in the URL?
6. How would you index username?
7. How do you distinguish 404 from network failure?
8. What happens if username becomes editable?

## Best practices
- Unique index on username.
- Validate/normalize usernames.
- Return only required profile fields.
- Consistent API response shape.
- Explicit 404 handling.
- Consider request cancellation for long-lived components.
