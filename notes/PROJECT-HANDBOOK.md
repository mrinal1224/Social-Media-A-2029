# Social Media A-2029 — Project Implementation Handbook

> Mature-stage feature notes based on the actual repository implementation.

## 1. Architecture

React → Axios/Cookies → Express → Auth Middleware → Controllers → MongoDB / Cloudinary → Response → React state.

The major architectural separation is application data vs binary media. MongoDB stores metadata/reference; Cloudinary stores media.

## 2. User and social graph

A user contains identity fields, profile metadata, followers, followings, posts, stories, reels and a profile image reference.

For A following B:

A.followings = [B]
B.followers = [A]

This is a directed graph. `$addToSet` avoids duplicate relationship references; `$pull` removes them.

## 3. Profile API

`GET /users/profile/:username` finds a profile and populates followers/followings with selected public fields.

`populate()` is like resolving contact IDs into small display cards. Select only fields the UI needs.

## 4. Edit profile

Edit flow:

Edit form → controlled React state → authenticated request → validation → username/email normalisation → uniqueness checks → optional upload → MongoDB update → response → UI.

The uniqueness query excludes the current user's `_id`. Otherwise saving your own existing username would incorrectly look like a duplicate.

## 5. Controlled forms

Inputs use React state as the source of current form values.

Input event → state → render → submit.

This makes validation, reset, dirty-state handling and conditional UI easier.

## 6. Image preview

`URL.createObjectURL(file)` creates a temporary browser-side preview URL.

Object URL is not permanent storage. The persisted image URL is created by Cloudinary after upload.

## 7. Multer

The update route uses `upload.single('profileImage')`.

Browser sends multipart/form-data → Multer parses the request → `req.file` contains file metadata and buffer.

The project uses memory storage, image MIME validation and a 5 MB size limit.

Why memory storage? The next destination is Cloudinary, so a temporary disk file is unnecessary.

Trade-off: RAM is finite. File limits are essential.

## 8. Cloudinary

Media pipeline:

Browser → multipart/form-data → Multer → buffer → Cloudinary → secure_url → MongoDB.

Analogy: MongoDB is the catalogue; Cloudinary is the warehouse and delivery layer.

Storing a URL keeps user documents small and separates media concerns from application data.

## 9. Auth + profile update

The backend uses `req.user._id` for the update rather than trusting an arbitrary user id from the browser.

Authentication answers: Who are you?
Authorization answers: What are you allowed to modify?

That separation is critical.

## 10. Response sanitisation

Profile data excludes the password field. General rule: return only the fields the client needs.

## 11. Follow/unfollow consistency

One follow changes two documents. That means a logical action contains multiple writes.

Production discussion: what happens if the first update succeeds and the second fails? Consider transactions or another consistency strategy.

## 12. Debugging profile upload

file selected?
→ FormData correct?
→ field name `profileImage`?
→ Multer created `req.file`?
→ MIME/size accepted?
→ Cloudinary succeeded?
→ `secure_url` returned?
→ MongoDB saved it?
→ UI refreshed?

Use the pipeline, not guesswork.

## 13. Production upgrades

- dedicated request validation;
- central error middleware;
- rate limiting;
- integration tests;
- transaction/consistency strategy for multi-document relationship writes;
- old Cloudinary asset cleanup when replacing an image;
- image resize/compression;
- structured logs and monitoring;
- stronger authorization boundaries.

## 14. Interview questions

1. Why store media outside MongoDB?
2. What does Multer do?
3. Why multipart/form-data?
4. Why memoryStorage?
5. Why validate MIME type and file size?
6. Why store a secure URL instead of binary data?
7. What does populate do?
8. Why exclude the password from profile responses?
9. Why use req.user._id for updates?
10. What if Cloudinary succeeds but MongoDB update fails?
11. How would you make follow/unfollow atomic?
12. How would you safely replace an old profile image?
13. How would you test the complete upload flow?
14. How would you rate-limit relationship endpoints?

## 15. Advanced exercises

- Add old-image cleanup.
- Add remove-profile-picture.
- Validate image dimensions.
- Convert relationship writes into a transaction.
- Add integration tests for edit profile.
- Build a reusable media service.
- Add optimistic follow/unfollow with rollback.

## Final architecture

React → Axios/Cookie → Express → Auth Middleware → Controller → MongoDB / Cloudinary → Response → React.