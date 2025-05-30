"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuthRedirect() {
  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch(`${BACKEND_URL}/auth/me`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router, BACKEND_URL]);
}
