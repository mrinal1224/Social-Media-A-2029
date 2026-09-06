import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">SST Social</h1>
            <p className="text-sm text-slate-500">
              Welcome back, {user?.name}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-indigo-600">Protected Home</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            You are authenticated 🎉
          </h2>
          <p className="mt-2 text-slate-500">
            This page is accessible only when a valid authentication cookie exists.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Home;
