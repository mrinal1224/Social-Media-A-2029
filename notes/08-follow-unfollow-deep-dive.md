# Follow / Unfollow — Deep Dive

## Commit progression
- 09c79f9 — complete follow logic
- f9d50fa — follow/unfollow routes
- 1a60375 — follow/unfollow UI
- 84e36d2 — references for populate
- 1d49040 — simplify profile follow state
- b6c8482 — hide follow on own profile
- 9068926 — controller merge-conflict fix
- 4f9461e — populate followers/following

## Social graph
For A following B:
```text
A.followings = [B]
B.followers  = [A]
```
Think of two address books: “people I follow” and “people following me”.

## Why ObjectId references?
Store User IDs instead of copying full user objects. Otherwise names/profile images can become stale in many places.

## Follow algorithm
```text
1. current user = req.user
2. target user = req.params.id
3. reject self-follow
4. verify target exists
5. reject duplicate relation
6. current.followings += target
7. target.followers += current
```

## Why $addToSet?
`$push` blindly appends; `$addToSet` adds only if the value is absent.

```text
[B] + push(B)     → [B, B]
[B] + addToSet(B) → [B]
```

Analogy: `$push` writes a guest name without checking; `$addToSet` checks the list first.

## Unfollow
Use `$pull` on both arrays to remove the relationship.

## Domain validation
Self-follow must be rejected. Database-valid does not necessarily mean domain-valid.

## populate()
Raw data:
```text
followers: [ObjectId, ObjectId]
```
UI-friendly data:
```text
[{name, username, profileImage}, ...]
```
`populate()` resolves references and can select only required fields.

Analogy: ObjectId is a contact ID; populate opens the address book and fetches the contact card.

## Two-write consistency problem
A follow operation updates two user documents. If only one update succeeds:
```text
A.followings = [B]
B.followers  = []
```
The relationship is inconsistent.

Production discussion: transactions, separate Follow collection, or another consistency model.

## Scaling discussion
For a teaching project, arrays are easy to understand. At large scale, a relationship collection is often easier to paginate/query:
```js
{ followerId, followingId, createdAt }
```
with an appropriate uniqueness constraint.

## Interview questions
1. `$push` vs `$addToSet`?
2. Why two arrays?
3. When would you use a separate Follow collection?
4. How do you make follow idempotent?
5. What happens with concurrent follow requests?
6. How do you make two writes atomic?
7. What does populate do?
8. Why paginate followers?
9. How would you count followers efficiently?
10. How would you rate-limit abuse?

## Best practices
Pagination, rate limiting, integration tests, duplicate/self-follow tests, atomicity/transaction strategy, consistent authorization.
