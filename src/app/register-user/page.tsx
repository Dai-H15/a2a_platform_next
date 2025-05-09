"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function RegisterUserPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage("Please fill in all fields.");
      return;
    }

    const res = await fetch("http://localhost:8000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessage("User created. API Key: " + data.api_key);
      setTimeout(() => router.push("/login"), 2000);
    } else {
      const err = await res.json();
      setMessage("Registration failed: " + (err.detail || JSON.stringify(err)));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header />
      <main className="p-6 max-w-md mx-auto">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Register New User</h2>
          {message && <p className="text-sm mb-2 text-red-500">{message}</p>}
          <form onSubmit={handleSubmit} className="space-y-5">
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
              className="bg-green-600 text-white px-4 py-2 rounded w-full"
            >
              Register
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
