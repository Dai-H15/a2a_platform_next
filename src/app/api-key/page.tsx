"use client";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

export default function ApiKeyPage() {
  useAuthRedirect();

  const [apiKey, setApiKey] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  // 初期表示でキーを取得
  useEffect(() => {
    (async () => {
      const res = await fetch("http://localhost:8000/auth/key", {
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

  // 再生成ハンドラ
  const regenerate = async () => {
    setMessage("Regenerating…");
    const res = await fetch("http://localhost:8000/auth/regenerate-key", {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      const { api_key } = await res.json();
      setApiKey(api_key);
      setMessage("API key regenerated.");
    } else {
      setMessage("Failed to regenerate.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header />

      <main className="p-8 max-w-lg mx-auto">
        <h2 className="text-3xl font-bold mb-6">🔑 Your API Key</h2>

        {message && (
          <p className="mb-4 text-sm text-indigo-600">{message}</p>
        )}

        <div className="bg-white p-6 rounded-xl shadow-md mb-6 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Key
          </label>
          <div className="flex items-center space-x-2">
            <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-gray-800 break-all">
              {apiKey || "—"}
            </code>
            {apiKey && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(apiKey);
                  setMessage("Copied to clipboard");
                }}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
              >
                Copy
              </button>
            )}
          </div>
        </div>

        <button
         onClick={regenerate}
         className="
           w-full
           bg-blue-500 hover:bg-blue-600
            text-white font-semibold
           py-2 rounded-lg
           transition-shadow shadow-sm hover:shadow-md
         "
       >
         Regenerate API Key
       </button>
      </main>
    </div>
  );
}
