"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useCheckUserRole(accept_roles: string[]){
  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const [userRole, setUserRole] = useState<string>("no_auth");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.role);
        } else {
          setUserRole("no_auth");
        }
      } catch {
        setUserRole("no_auth");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [BACKEND_URL]);

  useEffect(() => {
    if (!loading && !accept_roles.includes(userRole)) {
      router.push("/login");
    }
  }, [userRole, loading, accept_roles, router]);

  return { userRole, loading };
}


