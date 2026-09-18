# Social Media A-2029 — Master Feature & Commit Roadmap

## What stage is this repo?
This is the mature/reference implementation. It starts from authentication and progresses into profile, follow/unfollow, edit profile, Multer, and Cloudinary.

## Feature timeline
| Stage | Key commits | Concepts |
|---|---|---|
| Auth | 84d0c70 → 848fc24 | registration, bcrypt, JWT, cookies |
| Frontend auth | 7e5d13f → 1ed42e4 | AuthContext, PublicRoute, ProtectedRoute |
| Debug/security | c880fb1, auth hardening, XSS/CSRF demos | lifecycle, browser security |
| Profile | a2931350 → b05b8a8 | dynamic route, get profile, UI |
| Social graph | 09c79f9 → 4f9461e | follow/unfollow, `$addToSet`, `$pull`, `populate()` |
| Edit profile | e2c455a → 2fe0107 | controlled form, update API |
| Media | 47d3b2d → f05c8ae | Multer, memoryStorage, Cloudinary, secure URL |

## Follow/unfollow: the mental model
For A following B:
```text
A.followings = [B]
B.followers  = [A]
```
Think of it as two address books: “people I follow” and “people who follow me”. The implementation uses `$addToSet` to make insertion idempotent and `$pull` to remove the relationship.

### Why two arrays?
It makes both common reads cheap: following-list for the current user and follower-list for a profile. The trade-off is write-side consistency because one logical action updates two documents.

### Interview angle
Ask: “What can go wrong between the two updates?” A partial write can leave the graph inconsistent. Discuss MongoDB transactions or another consistency strategy.

## `populate()` analogy
MongoDB stores an ObjectId like a contact ID. `populate()` is the address-book lookup that turns that ID into a small display object. The profile API intentionally selects only `name`, `username`, and `profileImage` for related users.

## Dynamic profile routing
```text
/profile/:username
   ↓
useParams()
   ↓
GET /users/profile/:username
   ↓
req.params.username
   ↓
User.findOne({ username })
```
A profile bug is usually a contract mismatch somewhere in this chain, not necessarily a React Router problem.

## Edit profile
The UI owns temporary form state; the server owns truth. The server validates required fields, normalises username/email, enforces uniqueness excluding the current `_id`, and removes password from the response.

## File upload
```text
Browser multipart/form-data
        ↓
      Multer
        ↓ req.file
    Cloudinary
        ↓ secure_url
      MongoDB
```
Analogy: Multer is the warehouse receiving desk; Cloudinary is the warehouse; MongoDB is the catalogue.

Why memoryStorage? Because the file bytes are passed directly to Cloudinary, so a temporary disk file is unnecessary. Trade-off: memory usage must be bounded by size limits and infrastructure capacity.

## Security / best practices
- Frontend route guards improve UX; backend auth is the security boundary.
- Never expose password hashes.
- Keep JWT secrets in environment variables.
- Use Secure/appropriate SameSite cookie settings in production.
- Validate upload type and size on the server.
- Consider transactions for multi-document relationship updates.
- Consider orphaned-image cleanup when replacing profile pictures.
- Add rate limiting and integration tests for auth/follow APIs.

## Interview questions
1. Why hash rather than encrypt passwords?
2. What does a JWT prove and what does it not prove?
3. Why HttpOnly cookies?
4. `$push` vs `$addToSet`?
5. Why store both followers and followings?
6. What does `populate()` do?
7. Why can frontend ProtectedRoute never replace backend authorization?
8. Why multipart/form-data for images?
9. Why memoryStorage?
10. How would you make follow/unfollow atomic?
11. How would you prevent duplicate follows under concurrent requests?
12. How would you safely replace an existing Cloudinary image?

## Debugging checklist
Route → HTTP method → params/body → auth middleware → `req.user` → DB query/update → response shape → React state → loading/redirect lifecycle → browser Network/Cookies.
