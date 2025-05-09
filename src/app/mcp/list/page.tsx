"use client";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

type McpServer = {
  id: string;
  name: string;
  url: string;
  description?: string;
};

export default function McpListPage() {
  useAuthRedirect();

  const [servers, setServers] = useState<McpServer[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:8000/mcp/servers", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Fetch failed");
        setServers(await res.json());
      } catch (e: any) {
        setError("Error: " + e.message);
      }
    })();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("削除してもよろしいですか？")) return;
    const res = await fetch(`http://localhost:8000/mcp/servers/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.status === 204) {
      setServers(servers.filter((s) => s.id !== id));
    } else {
      alert("削除失敗");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header />
      <main className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">MCP サーバー一覧</h1>
        {error && <p className="text-red-600">{error}</p>}
        <ul className="space-y-4">
          {servers.map((s) => (
            <li key={s.id} className="bg-white p-4 rounded shadow flex justify-between">
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-gray-600">{s.url}</p>
                {s.description && <p className="text-sm">{s.description}</p>}
              </div>
              <button
                onClick={() => handleDelete(s.id)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
