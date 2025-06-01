// src/app/marketplace/agents/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

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
  const { id } = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(false);

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

        <button
          onClick={install}
          disabled={loading || !agent.is_active}
          className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-opacity ${
            (loading || !agent.is_active) ? "opacity-50 cursor-wait" : ""
          }`}
        >
          {loading ? "インストール中…" : "インストール"}
        </button>

        <button
          onClick={() => router.back()}
          disabled={loading}
          className="mt-4 inline-block text-gray-700 hover:underline"
        >
          ← 戻る
        </button>
      </main>
    </div>
  );
}
