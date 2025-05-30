"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

type AgentCard = {
  _id: string;
  name: string;
  description?: string;
  version?: string;
  documentationUrl?: string;
  endpoint: string;
  tags?: string[];
  parameters?: {
    max_tokens?: number | string;
    temperature?: number | string;
    [key: string]: any;
  };
  capabilities?: {
    streaming?: boolean;
    pushNotifications?: boolean;
    stateTransitionHistory?: boolean;
  };
  defaultInputModes?: string[];
  defaultOutputModes?: string[];
  skills?: {
    id: string;
    name: string;
    description?: string;
    tags?: string[];
    examples?: string[];
  }[];
  api_key?: string;
  is_active?: boolean;
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function AgentsPage() {
  useAuthRedirect();

  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [error, setError] = useState<string>("");
  const [editingKeys, setEditingKeys] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<Record<string, boolean>>({});
  const [storeChecked, setStoreChecked] = useState<Record<string, boolean>>({});
  const [publishing, setPublishing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/agents`, {
        credentials: "include",
      });
      if (res.status === 401) {
        setError("Not authenticated. Please login.");
        return;
      }
      const data: AgentCard[] = await res.json();
      if (!Array.isArray(data)) {
        throw new Error("Response is not an array");
      }
      setAgents(data);

      // 初期キーとストアチェック状態をセット
      const initKeys: Record<string, string> = {};
      const initChecked: Record<string, boolean> = {};
      data.forEach((agent) => {
        initKeys[agent._id] = agent.api_key ?? "";
        initChecked[agent._id] = false;
      });
      setEditingKeys(initKeys);
      setStoreChecked(initChecked);
    } catch (err: any) {
      setError("Failed to load agents: " + err.message);
      setAgents([]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    const res = await fetch(`${BACKEND_URL}/agents/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.status === 204) {
      setAgents((prev) => prev.filter((a) => a._id !== id));
    } else {
      const err = await res.json();
      alert("Delete failed: " + (err.detail || res.statusText));
    }
  };

  const saveApiKey = async (agentId: string) => {
    const key = editingKeys[agentId] ?? "";
    setSavingKey((s) => ({ ...s, [agentId]: true }));
    try {
      const res = await fetch(
        `${BACKEND_URL}/agents/${agentId}/apikey`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: key }),
        }
      );
      if (!res.ok) throw new Error(`status ${res.status}`);
      setAgents((prev) =>
        prev.map((a) =>
          a._id === agentId
            ? {
                ...a,
                api_key: key,
              }
            : a
        )
      );
      alert("APIキーを保存しました");
    } catch (e: any) {
      alert("APIキーの保存に失敗しました: " + e.message);
    } finally {
      setSavingKey((s) => ({ ...s, [agentId]: false }));
    }
  };

  const publishToStore = async (agent: AgentCard) => {
    const id = agent._id;
    setPublishing((p) => ({ ...p, [id]: true }));
    try {
      // agent.endpoint から endpoi を構築
      const body = {
        name: agent.name,
        description: agent.description || "",
        tags: agent.tags || [],
        endpoint: agent.endpoint,
      };
      const res = await fetch(`${BACKEND_URL}/market/agents`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || res.statusText);
      }
      alert(`“${agent.name}” をストアに公開しました`);
      // チェックをオフにしておく
      setStoreChecked((c) => ({ ...c, [id]: false }));
    } catch (e: any) {
      alert("公開に失敗しました: " + e.message);
    } finally {
      setPublishing((p) => ({ ...p, [id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header />
      <main className="p-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">🧠 Registered AI Agents</h2>
        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => {
            const skillTags =
              agent.skills?.flatMap((s) => s.tags || []) ?? [];

            return (
              <div
                key={agent._id}
                className="bg-white rounded-lg shadow p-6 border border-gray-200 flex flex-col justify-between"
              >
                <div>
                  {/* Agent Header */}
                  <h3 className="text-2xl font-semibold mb-2">
                    {agent.name}
                  </h3>
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
                  {agent.description && (
                    <p className="text-gray-700 mb-4">
                      {agent.description}
                    </p>
                  )}

                  {/* Meta Information */}
                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    {agent.version && (
                      <div>
                        <span className="font-medium">Version:</span>{" "}
                        {agent.version}
                      </div>
                    )}
                    {agent.documentationUrl && (
                      <div>
                        <span className="font-medium">Docs:</span>{" "}
                        <a
                          href={agent.documentationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {agent.documentationUrl}
                        </a>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Endpoint:</span>{" "}
                      <code className="bg-gray-100 px-1 rounded text-gray-800 break-all">
                        {agent.endpoint}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Tags:</span>{" "}
                      {(
                        agent.tags && agent.tags.length > 0
                          ? agent.tags
                          : skillTags
                      ).join(", ") || "—"}
                    </div>
                    {agent.parameters && (
                      <div>
                        <span className="font-medium">Parameters:</span>{" "}
                        max_tokens={agent.parameters.max_tokens ?? "—"},{" "}
                        temp={agent.parameters.temperature ?? "—"}
                      </div>
                    )}
                    {agent.capabilities && (
                      <div>
                        <span className="font-medium">Capabilities:</span>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          {agent.capabilities.streaming && <li>Streaming</li>}
                          {agent.capabilities.pushNotifications && (
                            <li>Push Notifications</li>
                          )}
                          {agent.capabilities.stateTransitionHistory && (
                            <li>State Transition History</li>
                          )}
                        </ul>
                      </div>
                    )}
                    {agent.defaultInputModes &&
                      agent.defaultInputModes.length > 0 && (
                        <div>
                          <span className="font-medium">Input Modes:</span>{" "}
                          {agent.defaultInputModes.join(", ")}
                        </div>
                      )}
                    {agent.defaultOutputModes &&
                      agent.defaultOutputModes.length > 0 && (
                        <div>
                          <span className="font-medium">Output Modes:</span>{" "}
                          {agent.defaultOutputModes.join(", ")}
                        </div>
                      )}
                  </div>

                  {/* Skills Section */}
                  {agent.skills && agent.skills.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold mb-2">Skills</h4>
                      <ul className="space-y-2 text-gray-700 text-sm">
                        {agent.skills.map((skill) => (
                          <li
                            key={skill.id}
                            className="bg-gray-50 p-3 rounded border border-gray-200"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">
                                {skill.name}
                              </span>
                              {skill.tags && skill.tags.length > 0 && (
                                <span className="text-sm text-gray-500">
                                  {skill.tags.join(", ")}
                                </span>
                              )}
                            </div>
                            {skill.description && (
                              <p className="mt-1 text-gray-600">
                                {skill.description}
                              </p>
                            )}
                            {skill.examples && skill.examples.length > 0 && (
                              <details className="mt-2 text-gray-600">
                                <summary className="cursor-pointer">
                                  Examples
                                </summary>
                                <ul className="list-disc list-inside mt-1 text-gray-600">
                                  {skill.examples.map((ex, i) => (
                                    <li key={i}>{ex}</li>
                                  ))}
                                </ul>
                              </details>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* APIキー入力 */}
                <div className="mb-4">
                  <label className="block font-medium mb-1">
                    Agent API Key
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      className="flex-1 border p-2 rounded"
                      value={editingKeys[agent._id] ?? ""}
                      onChange={(e) =>
                        setEditingKeys((prev) => ({
                          ...prev,
                          [agent._id]: e.target.value,
                        }))
                      }
                    />
                    <button
                      disabled={savingKey[agent._id]}
                      onClick={() => saveApiKey(agent._id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                      {savingKey[agent._id] ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>

                {/* Push to Store */}
                <div className="mb-4">
                  <label className="flex items-center space-x-2 mb-1">
                    <input
                      type="checkbox"
                      checked={storeChecked[agent._id] || false}
                      onChange={(e) =>
                        setStoreChecked((prev) => ({
                          ...prev,
                          [agent._id]: e.target.checked,
                        }))
                      }
                    />
                    <span className="font-medium">Push to Store</span>
                  </label>
                  <button
                    disabled={
                      !storeChecked[agent._id] || publishing[agent._id]
                    }
                    onClick={() => publishToStore(agent)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    {publishing[agent._id] ? "Publishing…" : "Publish"}
                  </button>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(agent._id)}
                  className="mt-4 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition-shadow shadow"
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
