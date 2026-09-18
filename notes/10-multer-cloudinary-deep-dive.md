# Multer + Cloudinary — Deep Dive

## Commit progression
- 47d3b2d — Multer middleware
- a158059 — image processed through Multer
- f05c8ae — secure URL persisted

## Why multipart/form-data?
JSON is designed for structured text/data. Browser file uploads are normally sent as multipart/form-data.

```text
Browser
  ↓ multipart/form-data
Multer
  ↓ req.file
Controller
  ↓ buffer
Cloudinary
  ↓ secure_url
MongoDB
```

## Multer's job
Multer parses the multipart request and exposes the file to Express. `upload.single("profileImage")` declares one expected file field.

### Analogy
Multer is the warehouse receiving desk. It receives, checks and hands the package to the next service.

## Why memoryStorage?
The repo uses memoryStorage because the bytes are immediately passed into Cloudinary. No temporary disk file is required.

Trade-off: memory must remain bounded by upload limits and infrastructure capacity.

## File filtering
The middleware checks for an image MIME type. Useful first validation, but MIME metadata alone is not full content validation for a hardened production system.

## Why a 5 MB limit?
Without a server-side limit a client could send huge payloads and pressure the Node process memory.

Analogy: security says “maximum parcel weight is 5 kg” before accepting it.

## Cloudinary architecture
MongoDB stores the reference; Cloudinary stores/delivers the asset.
```text
MongoDB = catalogue
Cloudinary = warehouse
```

## Failure scenario
What if Cloudinary succeeds but MongoDB update fails? You may create an orphaned asset. Production systems need cleanup/reconciliation strategy.

## Production hardening
Rate-limit uploads, validate actual content/signatures, resize/compress, restrict dimensions, handle provider failures, keep provider secrets server-side, and clean up replaced assets.

## Interview questions
1. Why multipart/form-data?
2. What does Multer do?
3. What is req.file.buffer?
4. Why memoryStorage?
5. What happens when the limit is exceeded?
6. Why store URL instead of raw image data?
7. What does stream upload solve?
8. What if Cloudinary succeeds and MongoDB fails?
9. How would you validate an image securely?
10. How would you replace an old profile image safely?
