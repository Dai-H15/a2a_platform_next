// src/app/market/mcp/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import { useGetUserRole } from "@/hooks/useGetUserRole";

type MarketMcpServer = {
  id: string;
  name: string;
  description?: string;
  type: "sse" | "local";
  is_active?:boolean;
};

export default function MarketMcpDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [server, setServer] = useState<MarketMcpServer | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { userRole, loading: roleLoading } = useGetUserRole();

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
      const res = await fetch(`${BACKEND_URL}/market/mcp/install/${server.id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
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

  const deleteMcpServer = async () => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    if (!server) return;
    
    const confirmed = window.confirm(
      `MCPサーバー「${server.name}」をマーケットから削除してもよろしいですか？\n\nこの操作は取り消すことができません。`
    );
    
    if (!confirmed) return;

    setDeleteLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/market/mcp/delete/${server.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const detail = (errBody.detail as string) || res.statusText;
        setError(`削除に失敗しました: ${detail}`);
        return;
      }

      alert("MCPサーバーがマーケットから削除されました。");
      router.push("/market");
    } catch (e) {
      console.error(e);
      setError("削除中にエラーが発生しました");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ADMIN または MAINTAINER かどうかを判定（ロール読み込み中は非表示）
  const canDelete = !roleLoading && (userRole === "admin" || userRole === "maintainer");

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
        <p className="mb-6">
          <span className="font-medium">方式:</span> {server.type.toUpperCase()}
        </p>
        

        {error && (
          <p className="mb-4 text-red-600 whitespace-pre-wrap">{error}</p>
        )}

        <div className="flex gap-4 mb-4">
          <button
            onClick={install}
            disabled={loading || !server.is_active}
            className={`bg-blue-600 text-white px-4 py-2 rounded transition-opacity ${
              (loading || !server.is_active) ? "opacity-50 cursor-wait" : "hover:bg-blue-700"
            }`}
          >
            {loading ? "インストール中…" : "インストール"}
          </button>
          
          {canDelete && (
            <button
              onClick={deleteMcpServer}
              disabled={deleteLoading}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {deleteLoading ? "削除中..." : "削除"}
            </button>
          )}
        </div>
        
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:underline"
        >
          ← 戻る
        </button>
      </main>
    </div>
  );
}
