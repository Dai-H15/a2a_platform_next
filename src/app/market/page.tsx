// src/app/market/agents/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

type AgentCard = {
  id: string;
  name: string;
  description?: string;
};

type McpServer = {
  id: string;
  name: string;
  description?: string;
};

export default function MarketAgentsPage() {
  
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useAuthRedirect();
  useEffect(() => {
    async function fetchAll() {
      try {
        const [aRes, mRes] = await Promise.all([
          fetch("http://localhost:8000/market/agents", { credentials: "include" }),
          fetch("http://localhost:8000/market/mcp", { credentials: "include" }),
        ]);
        if (!aRes.ok) throw new Error(`Agents fetch failed (${aRes.status})`);
        if (!mRes.ok) throw new Error(`MCP fetch failed (${mRes.status})`);

        const agentsJson = await aRes.json();
        const serversJson = await mRes.json();

        setAgents(Array.isArray(agentsJson) ? agentsJson : []);
        setServers(Array.isArray(serversJson) ? serversJson : []);
      } catch (e: any) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-900">
        <Header />
        <main className="p-6 max-w-3xl mx-auto">
          <p>読み込み中…</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-900">
        <Header />
        <main className="p-6 max-w-3xl mx-auto">
          <p className="text-red-600">エラー: {error}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header />

      <main className="p-6 max-w-5xl mx-auto space-y-12">
        {/* A2A Agents */}
        <section>
          <h2 className="text-3xl font-bold mb-4">🔌 A2A Agents</h2>
          {agents.length === 0 ? (
            <p className="text-gray-500">— 登録されたエージェントはありません —</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="bg-white rounded-lg shadow p-6 border border-gray-200"
                >
                  <h3 className="text-xl font-semibold mb-2">
                    {agent.name}
                  </h3>
                  {agent.description && (
                    <p className="text-gray-700 mb-4">
                      {agent.description}
                    </p>
                  )}
                  <Link
                    href={`/market/agents/${agent.id}`}
                    className="inline-block text-blue-600 hover:underline"
                  >
                    詳細を見る →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* MCP Servers */}
        <section>
          <h2 className="text-3xl font-bold mb-4">🛠 MCP Servers</h2>
          {servers.length === 0 ? (
            <p className="text-gray-500">— 登録された MCP サーバーはありません —</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {servers.map((srv) => (
                <div
                  key={srv.id}
                  className="bg-white rounded-lg shadow p-6 border border-gray-200"
                >
                  <h3 className="text-xl font-semibold mb-2">
                    {srv.name}
                  </h3>
                  {srv.description && (
                    <p className="text-gray-700 mb-4">
                      {srv.description}
                    </p>
                  )}
                  <Link
                    href={`market/mcp/${srv.id}`}
                    className="inline-block text-blue-600 hover:underline"
                  >
                    詳細を見る →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
