"use client";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { saveAs } from "file-saver";

interface LogEntry {
  _id: string;
  timestamp: string;
  user_email: string;
  [key: string]: any;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

function prettyJson(obj: any) {
  return JSON.stringify(obj, null, 2);
}

function downloadLogs(logs: LogEntry[]) {
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
  const filename = `A2A_Routing_Service_logs_${new Date().toISOString().slice(0, 10)}.json`;
  saveAs(blob, filename);
}

export default function LogsPage() {
  useAuthRedirect();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openRows, setOpenRows] = useState<{ [id: string]: boolean }>({});

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

  const toggleRow = (id: string) => {
    setOpenRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header />
      <main className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">📜 エージェントログ一覧</h1>
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => downloadLogs(logs)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow text-sm font-semibold"
            disabled={logs.length === 0}
          >
            ログをダウンロード
          </button>
        </div>
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
                  logs.map((log) => {
                    // 内容の要約（例: status, task, message など主要フィールドのみ表示）
                    const summary = log.status?.message?.parts?.[0]?.text || log.status?.message || "...";
                    return (
                      <>
                        <tr
                          key={log._id}
                          className={"hover:bg-gray-50 cursor-pointer"}
                          onClick={() => toggleRow(log._id)}
                        >
                          <td className="border px-3 py-2 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="border px-3 py-2 whitespace-nowrap">{log.user_email}</td>
                          <td className="border px-3 py-2 text-xs break-all font-mono bg-gray-50">
                            {summary.length > 100 ? summary.slice(0, 100) + "..." : summary}
                            <span className="ml-2 text-blue-500">{openRows[log._id] ? "▲" : "▼"}</span>
                          </td>
                        </tr>
                        {openRows[log._id] && (
                          <tr>
                            <td colSpan={3} className="bg-gray-100 border-t px-3 py-2">
                              <pre className="whitespace-pre-wrap text-xs font-mono overflow-x-auto p-2 bg-gray-50 rounded border border-gray-200">
                                {prettyJson(log)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
