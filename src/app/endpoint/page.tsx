// src/app/api-key/page.tsx
"use client";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function ApiKeyPage() {
  useAuthRedirect();

  const [apiKey, setApiKey] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [routerEndpoint, setRouterEndpoint] = useState<string>("");

  // 初期表示でキーを取得
  useEffect(() => {
    (async () => {
      const res = await fetch(`${BACKEND_URL}/auth/key`, {
        credentials: "include",
      });
      if (res.ok) {
        const { api_key } = await res.json();
        setApiKey(api_key);
      } else {
        setMessage("Failed to load API key.");
      }
    })();
  }, []);

  // apiKeyが変化したらrouterEndpointを更新
  useEffect(() => {
    if (apiKey) {
      setRouterEndpoint(`${BACKEND_URL}/a2a/auth/${apiKey}`);
    } else {
      setRouterEndpoint("");
    }
  }, [apiKey]);

  // 再生成ハンドラ
  const regenerate = async () => {
    setMessage("Regenerating…");
    const res = await fetch(`${BACKEND_URL}/auth/regenerate-key`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      const { api_key } = await res.json();
      setApiKey(api_key);
      setMessage("Endpoint URL regenerated.");
    } else {
      setMessage("Failed to regenerate.");
    }
  };

  // 汎用コピー関数
  const copyToClipboard = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setMessage(`${label} をクリップボードにコピーしました`);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header />

      <main className="p-8 max-w-lg mx-auto space-y-6">
        <h2 className="text-3xl font-bold mb-2">🔗 Your Endpoint URL</h2>

        {message && (
          <p className="text-sm text-indigo-600">{message}</p>
        )}



        {/* Router Endpoint Card */}
        {routerEndpoint && (
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Router Endpoint URL
            </label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-gray-800 break-all">
                {routerEndpoint}
              </code>
              <button
                onClick={() => copyToClipboard(routerEndpoint, "ルーターURL")}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* Regenerate Button */}
        <button
          onClick={regenerate}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-shadow shadow-sm hover:shadow-md"
        >
          Regenerate Endpoint URL
        </button>
      </main>
    </div>
  );
}
