"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

export default function RegisterMcpServerPage() {
    useAuthRedirect();
  
  const router = useRouter();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"sse" | "local">("sse");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:8000/mcp/servers/regist", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, description, type }),
      });

      if (!res.ok) {
        // サーバーからのレスポンスは全て「エラーが発生しました」で隠蔽
        const data = await res.json();
        if("detail" in data){
          let detail = data.detail;
          setError("エラーが発生しました:" + detail);
        }else{
          setError("エラーが発生しました:");
        }
        return;
      }

      router.push("/mcp/list");
    } catch (e) {
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
            <label className="block font-medium">Name</label>
            <input
              className="w-full border p-2 rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-medium">URL</label>
            <input
              className="w-full border p-2 rounded"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-medium">Description</label>
            <textarea
              className="w-full border p-2 rounded"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
