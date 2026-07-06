"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
const API_URL = "/api/auth";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const handleLogin = () => {
    const login = async () => {
      setMessage("");
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      setMessage(result.message ?? "Login failed.");
      if (response.ok) {
        router.push("/game");
      }
    };

    login();
  };

  const handleSignup = () => {
    const signup = async () => {
      setMessage("");
      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      setMessage(result.message ?? "Signup failed.");
      if (response.ok) {
        setMode("login");
        setPassword("");
      }
    };

    signup();
  };

  if (!isReady) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/40">
        <header className="mb-8 space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Hand Cricket</p>
          <h1 className="text-4xl font-semibold text-white">Login or create an account</h1>
          <p className="max-w-2xl mx-auto text-slate-400">Enter a unique username and password, then start playing. Your scores are saved to your account.</p>
        </header>

        <div className="grid gap-6">
          <div className="flex gap-2 rounded-full border border-slate-700 bg-slate-950 p-1">
            <button
              type="button"
              className={`flex-1 rounded-full py-3 text-sm font-semibold transition ${
                mode === "login" ? "bg-cyan-500 text-slate-950" : "text-slate-300 hover:text-white"
              }`}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={`flex-1 rounded-full py-3 text-sm font-semibold transition ${
                mode === "signup" ? "bg-cyan-500 text-slate-950" : "text-slate-300 hover:text-white"
              }`}
              onClick={() => setMode("signup")}
            >
              Sign up
            </button>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-200">
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                placeholder="Enter a unique username"
              />
            </label>

            <label className="block text-sm font-medium text-slate-200">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                placeholder="Enter your password"
              />
            </label>
          </div>

          {message ? (
            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
              {message}
            </div>
          ) : null}

          <button
            type="button"
            onClick={mode === "login" ? handleLogin : handleSignup}
            className="rounded-3xl bg-cyan-500 px-6 py-4 text-lg font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            {mode === "login" ? "Login" : "Create account"}
          </button>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 text-slate-300">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Tip</p>
            <p className="mt-2 text-sm">Usernames are stored locally and must be unique. Use the login tab if you already have an account.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
