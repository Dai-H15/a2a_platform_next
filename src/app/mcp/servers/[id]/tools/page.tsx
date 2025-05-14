// src/app/mcp/servers/[id]/tools/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";

type Tool = {
  name: string;
  description: string;
  inputSchema: any;
  annotations: any;
};

type McpServer = {
  id: string;
  name: string;
  description?: string;
  url: string;
  type: "sse" | "local";
  // Python 側で保存している list_tools.dict() 全体を `doc` に、
  // その中の tools 配列を参照する形に合わせます
  doc?: {
    tools: Tool[];
    meta?: any;
    nextCursor?: any;
  };
};

export default function McpServerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [server, setServer] = useState<McpServer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/mcp/servers/detail/${id}`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`ステータス ${res.status}`);
        }
        return res.json();
      })
      .then((data: McpServer) => {
        setServer(data);
      })
      .catch((err) => {
        console.error(err);
        setError("サーバー情報／ツール一覧の取得に失敗しました");
      });
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-900">
        <Header />
        <main className="p-6 max-w-2xl mx-auto">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-500 hover:underline"
          >
            ← 一覧に戻る
          </button>
        </main>
      </div>
    );
  }

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

  const tools = server.doc?.tools ?? [];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header />
      <main className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">
          {server.name} （ID: {server.id}）
        </h2>
        {server.description && (
          <p className="mb-4 text-gray-700">{server.description}</p>
        )}
        <p className="mb-1">
          <span className="font-medium">URL：</span> {server.url}
        </p>
        <p className="mb-4">
          <span className="font-medium">方式：</span> {server.type.toUpperCase()}
        </p>

        <section className="mb-6">
          <h3 className="text-xl font-semibold mb-2">
            利用可能なツール一覧 ({tools.length})
          </h3>
          {tools.length > 0 ? (
            <ul className="space-y-4">
              {tools.map((tool) => (
                <li
                  key={tool.name}
                  className="bg-white p-4 rounded-lg shadow-sm"
                >
                  <h4 className="font-semibold">{tool.name}</h4>
                  <p className="text-sm mb-2">
                    {tool.description.trim().split("\n")[0]}
                  </p>
                  <details className="text-xs text-gray-600">
                    <summary className="cursor-pointer">
                      入力スキーマを見る
                    </summary>
                    <pre className="whitespace-pre-wrap mt-2 rounded bg-gray-50 p-2 text-xs">
                      {JSON.stringify(tool.inputSchema, null, 2)}
                    </pre>
                    {tool.annotations && (
                      <>
                        <summary className="cursor-pointer mt-2">
                          アノテーションを見る
                        </summary>
                        <pre className="whitespace-pre-wrap mt-1 rounded bg-gray-50 p-2 text-xs">
                          {JSON.stringify(tool.annotations, null, 2)}
                        </pre>
                      </>
                    )}
                  </details>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">— ツール情報がありません —</p>
          )}
        </section>

        <button
          onClick={() => router.back()}
          className="text-blue-500 hover:underline"
        >
          ← 一覧に戻る
        </button>
      </main>
    </div>
  );
}
