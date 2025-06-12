"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useGetUserRole(login_required = false) {
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
            if (login_required){
                router.push("/login");
            }
        }
      } catch {
        if (login_required) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [BACKEND_URL, login_required, router]);

  return { userRole, loading };
}


