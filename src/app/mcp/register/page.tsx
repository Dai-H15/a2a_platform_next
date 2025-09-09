"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useCheckUserRole } from "@/hooks/useCheckUserRole";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function RegisterMcpServerPage() {
    useAuthRedirect();
    useCheckUserRole(["admin", "maintainer"]);
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [type, setType] = useState<"sse" | "local">("sse");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${BACKEND_URL}/mcp/servers/regist`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, type }),
      });

      if (!res.ok) {
        // サーバーからのレスポンスは全て「エラーが発生しました」で隠蔽
        const data = await res.json();
        if("detail" in data){
          const detail = data.detail;
          setError("エラーが発生しました:" + detail);
        }else{
          setError("エラーが発生しました:");
        }
        return;
      }

      router.push("/mcp/list");
    } catch {
      // ネットワークエラーなども「エラーが発生しました」に統一
      setError("エラーが発生しました。");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header />

      <main className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">➕ MCP server register</h2>

        {error && (
          <p className="text-red-600 mb-4">
            {error}。
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium">URL</label>
            <input
              className="w-full border p-2 rounded"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium">呼び出し方式</label>
            <select
              className="w-full border p-2 rounded"
              value={type}
              onChange={(e) =>
                setType(e.target.value as "sse" | "local")
              }
            >
              <option value="sse">SSE</option>
              <option value="local">Local</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
          >
            登録
          </button>
        </form>
      </main>
    </div>
  );
}
