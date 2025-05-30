"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

type McpServer = {
  id: string;
  name: string;
  url: string;
  description?: string;
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function McpServerListPage() {
  useAuthRedirect();

  const router = useRouter();
  const [servers, setServers] = useState<McpServer[]>([]);
  const [error, setError] = useState("");

  const fetchServers = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/mcp/servers`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("取得失敗");
      setServers(await res.json());
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("本当に削除しますか？")) return;
    const res = await fetch(`${BACKEND_URL}/mcp/servers/delete/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setServers(servers.filter(s => s.id !== id));
    } else {
      alert("削除失敗");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header />
      <main className="p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">🛠 MCP servers</h2>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <div className="space-y-4">
          {servers.map(s => (
            <div
              key={s.id}
              className="bg-white p-4 rounded shadow flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">{s.name}</h3>
                <p className="text-sm text-gray-600">{s.url}</p>
                {s.description && <p className="text-sm">{s.description}</p>}
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => router.push(`/mcp/servers/${s.id}/tools`)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  tools
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
