# Edit Profile — Deep Dive

## Commit progression
- e2c455a — edit profile form
- 24a5d48 — profile picture picker
- 2fe0107 — backend-backed update stage

## Controlled form mental model
```text
input → onChange → React state → render
```
Analogy: React keeps the master spreadsheet for the whole form instead of every input keeping a private notebook.

## Server data vs draft data
Existing profile values initialise a temporary draft. The database remains canonical until the update request succeeds.

## Unique username/email
When checking uniqueness for an edit, exclude the current user:
```text
username == newUsername
AND
_id != currentUserId
```
Otherwise the user collides with their own existing record.

## Server owns truth
Client validation improves UX; it is not the security boundary. Backend validation must repeat required checks, normalization, uniqueness and authorization.

## Image preview
`URL.createObjectURL(file)` creates a temporary browser preview URL.
```text
preview URL ≠ permanent uploaded URL
```
The preview only proves the browser has the file.

## Common beginner bug
```text
setUserData(...) → changes React memory
API request      → persists on server
```
A UI can look updated while refresh reveals nothing was actually saved.

Analogy: changing the label on your photocopy does not change the original document in the office archive.

## Interview questions
1. Controlled vs uncontrolled input?
2. Why exclude current _id in uniqueness checks?
3. Why validate client and server?
4. What is createObjectURL?
5. Why is preview not persistence?
6. PATCH vs PUT?
7. How would you prevent lost updates?
8. How would you send text plus image?

## Best practices
Use PATCH semantics for partial updates, normalize server-side, return canonical updated data, revoke preview URLs, and restrict editable fields.
