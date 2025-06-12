// 例：src/app/register-by-url/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useCheckUserRole } from "@/hooks/useCheckUserRole";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function RegisterByUrlPage() {
  useAuthRedirect();
  useCheckUserRole(["admin", "maintainer"]);
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const res = await fetch(`${BACKEND_URL}/register-agent-by-url`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (res.ok) {
      const { agent } = await res.json();
      setMessage(`Registered: ${agent.name}`);
      setTimeout(() => router.push("/agents"), 1500);
    } else {
      const err = await res.json();
      setMessage("Failed: " + err.detail);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header />
      <main className="p-6 max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">Register Agent by URL</h2>
        {message && <p className="mb-4 text-indigo-600">{message}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="url"
            placeholder="https://DOMAIN"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-blue-600 transition-shadow"
          >
            Register via Agent Card
          </button>
        </form>
      </main>
    </div>
  );
}
