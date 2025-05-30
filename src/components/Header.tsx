"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function Header() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/auth/me`, {
          method: "GET",
          credentials: "include", // ← セッションクッキー送信
        });
        if (res.ok) {
          const data = await res.json();
          setUserEmail(data.email);
        } else {
          setUserEmail(null); // 未認証
        }
      } catch {
        setUserEmail(null);
      }
    };
    fetchUser();
  }, []);

  const logout = async () => {
    await fetch(`${BACKEND_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUserEmail(null);
    router.push("/login");
  };

  return (
    <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
      <Link href="/">
        <h1 className="text-2xl font-bold">A2A Routing Service</h1>
      </Link>
      <div className="text-sm flex items-center gap-4">
        {userEmail ? (
          <>
            <span className="text-gray-600">Signed in as {userEmail}</span>
            <button onClick={logout} className="text-red-500 hover:underline">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
            <Link href="/register-user" className="text-green-600 hover:underline">
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
