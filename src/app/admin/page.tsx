"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGetUserRole } from "@/hooks/useGetUserRole";
import Header from "@/components/Header";
import { useCheckUserRole } from "@/hooks/useCheckUserRole";

interface User {
  email: string;
  role: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { userRole, loading } = useGetUserRole(true);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [checkedUserEmails, setCheckedUserEmails] = useState<string[]>([]);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" }[]>([]);
  const [openDetails, setOpenDetails] = useState<number[]>([]);
  const toastId = useRef(0);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // アクセス制限
  useCheckUserRole(["admin", "management"])

  // ユーザー一覧取得
  useEffect(() => {
    if (userRole === "admin" || userRole == "management") {
      fetch(`${BACKEND_URL}/users`, { credentials: "include" })
        .then(res => res.json())
        .then(setUsers)
        .catch(() => setError("ユーザー一覧の取得に失敗しました"));
    }
  }, [userRole]);

  // ユーザー自身のメールアドレス取得
  useEffect(() => {
    if (userRole === "admin") {
      fetch(`${BACKEND_URL}/auth/me`, { credentials: "include" })
        .then(res => res.json())
        .then(data => setCurrentUserEmail(data.email))
        .catch(() => setCurrentUserEmail(null));
    }
  }, [userRole]);

  // トースト追加
  const showToast = (message: string, type: "success" | "error") => {
    const id = toastId.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // ユーザー削除
  const deleteUser = async (email: string) => {
    if (!confirm("本当に削除しますか？")) return;
    const res = await fetch(`${BACKEND_URL}/users/${email}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setUsers(users.filter(u => u.email !== email));
      showToast("ユーザーを削除しました", "success");
    } else {
      showToast("削除に失敗しました", "error");
    }
  };

  // ロール変更
  const changeRole = async (email: string, newRole: string) => {
    const res = await fetch(`${BACKEND_URL}/users/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, role: newRole }),
    });
    if (res.ok) {
      setUsers(users.map(u => u.email === email ? { ...u, role: newRole } : u));
      showToast("ロールを変更しました", "success");
    } else {
      showToast("ロール変更に失敗しました", "error");
    }
  };

  // 選択ユーザーのログ取得
  const fetchLogs = async () => {
    if (checkedUserEmails.length === 0) {
      showToast("ユーザーを選択してください", "error");
      return;
    }
    let res = await fetch(`${BACKEND_URL}/admin/logs`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_emails: checkedUserEmails }),
    });
    if (res.ok){
      let data = res = await res.json();
    if (data){
      setLogs(data);
      showToast("ログを取得しました", "success");
    }
    }else{
      let detail = (await res.json()).detail
      if(!detail){
        detail = ""
      }
      showToast(`ログの取得に失敗しました${detail}`, "error")
      setLogs([]);
    }
    
  };

  // ログダウンロード
  const downloadLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const filename = `A2A_Admin_Logs_${new Date().toISOString().slice(0, 10)}.json`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  // ログをCSVでダウンロード
  function downloadLogsCsv(logs: any[]) {
    if (!logs.length) return;
    const headers = ["timestamp", "user_email", "user_input", "agent_response", "raw_json"];
    const rows = logs.map((log) => {
      const userInput = log.history?.find((h: any) => h.role === "user")?.parts?.[0]?.text || "";
      const agentResponse = log.status?.message?.parts?.[0]?.text || log.status?.message || "";
      const rawJson = '"' + JSON.stringify(log).replace(/"/g, '""') + '"';
      return [
        new Date(log.timestamp).toLocaleString(),
        log.user_email,
        JSON.stringify(userInput),
        JSON.stringify(agentResponse),
        rawJson
      ];
    });
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const filename = `A2A_Admin_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  // チェックボックスの切り替え
  const handleCheckboxChange = (email: string) => {
    setCheckedUserEmails(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  // ログ詳細トグル
  const toggleDetail = (idx: number) => {
    setOpenDetails((prev) =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  if (loading || (userRole !== "admin" && userRole !== "management")) return null;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header />
      {/* Toast通知 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full flex flex-col items-center z-[9999] pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`relative flex items-center w-full max-w-md mx-auto mb-2 px-5 py-3 rounded-lg shadow-2xl border-l-4 transition-all duration-300 animate-fade-in-down
              ${toast.type === "success" ? "bg-white border-green-500" : "bg-white border-red-500"}`}
            style={{ opacity: 0.98, pointerEvents: 'auto' }}
          >
            <span className="mr-3 text-2xl">
              {toast.type === "success" ? (
                <svg className="inline-block text-green-500" width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#22c55e" opacity="0.15"/><path d="M7 13l3 3 7-7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <svg className="inline-block text-red-500" width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#ef4444" opacity="0.15"/><path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
            </span>
            <span className={`flex-1 text-sm font-medium ${toast.type === "success" ? "text-green-700" : "text-red-700"}`}>{toast.message}</span>
            <button
              className="ml-3 text-gray-400 hover:text-gray-700 focus:outline-none pointer-events-auto"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              aria-label="閉じる"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 8.586l4.95-4.95a1 1 0 111.414 1.415L11.414 10l4.95 4.95a1 1 0 01-1.414 1.415L10 11.414l-4.95 4.95a1 1 0 01-1.415-1.414L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z" clipRule="evenodd"/></svg>
            </button>
            <style jsx>{`
              @keyframes fade-in-down {
                0% { opacity: 0; transform: translateY(-20px); }
                100% { opacity: 1; transform: translateY(0); }
              }
              .animate-fade-in-down {
                animation: fade-in-down 0.4s cubic-bezier(0.4,0,0.2,1);
              }
            `}</style>
          </div>
        ))}
      </div>
      <main className="p-6 max-w-6xl mx-auto">
        {userRole === "admin" && (
        <section className="mb-4">
          <h2 className="text-xl font-semibold mb-3 flex items-center">
            <svg className="inline-block mr-2 text-blue-500" width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#3b82f6" opacity="0.12"/><path d="M8 12h8M8 16h5M8 8h8" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Role Permissions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 shadow-sm">
              <div className="font-bold text-blue-700 mb-1 flex items-center text-base"><span className="mr-2">🛡️</span>admin</div>
              <ul className="list-none pl-4 text-blue-900 space-y-0.5 text-sm">
                <li>Register Agent</li>
                <li>Register MCP Server</li>
                <li>User Management</li>
                <li>Role Management</li>
                <li>Log Management (all users)</li>
              </ul>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 shadow-sm">
              <div className="font-bold text-purple-700 mb-1 flex items-center text-base"><span className="mr-2">📊</span>management</div>
              <ul className="list-none pl-4 text-purple-900 space-y-0.5 text-sm">
                <li>Log Management (all users)</li>
              </ul>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 shadow-sm">
              <div className="font-bold text-green-700 mb-1 flex items-center text-base"><span className="mr-2">🛠️</span>maintainer</div>
              <ul className="list-none pl-4 text-green-900 space-y-0.5 text-sm">
                <li>Register Agent</li>
                <li>Register MCP Server</li>
              </ul>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 shadow-sm">
              <div className="font-bold text-gray-700 mb-1 flex items-center text-base"><span className="mr-2">👤</span>user</div>
              <ul className="list-none pl-4 text-gray-900 space-y-0.5 text-sm">
                <li>View Agents</li>
                <li>View MCP Servers</li>
                <li>View Own Logs</li>
              </ul>
            </div>
          </div>
        </section>
        )}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">ユーザー管理</h2>
          <table className="min-w-full text-sm bg-white rounded shadow border">
            <thead className="bg-gray-50">
              {userRole === "admin" ? (
              <tr>
                <th className="border px-3 py-2 text-center">選択</th>
                <th className="border px-3 py-2">メールアドレス</th>
                <th className="border px-3 py-2">ロール</th>
                <th className="border px-3 py-2">操作</th>
              </tr>
              ): (
              <tr>
                <th className="border px-3 py-2 text-center">選択</th>
                <th className="border px-3 py-2">メールアドレス</th>
              </tr>
              )}
              
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.email}>
                  <td className="border px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={checkedUserEmails.includes(user.email)}
                      onChange={() => handleCheckboxChange(user.email)}
                    />
                  </td>
                  <td className="border px-3 py-2">{user.email}</td>
                  {userRole === "admin" && (
                    <td className="border px-3 py-2">
                      {user.email !== currentUserEmail ? (
                        <select
                          value={user.role}
                          onChange={e => changeRole(user.email, e.target.value)}
                          className="border rounded px-2 py-1"
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                          <option value="management">management</option>
                          <option value="maintainer">maintainer</option>
                        </select>
                      ) : (
                        <span className="ml-2 text-xs text-gray-400">(自身のアカウントは操作不可)</span>
                      )}
                    </td>
                  )}
                  {userRole === "admin" && (
                    <td className="border px-3 py-2">
                      {user.email !== currentUserEmail ? (
                        <button
                          onClick={() => deleteUser(user.email)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded text-s"
                        >削除</button>
                      ):(<span className="ml-2 text-xs text-gray-400">(自身のアカウントは操作不可)</span>)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        {/* ログ管理セクションはadmin/management両方で表示 */}
        <section>
          <h2 className="text-xl font-semibold mb-2">ログ管理</h2>
          <button
            onClick={fetchLogs}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow text-sm font-semibold mb-2"
          >ログ取得</button>
          <button
            onClick={downloadLogs}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow text-sm font-semibold mb-2 ml-2"
            disabled={logs.length === 0}
          >ログをダウンロード</button>
          <button
            onClick={() => downloadLogsCsv(logs)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow text-sm font-semibold mb-2 ml-2"
            disabled={logs.length === 0}
          >CSVでダウンロード</button>
          <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200 mt-2">
            <table className="min-w-full text-sm table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border px-3 py-2 text-left w-40 min-w-32">日時</th>
                  <th className="border px-3 py-2 text-left w-64 min-w-40">ユーザー</th>
                  <th className="border px-3 py-2 text-left w-96 min-w-60">ユーザー入力</th>
                  <th className="border px-3 py-2 text-left w-[32rem] min-w-80">エージェント応答</th>
                </tr>
              </thead>
              <tbody>
                
                {(logs.length === 0) ? (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-6">ログがありません</td>
                  </tr>
                ) : (
                  logs.map((log, idx) => {
                    const userInput = log.history?.find((h: any) => h.role === "user")?.parts?.[0]?.text || "";
                    const agentResponse = log.status?.message?.parts?.[0]?.text || log.status?.message || "";
                    return (
                      <React.Fragment key={log._id || idx}>
                        <tr
                          className={`hover:bg-gray-50 cursor-pointer ${openDetails.includes(idx) ? "bg-blue-50" : ""}`}
                          onClick={() => toggleDetail(idx)}
                        >
                          <td className="border px-3 py-2 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="border px-3 py-2 whitespace-nowrap">{log.user_email}</td>
                          <td className="border px-3 py-2 text-xs break-all font-mono bg-gray-50">
                            {userInput.length > 100 ? userInput.slice(0, 100) + "..." : userInput}
                          </td>
                          <td className="border px-3 py-2 text-xs break-all font-mono bg-gray-50">
                            {agentResponse.length > 100 ? agentResponse.slice(0, 100) + "..." : agentResponse}
                          </td>
                        </tr>
                        {openDetails.includes(idx) && (
                          <tr>
                            <td colSpan={4} className="bg-gray-100 border-t px-3 py-2">
                              <pre className="whitespace-pre-wrap text-xs font-mono overflow-x-auto p-2 bg-gray-50 rounded border border-gray-200">
                                {JSON.stringify(log, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}


