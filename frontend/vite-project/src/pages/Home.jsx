import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../axiosCalls/axios";
import { useAuth } from "../context/AuthContext";

const stories = [
  { name: "Your Story", initials: "You", tone: "from-indigo-500 to-violet-500" },
  { name: "Ananya", initials: "AN", tone: "from-pink-500 to-rose-500" },
  { name: "Rohan", initials: "RO", tone: "from-cyan-500 to-blue-500" },
  { name: "Priya", initials: "PR", tone: "from-amber-400 to-orange-500" },
  { name: "Arjun", initials: "AR", tone: "from-emerald-400 to-teal-500" },
];

function Avatar({ initials, tone = "from-slate-700 to-slate-900", size = "h-11 w-11" }) {
  return (
    <div className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${tone} text-xs font-bold text-white ring-2 ring-white`}>
      {initials}
    </div>
  );
}

function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState("");

  // CREATE FLOW STATE:
  // One simple composer supports both posts and reels.
  // contentType decides which backend endpoint and file field we use.
  const [contentType, setContentType] = useState("post");
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // HOME FEED FETCH:
  // Keep the flow simple: fetch posts first, then fetch reels.
  // Each request has its own error handling so one API failing does not stop
  // the other content type from being loaded.
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axiosInstance.get("/post");
        console.log(response)
        setPosts(response.data.posts || []);
      } catch (error) {
        console.error("Posts fetch failed:", error);
        setFeedError(
          error.response?.data?.message || "Unable to load posts."
        );
      }
    };

    const fetchReels = async () => {
      try {
        const response = await axiosInstance.get("/reel");
        console.log(response)
        setReels(response.data.reels || []);
      } catch (error) {
        console.error("Reels fetch failed:", error);
        setFeedError(
          error.response?.data?.message || "Unable to load reels."
        );
      }
    };

    const loadFeed = async () => {
      try {
        setFeedLoading(true);
        setFeedError("");

        await fetchPosts();
        await fetchReels();
      } finally {
        setFeedLoading(false);
      }
    };

    loadFeed();
  }, []);

  // CREATE POST / REEL:
  // We send FormData because both backend create routes accept an uploaded file.
  const handleCreateContent = async (event) => {
    event.preventDefault();

    if (!caption.trim()) {
      setCreateError("Please add a caption.");
      return;
    }

    if (!selectedFile) {
      setCreateError(
        contentType === "post"
          ? "Please select an image."
          : "Please select a video."
      );
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError("");

      const formData = new FormData();
      formData.append("caption", caption.trim());
      formData.append(
        contentType === "post" ? "image" : "video",
        selectedFile
      );

      if (contentType === "post") {
        const response = await axiosInstance.post("/post/create", formData);
        console.log(response)
        setPosts((prevPosts) => [response.data.post, ...prevPosts]);
      } else {
        const response = await axiosInstance.post("/reel/createReel", formData);
        setReels((prevReels) => [response.data.reel, ...prevReels]);
      }

      setCaption("");
      setSelectedFile(null);
      event.target.reset();
    } catch (error) {
      console.error("Content creation failed:", error);
      setCreateError(
        error.response?.data?.message || "Unable to create content."
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setCreateError("");
  };

  const handleContentTypeChange = (type) => {
    setContentType(type);
    setSelectedFile(null);
    setCreateError("");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const getInitials = (name) =>
    name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <button onClick={() => navigate("/home")} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-black text-white shadow-sm">
              S
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-base font-black tracking-tight">SST Social</p>
              <p className="text-[11px] text-slate-500">Your circle, your feed.</p>
            </div>
          </button>

          <div className="hidden w-72 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 md:flex">
            <span className="text-base">⌕</span>
            <span>Search people or posts</span>
          </div>

          <div className="flex items-center gap-2">
            <button className="rounded-full p-2.5 text-slate-500 transition hover:bg-slate-100" aria-label="Notifications">♡</button>
            <button
              onClick={() => navigate(`/profile/${user?.username}`)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 transition hover:border-slate-300 hover:shadow-sm"
            >
              <Avatar initials={getInitials(user?.name)} tone="from-indigo-500 to-violet-500" size="h-8 w-8" />
              <span className="hidden text-sm font-semibold sm:block">{user?.name || "You"}</span>
            </button>
            <button onClick={handleLogout} className="hidden rounded-full px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:block">Logout</button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)_280px]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
              <button className="flex w-full items-center gap-3 rounded-2xl bg-indigo-50 px-4 py-3 text-left">
                <span className="text-lg">⌂</span>
                <span className="text-sm font-bold text-indigo-700">Home Feed</span>
              </button>
              <button onClick={() => navigate(`/profile/${user?.username}`)} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-slate-600 transition hover:bg-slate-50">
                <span className="text-lg">◉</span>
                <span className="text-sm font-semibold">My Profile</span>
              </button>
              <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-slate-600 transition hover:bg-slate-50">
                <span className="text-lg">♡</span>
                <span className="text-sm font-semibold">Notifications</span>
              </button>
              <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-slate-600 transition hover:bg-slate-50">
                <span className="text-lg">⌁</span>
                <span className="text-sm font-semibold">Explore</span>
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <h1 className="text-xl font-black tracking-tight">Your Feed</h1>
                <p className="mt-1 text-xs text-slate-500">See what your circle is up to.</p>
              </div>
              <button className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600">Latest ↓</button>
            </div>
            <div className="flex gap-4 overflow-x-auto border-t border-slate-100 px-5 py-4 scrollbar-hide">
              {stories.map((story, index) => (
                <button key={story.name} className="group flex w-[76px] shrink-0 flex-col items-center gap-2">
                  <div className={`rounded-full bg-gradient-to-br ${story.tone} p-[3px] transition group-hover:scale-105`}>
                    <div className="rounded-full bg-white p-[2px]">
                      <Avatar initials={index === 0 ? getInitials(user?.name) : story.initials} tone={story.tone} size="h-12 w-12" />
                    </div>
                  </div>
                  <span className="w-full truncate text-center text-[11px] font-semibold text-slate-600">{index === 0 ? "Your Story" : story.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CREATE POST / REEL COMPOSER */}
          <form
            onSubmit={handleCreateContent}
            className="mb-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <Avatar initials={getInitials(user?.name)} tone="from-indigo-500 to-violet-500" />

              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                maxLength={500}
                rows={2}
                placeholder={`What's on your mind, ${user?.name?.split(" ")[0] || "there"}?`}
                className="flex-1 resize-none rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:bg-slate-100"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => handleContentTypeChange("post")}
                className={contentType === "post" ? "rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700" : "rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"}
              >
                ▧ Post
              </button>

              <button
                type="button"
                onClick={() => handleContentTypeChange("reel")}
                className={contentType === "reel" ? "rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700" : "rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"}
              >
                ▶ Reel
              </button>

              <label className="cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50">
                {contentType === "post" ? "Choose Image" : "Choose Video"}
                <input
                  type="file"
                  accept={contentType === "post" ? "image/*" : "video/*"}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                type="submit"
                disabled={createLoading}
                className="ml-auto rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createLoading ? "Creating..." : contentType === "post" ? "Create Post" : "Create Reel"}
              </button>
            </div>

            {selectedFile && (
              <p className="mt-2 text-xs text-slate-500">Selected: {selectedFile.name}</p>
            )}

            {createError && (
              <p className="mt-2 text-xs text-red-500">{createError}</p>
            )}
          </form>

          <div className="space-y-5">
            {feedLoading && (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                Loading your feed...
              </div>
            )}

            {!feedLoading && feedError && (
              <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm text-red-600 shadow-sm">
                {feedError}
              </div>
            )}

            {!feedLoading && !feedError && posts.length === 0 && reels.length === 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <p className="font-bold text-slate-700">Your feed is empty</p>
                <p className="mt-1 text-sm text-slate-500">
                  Create a post or reel to get started.
                </p>
              </div>
            )}

            {/* POSTS: render real API data returned by GET /post. */}
            {posts.map((post) => (
              <article
                key={post._id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        post.author?.profileImage ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          post.author?.name || "User"
                        )}&background=6366f1&color=fff`
                      }
                      alt={post.author?.name || "User"}
                      className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white"
                    />
                    <div>
                      <p className="text-sm font-bold">
                        {post.author?.name || "Unknown User"}
                      </p>
                      <p className="text-xs text-slate-400">
                        @{post.author?.username || "user"} ·{" "}
                        {new Date(post.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button className="rounded-full px-2 py-1 text-lg leading-none text-slate-400 hover:bg-slate-50">
                    •••
                  </button>
                </div>

                {post.image && (
                  <img
                    src={post.image}
                    alt={post.caption || "Post"}
                    className="max-h-[620px] w-full object-cover"
                  />
                )}

                <div className="px-5 pb-5 pt-4">
                  <p className="text-sm leading-6 text-slate-700">
                    {post.caption}
                  </p>

                  {/* Like/comment counts stay ready for the next feature pass. */}
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>0 likes</span>
                    <span>0 comments</span>
                  </div>

                  <div className="mt-4 flex border-t border-slate-100 pt-3">
                    <button className="flex-1 rounded-xl py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                      ♡ Like
                    </button>
                    <button className="flex-1 rounded-xl py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                      ◌ Comment
                    </button>
                    <button className="flex-1 rounded-xl py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                      ↗ Share
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {/* REELS: render real API data returned by GET /reel. */}
            {reels.map((reel) => (
              <article
                key={reel._id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        reel.author?.profileImage ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          reel.author?.name || "User"
                        )}&background=6366f1&color=fff`
                      }
                      alt={reel.author?.name || "User"}
                      className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white"
                    />
                    <div>
                      <p className="text-sm font-bold">
                        {reel.author?.name || "Unknown User"}
                      </p>
                      <p className="text-xs text-slate-400">
                        @{reel.author?.username || "user"} ·{" "}
                        {new Date(reel.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button className="rounded-full px-2 py-1 text-lg leading-none text-slate-400 hover:bg-slate-50">
                    •••
                  </button>
                </div>

                {reel.video && (
                  <video
                    src={reel.video}
                    controls
                    className="max-h-[620px] w-full bg-black object-contain"
                  />
                )}

                <div className="px-5 pb-5 pt-4">
                  <p className="text-sm leading-6 text-slate-700">
                    {reel.caption}
                  </p>

                  {/* Like/comment counts stay ready for the next feature pass. */}
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>0 likes</span>
                    <span>0 comments</span>
                  </div>

                  <div className="mt-4 flex border-t border-slate-100 pt-3">
                    <button className="flex-1 rounded-xl py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                      ♡ Like
                    </button>
                    <button className="flex-1 rounded-xl py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                      ◌ Comment
                    </button>
                    <button className="flex-1 rounded-xl py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                      ↗ Share
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black">People to follow</h2>
                <button className="text-xs font-bold text-indigo-600">See all</button>
              </div>
              <div className="mt-4 space-y-4">
                {[
                  ["Priya Nair", "priyanair", "PN", "from-amber-400 to-orange-500"],
                  ["Arjun Kapoor", "arjunk", "AK", "from-emerald-400 to-teal-500"],
                  ["Meera Das", "meerad", "MD", "from-fuchsia-500 to-purple-500"],
                ].map(([name, handle, initials, tone]) => (
                  <div key={handle} className="flex items-center gap-3">
                    <Avatar initials={initials} tone={tone} size="h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{name}</p>
                      <p className="truncate text-xs text-slate-400">@{handle}</p>
                    </div>
                    <button className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">Follow</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default Home;
