// src/app/marketplace/agents/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useGetUserRole } from "@/hooks/useGetUserRole"

type AgentDetail = {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  is_active?: boolean;
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function AgentMarketDetail() {
  useAuthRedirect();
  const { userRole, loading: roleLoading } = useGetUserRole();
  const { id } = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    // idが無ければ何もしない
    if (!id) return;
    fetch(`${BACKEND_URL}/market/agents/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((data: AgentDetail) => setAgent(data))
      .catch(() => {
        // エラー時のみ router.back を呼び出し
        router.back();
      });
  }, [id, router]);  // ← router を依存配列に追加

  const install = async () => {
    if (!agent) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/market/agents/install/${agent.id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = (err.detail as string) || res.statusText;
        alert(`インストールに失敗しました: ${detail}`);
        return;
      }

      alert("インストールが完了しました。");
      router.push("/agents");
    } catch (e) {
      console.error(e);
      alert("インストール中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const deleteAgent = async () => {
    if (!agent) return;
    
    const confirmed = window.confirm(
      `エージェント「${agent.name}」をマーケットから削除してもよろしいですか？\n\nこの操作は取り消すことができません。`
    );
    
    if (!confirmed) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/market/agents/delete/${agent.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = (err.detail as string) || res.statusText;
        alert(`削除に失敗しました: ${detail}`);
        return;
      }

      alert("エージェントがマーケットから削除されました。");
      router.push("/market");
    } catch (e) {
      console.error(e);
      alert("削除中にエラーが発生しました");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ADMIN または MAINTAINER かどうかを判定（ロール読み込み中は非表示）
  const canDelete = !roleLoading && (userRole === "admin" || userRole === "maintainer");

  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-900">
        <Header />
        <main className="p-6 max-w-2xl mx-auto">
          <p className="text-gray-600">読み込み中…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header />
      <main className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">{agent.name}</h2>
        <p className="mb-6 text-gray-700">{agent.description}</p>
        <h5 className="mb-2">
                    Availability:&nbsp;
                    {agent.is_active ? (
                      <span className="text-green-600 font-semibold">OK</span>
                    ) : (
                      <span className="text-red-600 font-semibold">
                        Error
                      </span>
                    )}
                  </h5>
                    <div className="flex gap-4 mb-4">
                      <button
                        onClick={install}
                        disabled={loading || !agent.is_active}
                        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {loading ? "インストール中..." : "インストール"}
                      </button>
                      
                      {canDelete && (
                        <button
                          onClick={deleteAgent}
                          disabled={deleteLoading}
                          className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {deleteLoading ? "削除中..." : "削除"}
                        </button>
                      )}
                    </div>
                    
                    <button
                      onClick={() => router.back()}
                      disabled={loading}
                      className="text-gray-700 hover:underline"
                    >
                      ← 戻る
                    </button>
      </main>
      
    </div>
  );
}
