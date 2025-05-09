"use client";
import { useState } from "react";
import Header from "@/components/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

export default function McpRegisterPage() {
  useAuthRedirect();

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    try {
      const res = await fetch("http://localhost:8000/mcp/servers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, description }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("登録成功: " + data.id);
        setName("");
        setUrl("");
        setDescription("");
      } else {
        setMsg("登録失敗: " + (data.detail || JSON.stringify(data)));
      }
    } catch (e: any) {
      setMsg("エラー: " + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header />
      <main className="p-8 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Register MCP Server</h1>
        {msg && <p className="mb-4 text-blue-600">{msg}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium">Name</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-medium">URL</label>
            <input
              className="w-full border rounded px-2 py-1"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-medium">Description</label>
            <textarea
              className="w-full border rounded px-2 py-1"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded"
          >
            Submit
          </button>
        </form>
      </main>
    </div>
  );
}
