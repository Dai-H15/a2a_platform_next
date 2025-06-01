"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    if (loading) return; // 二重送信防止
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ← 重要：クッキーを送受信
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        setMessage("Login successful! Redirecting...");
        setTimeout(() => router.push("/"), 1000);
      } else {
        const err = await res.json();
        setMessage("Login failed: " + (err.detail || JSON.stringify(err)));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Login</h1>
          <p className="text-sm text-gray-500">Sign in to continue</p>
        </div>
        <Link href="/">
          <div className="text-sm text-blue-600 hover:underline">
            ← Back to Dashboard
          </div>
        </Link>
      </header>

      <main className="p-6 max-w-md mx-auto">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">User Login</h2>
          {message && <p className="text-sm mb-2 text-red-500">{message}</p>}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block mb-1 font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border w-full p-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border w-full p-2 rounded"
              />
            </div>
            <button
              type="submit"
              className={`bg-blue-600 text-white px-4 py-2 rounded w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : 'Login'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
