"use client";
import Link from "next/link";
import Header from "@/components/Header";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header />

      <main className="p-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <Link href="/agents">
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-6 hover:shadow-md transition cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">🧠 View Agents</h2>
              <p className="text-sm">
                Browse the list of all registered agents and their metadata.
              </p>
            </div>
          </Link>

          <Link href="/register">
            <div className="bg-green-100 border border-green-300 rounded-lg p-6 hover:shadow-md transition cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">➕ Register Agent</h2>
              <p className="text-sm">
                Add a new agent via URL or direct JSON-card import.
              </p>
            </div>
          </Link>

          <Link href="/api-key">
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-6 hover:shadow-md transition cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">🔑 Manage API Key</h2>
              <p className="text-sm">
                View or regenerate your personal API key.
              </p>
            </div>
          </Link>

          <Link href="/mcp/register">
            <div className="bg-indigo-100 border border-indigo-300 rounded-lg p-6 hover:shadow-md transition cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">🛠️ Register MCP Server</h2>
              <p className="text-sm">
                Register a new MCP (tool) endpoint for JSON-RPC proxying.
              </p>
            </div>
          </Link>

          <Link href="/mcp/list">
            <div className="bg-purple-100 border border-purple-300 rounded-lg p-6 hover:shadow-md transition cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">📋 List MCP Servers</h2>
              <p className="text-sm">
                View or delete your registered MCP servers.
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
