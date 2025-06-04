"use client";
import { useEffect, useState } from "react";

interface LogEntry {
  _id: string;
  timestamp: string;
  user_email: string;
  [key: string]: any;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";


export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BACKEND_URL}/logs`);
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
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">エージェントログ一覧</h1>
      {loading && <div>読み込み中...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr>
                <th className="border px-2 py-1">日時</th>
                <th className="border px-2 py-1">ユーザー</th>
                <th className="border px-2 py-1">内容</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="border px-2 py-1">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="border px-2 py-1">{log.user_email}</td>
                  <td className="border px-2 py-1 text-xs break-all">{JSON.stringify(log, null, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
