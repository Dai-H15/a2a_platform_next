"use client";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

interface LogEntry {
  _id: string;
  timestamp: string;
  user_email: string;
  [key: string]: any;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";


export default function LogsPage() {
  useAuthRedirect();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BACKEND_URL}/logs`, { credentials: "include" });
        if (!res.ok) throw new Error("ログの取得に失敗しました");
        const data = await res.json();
        setLogs(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header />
      <main className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">📜 エージェントログ一覧</h1>
        {loading && <div className="text-gray-500">読み込み中...</div>}
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {!loading && !error && (
          <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border px-3 py-2 text-left">日時</th>
                  <th className="border px-3 py-2 text-left">ユーザー</th>
                  <th className="border px-3 py-2 text-left">内容</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-gray-400 py-6">ログがありません</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="border px-3 py-2 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="border px-3 py-2 whitespace-nowrap">{log.user_email}</td>
                      <td className="border px-3 py-2 text-xs break-all font-mono bg-gray-50">{JSON.stringify(log, null, 2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
