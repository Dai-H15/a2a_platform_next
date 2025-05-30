// src/app/market/mcp/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";

type MarketMcpServer = {
  id: string;
  name: string;
  description?: string;
  url: string;
  type: "sse" | "local";
  is_active?:boolean;
};

export default function MarketMcpDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [server, setServer] = useState<MarketMcpServer | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    if (!id) return;
    fetch(`${BACKEND_URL}/market/mcp/${id}`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((data: MarketMcpServer) => setServer(data))
      .catch((err) => {
        console.error(err);
        router.back();
      });
  }, [id, router]);

  const install = async () => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    if (!server) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/mcp/servers/regist`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: server.name,
          description: server.description ?? "",
          url: server.url,
          type: server.type,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const detail = (errBody.detail as string) || res.statusText;
        setError(`インストールに失敗しました: ${detail}`);
        return;
      }

      // 正常終了
      alert("MCP Server is installed successfully.")
      router.push("/mcp/list");
    } catch (e) {
      console.error(e);
      setError("インストール中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (!server) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-900">
        <Header />
        <main className="p-6 max-w-2xl mx-auto">
          <p>読み込み中…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header />
      <main className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">{server.name}</h2>
        <h5 className="mb-2">
                    Availability:&nbsp;
                    {server.is_active ? (
                      <span className="text-green-600 font-semibold">OK</span>
                    ) : (
                      <span className="text-red-600 font-semibold">
                        Error
                      </span>
                    )}
                  </h5>
        {server.description && (
          <p className="mb-4 text-gray-700">{server.description}</p>
        )}
        <p className="mb-2">
          <span className="font-medium">URL:</span>{" "}
          <code className="bg-gray-50 px-1 rounded">{server.url}</code>
        </p>
        <p className="mb-6">
          <span className="font-medium">方式:</span> {server.type.toUpperCase()}
        </p>
        

        {error && (
          <p className="mb-4 text-red-600 whitespace-pre-wrap">{error}</p>
        )}

        <button
          onClick={install}
          disabled={loading || !server.is_active}
          className={`bg-blue-600 text-white px-4 py-2 rounded transition-opacity ${
            (loading || !server.is_active) ? "opacity-50 cursor-wait" : "hover:bg-blue-700"
          }`}
        >
          {loading ? "インストール中…" : "インストール"}
        </button>
        <button
          onClick={() => router.back()}
          className="ml-4 text-gray-600 hover:underline"
        >
          ← 戻る
        </button>
      </main>
    </div>
  );
}
