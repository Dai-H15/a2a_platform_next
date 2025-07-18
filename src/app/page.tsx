// src/app/page.tsx
"use client";
import Link from "next/link";
import Header from "@/components/Header";
import { useGetUserRole } from "@/hooks/useGetUserRole";

export default function Home() {
  const { userRole } = useGetUserRole();

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header />

      <main className="p-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <Link href="/agents">
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-6 hover:shadow-md transition cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">🧠 View Agents</h2>
              <p className="text-sm">
                Browse the list of all registered agents and their metadata.
              </p>
            </div>
          </Link>

          {/* userRoleが"user"以外のときのみRegister Agentを表示 */}
          {(userRole === "admin" || userRole === "maintainer") && (
            <Link href="/register">
              <div className="bg-green-100 border border-green-300 rounded-lg p-6 hover:shadow-md transition cursor-pointer">
                <h2 className="text-xl font-semibold mb-2">➕ Register Agent</h2>
                <p className="text-sm">
                  Add a new agent via URL or direct JSON-card import.
                </p>
              </div>
            </Link>
          )}

          <Link href="/endpoint">
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-6 hover:shadow-md transition cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">🔗 Manage Endpoint URL</h2>
              <p className="text-sm">
                View or regenerate your personal Endpoint URL.
              </p>
            </div>
          </Link>

          {(userRole === "admin" || userRole === "maintainer") && (
            <Link href="/mcp/register">
              <div className="bg-indigo-100 border border-indigo-300 rounded-lg p-6 hover:shadow-md transition cursor-pointer">
                <h2 className="text-xl font-semibold mb-2">🛠️ Register MCP Server</h2>
                <p className="text-sm">
                  Register a new MCP (tool) endpoint for JSON-RPC proxying.
                </p>
              </div>
            </Link>
          )}

          <Link href="/mcp/list">
            <div className="bg-purple-100 border border-purple-300 rounded-lg p-6 hover:shadow-md transition cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">📋 List MCP Servers</h2>
              <p className="text-sm">
                View or delete your registered MCP servers.
              </p>
            </div>
          </Link>

          <Link href="/market">
            <div className="bg-teal-100 border border-teal-300 rounded-lg p-6 hover:shadow-md transition cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">🛒 Browse App Store</h2>
              <p className="text-sm">
                Explore community-published agents and tools in the marketplace.
              </p>
            </div>
          </Link>

          <Link href="/logs">
            <div className="bg-orange-100 border border-orange-300 rounded-lg p-6 hover:shadow-md transition cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">📜 View Logs</h2>
              <p className="text-sm">
                View your agent/user interaction logs.
              </p>
            </div>
          </Link>
          {(userRole === "admin" || userRole === "management") && (
          <Link href="/admin">
            <div className="bg-red-100 border border-red-300 rounded-lg p-6 hover:shadow-md transition cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">🔒 Admin Panel</h2>
              <p className="text-sm">
                Admin/Management: User, Role, and Log Management
              </p>
            </div>
          </Link>
          )}
        </div>
      </main>
    </div>
  );
}
