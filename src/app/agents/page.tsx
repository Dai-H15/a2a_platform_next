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
};

export default function AgentsPage() {
  useAuthRedirect();

  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch("http://localhost:8000/agents", {
        credentials: "include",
      });
      if (res.status === 401) {
        setError("Not authenticated. Please login.");
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setAgents(data);
      } else {
        throw new Error("Response is not an array");
      }
    } catch (err: any) {
      setError("Failed to load agents: " + err.message);
      setAgents([]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    const res = await fetch(`http://localhost:8000/agents/${id}`, {
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
                          {agent.capabilities.streaming && (
                            <li>Streaming</li>
                          )}
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
                      <h4 className="text-lg font-semibold mb-2">
                        Skills
                      </h4>
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
