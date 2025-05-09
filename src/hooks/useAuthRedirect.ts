"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("http://localhost:8000/auth/me", {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        router.push("/login");
      }
    };
    checkAuth();
  }, []);
}
