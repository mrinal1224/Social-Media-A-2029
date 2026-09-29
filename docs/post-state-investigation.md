# Post data across Home and Profile

## What the app does today

[Home](../frontend/vite-project/src/pages/Home.jsx#L19) owns a `posts` array. It requests `GET /post` when it mounts, and its like handler updates that array after the server responds. [Profile](../frontend/vite-project/src/pages/Profile.jsx#L20) owns a separate `profilePosts` array. It requests `GET /post/user/:username` when the username changes, and its like handler updates only that array. [AuthContext](../frontend/vite-project/src/context/AuthContext.jsx) shares the signed-in user, not posts.

Both requests can return the same Post ID. They create independent frontend copies, but the current [routes](../frontend/vite-project/src/App.jsx) render Home and Profile separately, so navigating between them unmounts one page and mounts the other. The new page fetches again. The [backend](../backend/controllers/post.controllers.js#L49-L125) reads both lists from the same Post collection and saves likes there. That fresh request explains why the like appears correct after navigation; it does not mean the page states are synchronized. Returning to Home also fetches again.

This finding comes from tracing the request and state code. I could not capture a live Network trace from this checkout because the backend needs a MongoDB connection and no local backend configuration is present.

## Ways to manage posts

### 1. Keep page state and refetch

- **Where posts live:** In `Home.posts` and `Profile.profilePosts`; the backend remains the source of truth.
- **How pages read them:** Home requests the feed and Profile requests that user's posts on mount.
- **On like:** Save to the backend, then update the current page's array. The other page sees it on its next fetch.
- **Requests:** Each page entry needs a request; an extra request immediately after a successful like is optional.
- **Upside:** Simple and already works with the current routes.
- **Cost as the app grows:** Explore, Search, Saved Posts, and Notifications would each need their own fetch and mutation handling. Any screens shown together could display different versions until refreshed.

### 2. Share posts through React context

- **Where posts live:** A provider above the routes keeps posts by ID and separate ID lists for the feed and each profile.
- **How pages read them:** Home selects feed IDs; Profile selects the IDs for its username.
- **On like:** After the backend succeeds, update that post by ID so both views using it see the change.
- **Requests:** Fetch lists that have not loaded and refresh them when needed. A successful like can update the shared copy without an immediate refetch.
- **Upside:** One post representation and no new state library.
- **Cost as the app grows:** The provider must handle loading, errors, list membership, stale data, and concurrent requests for every new screen. That logic can become difficult to maintain.

### 3. Use a normalized Redux Toolkit post store

- **Where posts live:** A post map keyed by ID, plus ID lists for the feed, profiles, and later views.
- **How pages read them:** Home selects feed posts; Profile selects posts for its username.
- **On like:** Save to the backend, then update the post once by ID. All mounted views read the same result.
- **Requests:** New lists and stale data still need requests. A successful like does not require an immediate refetch if the store updates from the response.
- **Upside:** Post identity and updates stay consistent as more screens use them; request and loading rules have a clear home.
- **Cost as the app grows:** Adds a dependency and more setup. List membership, cache freshness, and failures still need explicit handling.

## Recommendation

Page state is reasonable for the two separate routes today because each page fetches on entry. If posts are added to Explore, Search, Saved Posts, or Notifications, make them application-level state. A normalized Redux Toolkit store fits the planned Redux lesson and gives one place to update a Post by ID while keeping each screen's list separate. Keep fetching for new lists and freshness; sharing state should solve ownership and consistency, not aim to remove every request. This issue calls for a decision before implementation, so no state management code changes are part of this investigation.
