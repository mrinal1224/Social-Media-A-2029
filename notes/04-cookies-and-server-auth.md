# Class 04 — Cookies, HttpOnly and Server-side Authentication

**Date:** 25 August 2026  
**Git milestone:** `feat (Cookies and server auth)`  
**Commit:** `848fc249b983d6163b81487847712f1f90c2edac`

## 1. The problem we are solving

We already know how to generate and verify a JWT.

Now we have to answer a practical browser question:

> Where do we put the token so that the browser can send it with future requests?

There are multiple possibilities. For browser applications, one important option is a cookie.

Our backend currently does:

```js
res.cookie("token", token, cookieOptions)
```

and later the authentication middleware reads:

```js
const token = req.cookies.token
```

This is the complete transport story we are building.

## 2. Cookies are browser-managed key-value data

A cookie is a small piece of state associated with a domain/path and controlled by the browser's cookie rules.

The server can send a `Set-Cookie` response header, and the browser can store the cookie and automatically include it on applicable requests.

Conceptually:

```text
Server
  |
  | Set-Cookie: token=...
  v
Browser cookie jar
  |
  | later request
  v
Server
```

This is very different from simply returning a token in JSON and expecting browser JavaScript to manage it manually.

## 3. Setting the cookie

Our controller creates the JWT:

```js
const token = genToken(newUser._id)
```

Then sends it through:

```js
res.cookie("token", token, cookieOptions)
```

The cookie options currently start with:

```js
const cookieOptions = {
    httpOnly: true,
}
```

This single option is worth understanding very deeply.

## 4. What does `httpOnly` mean?

An `HttpOnly` cookie cannot be read by normal browser JavaScript through APIs such as `document.cookie`.

So if an attacker manages to inject JavaScript through an XSS vulnerability, `httpOnly` can make it harder for that script to directly steal the authentication cookie value.

The mental model is:

```text
Normal cookie
JS -> can potentially read cookie

HttpOnly cookie
JS -> cannot read cookie
Browser networking layer -> can still send cookie
```

This is why HttpOnly is a powerful defense-in-depth setting for session/authentication cookies.

It does **not** magically prevent XSS itself.

If malicious JavaScript runs in your page, it can still make requests as the user from that browser context, even if it cannot directly read the cookie.

That distinction is extremely important.

## 5. HttpOnly is not a CSRF solution by itself

The project comment currently says:

```js
// we have to avoid XSS and CSRF attacks
```

That needs a more precise explanation.

`HttpOnly` helps against **cookie theft through JavaScript**.

It does not automatically prevent **Cross-Site Request Forgery (CSRF)**.

Why?

Because the browser can still automatically attach an applicable cookie to a request, even though JavaScript cannot read the cookie value.

So there are two different problems:

```text
XSS
Malicious script runs in your page.

CSRF
An attacker causes a victim's browser to make an authenticated request to your site.
```

The defenses are related but different.

## 6. SameSite

One important cookie attribute for CSRF defense is `SameSite`.

Conceptually:

```js
res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax'
})
```

Our current code only has `httpOnly` in the object, but the class discussion explored cookie security flags such as `sameSite` and `secure`.

### `SameSite: 'lax'`

This tells the browser to restrict cross-site cookie sending in a way that blocks many common CSRF patterns while keeping normal top-level navigation flows usable.

The exact browser behavior is nuanced, so treat `SameSite` as a browser policy setting rather than as “a magic CSRF switch.”

### Other modes

- `Strict` is more restrictive.
- `Lax` is a common practical default for many login/session cookies.
- `None` permits cross-site cookie sending and requires `Secure`.

The right choice depends on the application architecture.

## 7. Secure

A cookie can also be marked:

```js
secure: true
```

This tells the browser to send the cookie only over secure HTTPS connections, with the normal exception that localhost development often needs special handling.

Production authentication cookies should normally use HTTPS and `Secure`.

Mental model:

```text
HttpOnly -> JavaScript cannot read it
Secure   -> send only over secure transport
SameSite -> control cross-site sending behavior
```

These solve different problems.

## 8. Reading cookies on the server

Our Express server uses:

```js
import cookieParser from "cookie-parser"
```

and then:

```js
app.use(cookieParser())
```

This middleware parses the incoming `Cookie` header and makes cookies conveniently available through:

```js
req.cookies
```

Therefore authentication middleware can write:

```js
const token = req.cookies.token
```

Without cookie parsing, `req.cookies` would not automatically exist in this convenient form.

## 9. Complete login flow

Let's connect everything.

### Step 1 — browser sends credentials

```http
POST /users/login
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "correct-password"
}
```

### Step 2 — backend checks the user

```js
const userExists = await User.findOne({ email })
```

### Step 3 — backend verifies password

```js
const correctPassword = bcrypt.compareSync(
    password,
    userExists.password
)
```

### Step 4 — backend generates JWT

```js
const token = genToken(userExists._id)
```

### Step 5 — backend sets cookie

```js
res.cookie("token", token, cookieOptions)
```

### Step 6 — browser stores the cookie

The browser manages the cookie according to its attributes.

### Step 7 — future authenticated request

```http
GET /users/me
Cookie: token=...
```

### Step 8 — Express parses it

```js
req.cookies.token
```

### Step 9 — middleware verifies it

```js
jwt.verify(token, process.env.jwt_secret)
```

### Step 10 — user is loaded and attached

```js
req.user = user
```

### Step 11 — controller responds

```js
res.status(200).json(req.user)
```

That is our complete authentication pipeline.

## 10. Why cookies can be a good fit for browser authentication

One practical advantage is that application JavaScript does not have to manually read the token and add it to every request.

The browser handles cookie attachment based on cookie policy.

Contrast two common approaches.

### Cookie-based

```text
login
  -> Set-Cookie

future fetch
  -> browser handles applicable cookie
```

### Manually managed bearer token

```text
login
  -> JSON token
  -> JavaScript stores token
  -> JavaScript reads token
  -> JavaScript builds Authorization header
  -> request
```

The second approach can be perfectly valid, but it creates a different security model and puts more responsibility on application code.

## 11. Cookies are not automatically “more secure”

A cookie-based architecture still needs:

- HTTPS
- sensible `SameSite` configuration
- CSRF strategy appropriate to the application
- XSS prevention
- secure secret management
- correct logout semantics
- sensible session expiration

Security comes from the complete design, not a single flag.

## 12. Current project code: the cookie options

The controller has:

```js
const cookieOptions = {
    httpOnly : true,
}
```

For a production browser authentication cookie, I would expect something closer to:

```js
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
}
```

The exact `sameSite` value must match the deployment architecture.

If frontend and backend are on different sites and require cross-site cookies, the configuration becomes more involved, including `SameSite=None; Secure` and CORS/credential considerations.

## 13. CORS and credentials

A very common browser issue appears when frontend and backend run on different origins.

For example:

```text
Frontend -> http://localhost:5173
Backend  -> http://localhost:8082
```

Now cross-origin requests are involved.

The browser's credential rules matter.

Client-side fetch often needs:

```js
fetch('http://localhost:8082/users/me', {
    credentials: 'include'
})
```

and the server must configure CORS appropriately rather than using an incompatible wildcard configuration for credentialed requests.

This is one of the first things I would check when a cookie “exists” in DevTools but is not arriving at the backend.

## 14. Debugging checklist: cookie not reaching backend

When:

```js
req.cookies.token
```

is `undefined`, do not immediately blame JWT.

Check systematically:

```text
1. Did login response actually contain Set-Cookie?
2. Did browser accept the cookie?
3. Is the cookie domain/path correct?
4. Is Secure blocking HTTP localhost usage?
5. Is SameSite preventing the request?
6. Is the frontend sending credentials?
7. Is backend CORS configured for credentials?
8. Did cookie-parser run before the route?
9. Is the request going to the same host you expect?
10. Is the cookie expired?
```

This checklist saves a lot of debugging time.

## 15. Logout

The current routes contain this comment:

```js
// HW - Log out
```

The basic browser-cookie logout mechanism is to clear the cookie:

```js
res.clearCookie('token', cookieOptions)
```

The cookie attributes used during clearing need to match the cookie's relevant scope/options so that the browser removes the correct cookie.

A production design also needs to think about token validity after logout, especially if using long-lived self-contained JWTs.

## 16. The difference between logout and token invalidation

Clearing the browser cookie means:

```text
Browser no longer sends token
```

It does not necessarily mean:

```text
The old token can never be used again
```

If an attacker already copied the token, simply clearing the victim's cookie does not erase the attacker's copy.

This is why systems with stronger logout/revocation requirements often introduce server-side session state, refresh-token rotation, token versioning or a revocation mechanism.

## 17. Request architecture after this class

Our backend has a clean flow:

```text
                 ┌────────────────────┐
                 │      Browser       │
                 └─────────┬──────────┘
                           │
                           │ HTTP request
                           v
                 ┌────────────────────┐
                 │      Express       │
                 └─────────┬──────────┘
                           │
                           v
                 ┌────────────────────┐
                 │   cookie-parser    │
                 └─────────┬──────────┘
                           │
                           v
                 ┌────────────────────┐
                 │ isAuthenticated    │
                 │  jwt.verify(...)   │
                 └─────────┬──────────┘
                           │
                           v
                 ┌────────────────────┐
                 │      MongoDB       │
                 │   findById(...)    │
                 └─────────┬──────────┘
                           │
                           v
                     req.user
                           │
                           v
                 ┌────────────────────┐
                 │    Controller      │
                 └────────────────────┘
```

## 18. Interview questions

1. What is a cookie?
2. What is an HttpOnly cookie?
3. Does HttpOnly prevent XSS?
4. Does HttpOnly prevent CSRF?
5. What does SameSite do?
6. Why is Secure important?
7. What is `credentials: 'include'`?
8. Why does CORS matter for cookie-based authentication?
9. How does cookie-parser work conceptually?
10. How would you implement logout?
11. Why might clearing a cookie not fully revoke a stolen JWT?
12. What is the difference between a cookie and localStorage from a security perspective?

## 19. Practice problems

### Beginner

1. Create a `/login` route that sets a simple cookie.
2. Read the cookie from another route.
3. Implement `/logout` using `clearCookie()`.

### Intermediate

4. Configure `httpOnly`, `secure`, and `sameSite` correctly for local development and production.
5. Build a frontend request to a different origin using `credentials: 'include'`.
6. Configure Express CORS for credentialed requests.

### Advanced

7. Design authentication for a frontend and backend deployed on separate domains.
8. Explain when `SameSite=None` becomes necessary.
9. Design CSRF protection for cookie-based authentication.
10. Design logout-all-devices for a JWT-based system.
11. Compare HttpOnly cookies, localStorage and sessionStorage for authentication.

## 20. Further study

- MDN Cookies: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies
- MDN Set-Cookie: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie
- MDN CORS: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
- OWASP Cross-Site Request Forgery Prevention: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- OWASP Cross Site Scripting Prevention: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html

## Class summary

We have now connected the entire authentication chain:

```text
Password
   -> bcrypt hash / compare
   -> login success
   -> JWT generated
   -> JWT placed in HttpOnly cookie
   -> browser sends cookie
   -> cookie-parser reads token
   -> auth middleware verifies token
   -> user loaded from MongoDB
   -> req.user created
   -> protected controller runs
```

This is no longer just a collection of APIs. It is a complete request-authentication architecture.
