# Deploying the MERN Social Media App for Free

> **Student Deployment Guide**
>
> This guide is written for the same project structure used in the Social Media classroom project:
>
> ```text
> project-root/
> ├── backend/
> │   ├── index.js
> │   ├── package.json
> │   ├── controllers/
> │   ├── models/
> │   ├── routes/
> │   ├── middlewares/
> │   ├── utils/
> │   └── socket.js
> │
> └── frontend/
>     └── vite-project/
>         ├── package.json
>         ├── src/
>         ├── vite.config.js
>         └── index.html
> ```
>
> The application uses:
>
> - React + Vite
> - Redux
> - Node.js
> - Express
> - MongoDB
> - JWT authentication using an `httpOnly` cookie
> - Multer
> - Cloudinary
> - Socket.IO
> - Real-time notifications
>
> We will deploy the complete application without requiring a paid server.

---

## 1. Final Deployment Architecture

We will use the following services:

| Part | Service | Purpose |
|---|---|---|
| Source Code | GitHub | Store the project |
| Frontend | Vercel | Host React/Vite |
| Backend | Render | Host Express + Socket.IO |
| Database | MongoDB Atlas | Store users, posts, comments, notifications, etc. |
| Media | Cloudinary | Store images and videos |

Final architecture:

```text
                         USER
                          │
                          ▼
                 ┌─────────────────┐
                 │     Vercel      │
                 │   React / Vite  │
                 └────────┬────────┘
                          │
                 HTTPS + Socket.IO
                          │
                          ▼
                 ┌─────────────────┐
                 │     Render      │
                 │ Express + Node  │
                 │    Socket.IO    │
                 └───────┬─────────┘
                         │
               ┌─────────┴───────────┐
               ▼                     ▼
       ┌───────────────┐     ┌───────────────┐
       │ MongoDB Atlas │     │  Cloudinary   │
       │   Database    │     │ Images/Videos │
       └───────────────┘     └───────────────┘
```

---

# 2. Before You Deploy

Before deploying, make sure:

- Your complete project is pushed to GitHub.
- The frontend works locally.
- The backend works locally.
- MongoDB connects successfully.
- Login/register works.
- Image upload works.
- Posts/reels work.
- Socket.IO works locally.
- Your `.env` file is **not pushed to GitHub**.

Run:

```bash
git status
```

Make sure `.env` does not appear as a file waiting to be committed.

Your `.gitignore` should contain something similar to:

```gitignore
node_modules
.env
.env.*
!.env.example
dist
.DS_Store
```

Never push:

```text
MongoDB passwords
JWT secrets
Cloudinary API secrets
API keys
```

---

# 3. Make the Backend Deployment Ready

The local project currently assumes:

```text
Frontend → http://localhost:5173
Backend  → http://localhost:8084
```

These URLs will change after deployment.

We therefore need to move deployment-specific values into environment variables.

---

## 3.1 Add a Production Start Script

Open:

```text
backend/package.json
```

Add a `start` script.

Example:

```json
{
  "name": "backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  }
}
```

Do not remove your dependencies.

Render will eventually execute:

```bash
npm start
```

which will execute:

```bash
node index.js
```

---

# 4. Make the Port Dynamic

Locally we may use:

```js
const port = 8084;
```

A cloud provider decides which port your application should use.

Change it to:

```js
const port = process.env.PORT || 8084;
```

Now:

```text
Local Machine
PORT missing
        ↓
uses 8084
```

while:

```text
Render
PORT provided by Render
        ↓
uses Render's port
```

At the bottom of `backend/index.js`, use:

```js
httpServer.listen(port, "0.0.0.0", () => {
    console.log(`Server Started at ${port}`);
});
```

---

# 5. Fix Production CORS

Your frontend will eventually look something like:

```text
https://your-project.vercel.app
```

while your backend may look like:

```text
https://your-project-api.onrender.com
```

The backend must explicitly allow the frontend origin.

In `backend/index.js`, create:

```js
const allowedOrigins = [
    "http://localhost:5173",
    process.env.CLIENT_URL
].filter(Boolean);
```

Create a reusable CORS configuration:

```js
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
};
```

Use it with Express:

```js
app.use(cors(corsOptions));
```

---

# 6. Fix Socket.IO CORS

Socket.IO also needs permission to connect from the deployed frontend.

Instead of:

```js
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true
    }
});
```

use:

```js
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});
```

Your frontend and Socket.IO backend can now communicate in both:

```text
LOCAL DEVELOPMENT
http://localhost:5173
```

and:

```text
PRODUCTION
https://your-project.vercel.app
```

---

# 7. Add a Health Route

This is optional, but strongly recommended.

Add this before the error middleware:

```js
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "Server is running"
    });
});
```

After deployment we can visit:

```text
https://your-backend.onrender.com/health
```

and immediately verify whether the server is alive.

---

# 8. Fix Authentication Cookies for Production

This application uses an `httpOnly` JWT cookie.

Locally we currently use settings similar to:

```js
sameSite: "lax",
secure: false
```

That is fine when working locally.

However, after deployment:

```text
Frontend = vercel.app
Backend  = onrender.com
```

They are different sites.

Use environment-aware cookie configuration.

In:

```text
backend/controllers/user.controllers.js
```

create:

```js
const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000
};
```

Then continue using:

```js
res.cookie("token", token, cookieOptions);
```

For logout, make sure the same cookie properties are used:

```js
res.clearCookie("token", {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/"
});
```

### Why?

Production cookies sent between different HTTPS sites require:

```text
SameSite=None
Secure=true
```

Localhost does not.

---

# 9. Backend Environment Variables

Update:

```text
backend/.env.example
```

to:

```env
dbURL=your-mongodb-connection-string

JWT_SECRET=your-jwt-secret

CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

CLIENT_URL=http://localhost:5173

NODE_ENV=development
```

Your real:

```text
backend/.env
```

should never be committed.

---

# 10. Make Axios Deployment Ready

Open:

```text
frontend/vite-project/src/axiosCalls/axios.js
```

Instead of:

```js
baseURL: "http://localhost:8084/"
```

use:

```js
import axios from "axios";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:8084";

const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

export default axiosInstance;
```

Now the URL can be changed without modifying source code.

---

# 11. Make Socket.IO Client Deployment Ready

Open:

```text
frontend/vite-project/src/socket.js
```

Instead of:

```js
io("http://localhost:8084")
```

use:

```js
import { io } from "socket.io-client";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:8084";

const socket = io(API_URL, {
    autoConnect: false,
    withCredentials: true
});

export default socket;
```

Notice that the same environment variable is used for:

```text
Axios
Socket.IO
```

That keeps the setup simple.

---

# 12. Create a Frontend Environment Example

Inside:

```text
frontend/vite-project/
```

create:

```text
.env.example
```

with:

```env
VITE_API_URL=http://localhost:8084
```

For local development you can create:

``