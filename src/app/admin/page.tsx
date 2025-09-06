"use client";
import React, { useEffect, useState, useRef } from "react";
import { useGetUserRole } from "@/hooks/useGetUserRole";
import Header from "@/components/Header";
import { useCheckUserRole } from "@/hooks/useCheckUserRole";

interface User {
  email: string;
  role: string;
}

interface PlatformLog {
  _id?: string;
  email: string;
  event_name: string;
  summary?: string;
  timestamp: string;
  error: boolean;
  content?: any;
}

export default function AdminPage() {
  const { userRole, loading } = useGetUserRole(true);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [platformLogs, setPlatformLogs] = useState<PlatformLog[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [checkedUserEmails, setCheckedUserEmails] = useState<string[]>([]);
  const [logsfetchedUserCount, setLogsFetchedUserCount] = useState<number>(0);
  const [platformLogsfetchedUserCount, setPlatformLogsFetchedUserCount] = useState<number>(0);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" }[]>([]);
  const [openDetails, setOpenDetails] = useState<number[]>([]);
  const [openPlatformDetails, setOpenPlatformDetails] = useState<number[]>([]);
  
  // ローディング状態管理
  const [loadingStates, setLoadingStates] = useState({
    fetchingLogs: false,
    fetchingPlatformLogs: false,
    deletingUser: false,
    updatingRole: false,
    downloadingLogs: false,
    downloadingPlatformLogs: false
  });
  
  // フィルタリング用のstate
  const [logFilters, setLogFilters] = useState({
    startDate: "",
    endDate: "",
    userEmail: "",
    searchText: ""
  });
  const [platformLogFilters, setPlatformLogFilters] = useState({
    startDate: "",
    endDate: "",
    userEmail: "",
    operation: "",
    errorOnly: false
  });
  
  const toastId = useRef(0);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // アクセス制限
  useCheckUserRole(["admin", "management"])

  // ユーザー一覧取得
  useEffect(() => {
    if (userRole === "admin" || userRole == "management") {
      fetch(`${BACKEND_URL}/users`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          // 非認証ユーザーを追加
          const usersWithAnonymous = [
            ...data,
            { email: "anonymous@a2a-routing.com", role: "非認証ユーザー" }
          ];
          setUsers(usersWithAnonymous);
        })
        .catch(() => showToast("ユーザー一覧の取得に失敗しました", "error"));
    }
  }, [userRole, BACKEND_URL]);

  // ユーザー自身のメールアドレス取得
  useEffect(() => {
    if (userRole === "admin") {
      fetch(`${BACKEND_URL}/auth/me`, { credentials: "include" })
        .then(res => res.json())
        .then(data => setCurrentUserEmail(data.email))
        .catch(() => setCurrentUserEmail(null));
    }
  }, [userRole, BACKEND_URL]);

  // トースト追加
  const showToast = (message: string, type: "success" | "error") => {
    const id = toastId.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // スピナーコンポーネント
  const Spinner = () => (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  // ユーザー削除
  const deleteUser = async (email: string) => {
    if (!confirm("本当に削除しますか？")) return;
    
    setLoadingStates(prev => ({ ...prev, deletingUser: true }));
    try {
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
    } catch {
      showToast("削除処理中にエラーが発生しました", "error");
    } finally {
      setLoadingStates(prev => ({ ...prev, deletingUser: false }));
    }
  };

  // ロール変更
  const changeRole = async (email: string, newRole: string) => {
    setLoadingStates(prev => ({ ...prev, updatingRole: true }));
    try {
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
    } catch {
      showToast("ロール変更処理中にエラーが発生しました", "error");
    } finally {
      setLoadingStates(prev => ({ ...prev, updatingRole: false }));
    }
  };

  // 選択ユーザーのログ取得
  const fetchLogs = async () => {
    if (checkedUserEmails.length === 0) {
      showToast("ユーザーを選択してください", "error");
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, fetchingLogs: true }));
    try {
      const requestBody: any = { user_emails: checkedUserEmails };
      
      // 期間指定がある場合は追加
      if (logFilters.startDate) {
        requestBody.start_date = new Date(logFilters.startDate).toISOString();
      }
      if (logFilters.endDate) {
        requestBody.end_date = new Date(logFilters.endDate).toISOString();
      }
      
      const res = await fetch(`${BACKEND_URL}/admin/logs`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      
      if (res.ok) {
        const data = await res.json();
        const userCount = checkedUserEmails.length;
        setLogs(data);
        setLogsFetchedUserCount(userCount);
        const periodText = logFilters.startDate || logFilters.endDate ? 
          ` (期間指定あり)` : "";
        showToast(`${userCount}人のユーザーのログを取得しました${periodText}`, "success");
      } else {
        const errorData = await res.json();
        const detail = errorData.detail || "ログ取得に失敗しました";
        showToast(detail, "error");
        setLogs([]);
      }
    } catch {
      showToast("ログ取得中にエラーが発生しました", "error");
      setLogs([]);
    } finally {
      setLoadingStates(prev => ({ ...prev, fetchingLogs: false }));
    }
  };

  // プラットフォーム操作ログ取得（常に復号化済みデータを受信）
  const fetchPlatformLogs = async () => {
    if (checkedUserEmails.length === 0) {
      showToast("ユーザーを選択してください", "error");
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, fetchingPlatformLogs: true }));
    try {
      const requestBody: any = { user_emails: checkedUserEmails };
      
      // 期間指定がある場合は追加
      if (platformLogFilters.startDate) {
        requestBody.start_date = new Date(platformLogFilters.startDate).toISOString();
      }
      if (platformLogFilters.endDate) {
        requestBody.end_date = new Date(platformLogFilters.endDate).toISOString();
      }
      
      const res = await fetch(`${BACKEND_URL}/admin/platform-logs`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (res.ok) {
        const data = await res.json();
        setPlatformLogs(data);
        const userCount = checkedUserEmails.length;
        setPlatformLogsFetchedUserCount(userCount);
        const periodText = platformLogFilters.startDate || platformLogFilters.endDate ? 
          ` (期間指定あり)` : "";
        showToast(`${checkedUserEmails.length}人のユーザーの操作ログを取得しました${periodText}`, "success");
      } else {
        const errorData = await res.json();
        const detail = errorData.detail || "操作ログ取得に失敗しました";
        showToast(detail, "error");
        setPlatformLogs([]);
      }
    } catch {
      showToast("操作ログの取得に失敗しました", "error");
      setPlatformLogs([]);
    } finally {
      setLoadingStates(prev => ({ ...prev, fetchingPlatformLogs: false }));
    }
  };

  // ログダウンロード
  const downloadLogs = () => {
    setLoadingStates(prev => ({ ...prev, downloadingLogs: true }));
    try {
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
      const filename = `A2A_Admin_Logs_${new Date().toISOString().slice(0, 10)}.json`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      showToast("ログのダウンロードを開始しました", "success");
    } catch {
      showToast("ダウンロードに失敗しました", "error");
    } finally {
      setTimeout(() => {
        setLoadingStates(prev => ({ ...prev, downloadingLogs: false }));
      }, 1000); // 1秒後にローディングを解除
    }
  };

  // ログをCSVでダウンロード
  function downloadLogsCsv(logs: any[]) {
    if (!logs.length) return;
    
    setLoadingStates(prev => ({ ...prev, downloadingLogs: true }));
    try {
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
      showToast("CSVダウンロードを開始しました", "success");
    } catch {
      showToast("CSVダウンロードに失敗しました", "error");
    } finally {
      setTimeout(() => {
        setLoadingStates(prev => ({ ...prev, downloadingLogs: false }));
      }, 1000);
    }
  }

  // プラットフォームログをCSVでダウンロード
  function downloadPlatformLogsCsv(logs: PlatformLog[]) {
    if (!logs.length) return;
    
    setLoadingStates(prev => ({ ...prev, downloadingPlatformLogs: true }));
    try {
      const headers = ["timestamp", "email", "event_name", "summary", "error", "content"];
      const rows = logs.map((log) => [
        new Date(log.timestamp).toLocaleString(),
        log.email,
        log.event_name,
        log.summary || "",
        log.error ? "Yes" : "No",
        log.content ? JSON.stringify(log.content).replace(/"/g, '""') : ""
      ]);
      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const filename = `A2A_Platform_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      showToast("プラットフォームログのCSVダウンロードを開始しました", "success");
    } catch {
      showToast("プラットフォームログCSVダウンロードに失敗しました", "error");
    } finally {
      setTimeout(() => {
        setLoadingStates(prev => ({ ...prev, downloadingPlatformLogs: false }));
      }, 1000);
    }
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

  // プラットフォームログ詳細トグル
  const togglePlatformDetail = (idx: number) => {
    setOpenPlatformDetails((prev) =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  // 会話ログフィルタリング
  const filteredLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    const startDate = logFilters.startDate ? new Date(logFilters.startDate) : null;
    const endDate = logFilters.endDate ? new Date(logFilters.endDate + 'T23:59:59') : null;
    
    // 日時フィルタ
    if (startDate && logDate < startDate) return false;
    if (endDate && logDate > endDate) return false;
    
    // ユーザーフィルタ
    if (logFilters.userEmail && !log.user_email.toLowerCase().includes(logFilters.userEmail.toLowerCase())) return false;
    
    // テキスト検索フィルタ
    if (logFilters.searchText) {
      const userInput = log.history?.find((h: any) => h.role === "user")?.parts?.[0]?.text || "";
      const agentResponse = log.status?.message?.parts?.[0]?.text || log.status?.message || "";
      const searchLower = logFilters.searchText.toLowerCase();
      if (!userInput.toLowerCase().includes(searchLower) && 
          !agentResponse.toLowerCase().includes(searchLower)) return false;
    }
    
    return true;
  });

  // プラットフォームログフィルタリング
  const filteredPlatformLogs = platformLogs.filter(log => {
    const logDate = new Date(log.timestamp);
    const startDate = platformLogFilters.startDate ? new Date(platformLogFilters.startDate) : null;
    const endDate = platformLogFilters.endDate ? new Date(platformLogFilters.endDate + 'T23:59:59') : null;
    
    // 日時フィルタ
    if (startDate && logDate < startDate) return false;
    if (endDate && logDate > endDate) return false;
    
    // ユーザーフィルタ
    if (platformLogFilters.userEmail && !log.email.toLowerCase().includes(platformLogFilters.userEmail.toLowerCase())) return false;
    
    // 操作フィルタ
    if (platformLogFilters.operation && !log.event_name.toLowerCase().includes(platformLogFilters.operation.toLowerCase())) return false;
    
    // エラーのみフィルタ
    if (platformLogFilters.errorOnly && !log.error) return false;
    
    return true;
  });

  // フィルタクリア
  const clearLogFilters = () => {
    setLogFilters({
      startDate: "",
      endDate: "",
      userEmail: "",
      searchText: ""
    });
  };

  const clearPlatformLogFilters = () => {
    setPlatformLogFilters({
      startDate: "",
      endDate: "",
      userEmail: "",
      operation: "",
      errorOnly: false
    });
  };

  if(loading){
    return(<div className="min-h-screen bg-gray-100 text-gray-900">
      <Header />
      </div>)
    }

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
          {(userRole === "admin" || userRole === "management") && (
            <div className="mb-3 flex gap-2">
              <button
                onClick={() => setCheckedUserEmails(users.map(u => u.email))}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded shadow text-xs"
              >
                全選択
              </button>
              <button
                onClick={() => setCheckedUserEmails([])}
                className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded shadow text-xs"
              >
                選択解除
              </button>
            </div>
          )}
          <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
            <table className="min-w-full text-sm">
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
                    <td className="border px-3 py-2">
                      {user.email === "anonymous@a2a-routing.com" ? (
                        <span className="text-gray-600">
                          非認証ユーザー
                        </span>
                      ) : (
                        user.email
                      )}
                    </td>
                    {userRole === "admin" && (
                      <td className="border px-3 py-2">
                        {user.email !== currentUserEmail && user.email !== "anonymous@a2a-routing.com" ? (
                          <select
                            value={user.role}
                            onChange={e => changeRole(user.email, e.target.value)}
                            className="border rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loadingStates.updatingRole}
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                            <option value="management">management</option>
                            <option value="maintainer">maintainer</option>
                          </select>
                        ) : user.email === "anonymous@a2a-routing.com" ? (
                          <span className="ml-2 text-xs text-gray-400">(変更不可)</span>
                        ) : (
                          <span className="ml-2 text-xs text-gray-400">(自身のアカウントは操作不可)</span>
                        )}
                      </td>
                    )}
                    {userRole === "admin" && (
                      <td className="border px-3 py-2">
                        {user.email !== currentUserEmail && user.email !== "anonymous@a2a-routing.com" ? (
                          <button
                            onClick={() => deleteUser(user.email)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded text-s disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loadingStates.deletingUser}
                          >
                            {loadingStates.deletingUser && <Spinner />}
                            削除
                          </button>
                        ) : user.email === "anonymous@a2a-routing.com" ? (
                          <span className="ml-2 text-xs text-gray-400">(削除不可)</span>
                        ) : (
                          <span className="ml-2 text-xs text-gray-400">(自身のアカウントは操作不可)</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="my-3 p-3 bg-gray-50 rounded-lg border">
            <p className="text-sm text-gray-600 mb-2">
              選択中のユーザー: {checkedUserEmails.length}人
              {checkedUserEmails.length > 0 && (
                <span className="ml-2 text-xs">
                  ({checkedUserEmails
                    .filter(email => email !== "anonymous@a2a-routing.com")
                    .map(email => email === "anonymous@a2a-routing.com" ? "非認証ユーザー" : email)
                    .join(", ")}
                  {checkedUserEmails.includes("anonymous@a2a-routing.com") && 
                   checkedUserEmails.filter(email => email !== "anonymous@a2a-routing.com").length > 0 && 
                   ", "}
                  {checkedUserEmails.includes("anonymous@a2a-routing.com") && "非認証ユーザー"})
                </span>
              )}
            </p>
          </div>
        </section>
        {/* ログ管理セクションはadmin/management両方で表示 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">会話ログ管理</h2>
          <div className="mb-4">
            <button
              onClick={fetchLogs}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow text-sm font-semibold mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={checkedUserEmails.length === 0 || loadingStates.fetchingLogs}
            >
              {loadingStates.fetchingLogs && <Spinner />}
              ログ取得
            </button>
            <button
              onClick={downloadLogs}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow text-sm font-semibold mb-2 ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={logs.length === 0 || loadingStates.downloadingLogs}
            >
              {loadingStates.downloadingLogs && <Spinner />}
              ログをダウンロード
            </button>
            <button
              onClick={() => downloadLogsCsv(filteredLogs)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow text-sm font-semibold mb-2 ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={filteredLogs.length === 0 || loadingStates.downloadingLogs}
            >
              {loadingStates.downloadingLogs && <Spinner />}
              CSVでダウンロード（フィルタ適用）
            </button>
          </div>
          
          {/* 期間指定でのログ取得 */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold mb-2 text-blue-700">期間指定ログ取得</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">開始日時</label>
                <input
                  type="date"
                  value={logFilters.startDate}
                  onChange={(e) => setLogFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">終了日時</label>
                <input
                  type="date"
                  value={logFilters.endDate}
                  onChange={(e) => setLogFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <button
                  onClick={fetchLogs}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={checkedUserEmails.length === 0 || loadingStates.fetchingLogs}
                >
                  {loadingStates.fetchingLogs && <Spinner />}
                  期間指定で取得
                </button>
                <p className="text-xs text-gray-500 mt-1">期間指定時はlimit制限なし</p>
              </div>
            </div>
          </div>
          
          {/* フィルタUI */}
          {logs.length > 0 && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-sm font-semibold mb-3 text-gray-700">フィルタ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">開始日</label>
                  <input
                    type="date"
                    value={logFilters.startDate}
                    onChange={(e) => setLogFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">終了日</label>
                  <input
                    type="date"
                    value={logFilters.endDate}
                    onChange={(e) => setLogFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">ユーザー</label>
                  <input
                    type="text"
                    placeholder="メールアドレスを入力"
                    value={logFilters.userEmail}
                    onChange={(e) => setLogFilters(prev => ({ ...prev, userEmail: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">テキスト検索</label>
                  <input
                    type="text"
                    placeholder="入力・応答内容を検索"
                    value={logFilters.searchText}
                    onChange={(e) => setLogFilters(prev => ({ ...prev, searchText: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={clearLogFilters}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-xs"
                >
                  フィルタクリア
                </button>
                <span className="text-xs text-gray-600 flex items-center">
                  表示件数: {filteredLogs.length} / {logs.length}
                </span>
              </div>
            </div>
          )}
          
          {logs.length > 0 && (
            <div className="mt-2 mb-2 p-2 bg-blue-50 rounded border">
              <p className="text-sm text-blue-700">
                {logsfetchedUserCount}人のユーザーから{logs.length}件のログを取得しました
                {filteredLogs.length !== logs.length && (
                  <span className="ml-2 text-blue-600">（フィルタ適用後: {filteredLogs.length}件）</span>
                )}
              </p>
            </div>
          )}
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
                
                {(filteredLogs.length === 0) ? (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-6">
                      {logs.length === 0 ? "ログがありません" : "フィルタ条件に一致するログがありません"}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, idx) => {
                    const userInput = log.history?.find((h: any) => h.role === "user")?.parts?.[0]?.text || "";
                    const agentResponse = log.status?.message?.parts?.[0]?.text || log.status?.message || "";
                    const originalIdx = logs.findIndex(l => l._id === log._id || l.timestamp === log.timestamp);
                    return (
                      <React.Fragment key={log._id || idx}>
                        <tr
                          className={`hover:bg-gray-50 cursor-pointer ${openDetails.includes(originalIdx) ? "bg-blue-50" : ""}`}
                          onClick={() => toggleDetail(originalIdx)}
                        >
                          <td className="border px-3 py-2 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="border px-3 py-2 whitespace-nowrap">
                            {log.user_email === "anonymous@a2a-routing.com" ? "非認証ユーザー" : log.user_email}
                          </td>
                          <td className="border px-3 py-2 text-xs break-all font-mono bg-gray-50">
                            {userInput.length > 100 ? userInput.slice(0, 100) + "..." : userInput}
                          </td>
                          <td className="border px-3 py-2 text-xs break-all font-mono bg-gray-50">
                            {agentResponse.length > 100 ? agentResponse.slice(0, 100) + "..." : agentResponse}
                          </td>
                        </tr>
                        {openDetails.includes(originalIdx) && (
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

        {/* 操作ログ管理セクション（admin/management両方で表示） */}
        <section>
          <h2 className="text-xl font-semibold mb-2">操作ログ管理</h2>
          <div className="mb-4">
            <button
              onClick={() => fetchPlatformLogs()}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded shadow text-sm font-semibold mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={checkedUserEmails.length === 0 || loadingStates.fetchingPlatformLogs}
            >
              {loadingStates.fetchingPlatformLogs && <Spinner />}
              操作ログ取得
            </button>
            <button
              onClick={() => downloadPlatformLogsCsv(filteredPlatformLogs)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow text-sm font-semibold mb-2 ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={filteredPlatformLogs.length === 0 || loadingStates.downloadingPlatformLogs}
            >
              {loadingStates.downloadingPlatformLogs && <Spinner />}
              CSVでダウンロード（フィルタ適用）
            </button>
          </div>
          
          {/* 期間指定での操作ログ取得 */}
          <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="text-sm font-semibold mb-2 text-purple-700">期間指定操作ログ取得</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">開始日時</label>
                <input
                  type="date"
                  value={platformLogFilters.startDate}
                  onChange={(e) => setPlatformLogFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">終了日時</label>
                <input
                  type="date"
                  value={platformLogFilters.endDate}
                  onChange={(e) => setPlatformLogFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <button
                  onClick={() => fetchPlatformLogs()}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-1 rounded text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={checkedUserEmails.length === 0 || loadingStates.fetchingPlatformLogs}
                >
                  {loadingStates.fetchingPlatformLogs && <Spinner />}
                  期間指定で取得
                </button>
                <p className="text-xs text-gray-500 mt-1">期間指定時はlimit制限なし</p>
              </div>
            </div>
          </div>
          
          {/* フィルタUI */}
          {platformLogs.length > 0 && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-sm font-semibold mb-3 text-gray-700">フィルタ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">開始日</label>
                  <input
                    type="date"
                    value={platformLogFilters.startDate}
                    onChange={(e) => setPlatformLogFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">終了日</label>
                  <input
                    type="date"
                    value={platformLogFilters.endDate}
                    onChange={(e) => setPlatformLogFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">ユーザー</label>
                  <input
                    type="text"
                    placeholder="メールアドレスを入力"
                    value={platformLogFilters.userEmail}
                    onChange={(e) => setPlatformLogFilters(prev => ({ ...prev, userEmail: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">操作</label>
                  <input
                    type="text"
                    placeholder="操作名を入力"
                    value={platformLogFilters.operation}
                    onChange={(e) => setPlatformLogFilters(prev => ({ ...prev, operation: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">ステータス</label>
                  <label className="flex items-center text-xs">
                    <input
                      type="checkbox"
                      checked={platformLogFilters.errorOnly}
                      onChange={(e) => setPlatformLogFilters(prev => ({ ...prev, errorOnly: e.target.checked }))}
                      className="mr-1"
                    />
                    エラーのみ
                  </label>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={clearPlatformLogFilters}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-xs"
                >
                  フィルタクリア
                </button>
                <span className="text-xs text-gray-600 flex items-center">
                  表示件数: {filteredPlatformLogs.length} / {platformLogs.length}
                </span>
              </div>
            </div>
          )}
          
          {platformLogs.length > 0 && (
            <div className="mt-2 mb-2 p-2 bg-blue-50 rounded border">
              <p className="text-sm text-blue-700">
                {platformLogsfetchedUserCount}人のユーザーから{platformLogs.length}件のログを取得しました
                {filteredPlatformLogs.length !== platformLogs.length && (
                  <span className="ml-2 text-blue-600">（フィルタ適用後: {filteredPlatformLogs.length}件）</span>
                )}
              </p>
            </div>
          )}
          <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200 mt-2">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border px-3 py-2 text-left">日時</th>
                  <th className="border px-3 py-2 text-left">ユーザー</th>
                  <th className="border px-3 py-2 text-left">操作</th>
                  <th className="border px-3 py-2 text-left">概要</th>
                  <th className="border px-3 py-2 text-left">ステータス</th>
                  <th className="border px-3 py-2 text-left">詳細</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlatformLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-400 py-6">
                      {platformLogs.length === 0 ? "操作ログがありません" : "フィルタ条件に一致する操作ログがありません"}
                    </td>
                  </tr>
                ) : (
                  filteredPlatformLogs.map((log, idx) => {
                    const originalIdx = platformLogs.findIndex(l => l._id === log._id || l.timestamp === log.timestamp);
                    return (
                      <React.Fragment key={log._id || idx}>
                        <tr 
                          className={`hover:bg-gray-50 ${log.content ? 'cursor-pointer' : ''} ${openPlatformDetails.includes(originalIdx) ? "bg-blue-50" : ""}`}
                          onClick={() => log.content && togglePlatformDetail(originalIdx)}
                        >
                          <td className="border px-3 py-2 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="border px-3 py-2">
                            {log.email === "anonymous@a2a-routing.com" ? "非認証ユーザー" : log.email}
                          </td>
                          <td className="border px-3 py-2">{log.event_name}</td>
                          <td className="border px-3 py-2">
                            {log.summary || <span className="text-gray-400 text-xs">概要なし</span>}
                          </td>
                          <td className="border px-3 py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              log.error 
                                ? "bg-red-100 text-red-800" 
                                : "bg-green-100 text-green-800"
                            }`}>
                              {log.error ? "エラー" : "成功"}
                            </span>
                          </td>
                          <td className="border px-3 py-2">
                            {log.content ? (
                              <span className="text-blue-600 text-xs">クリックで詳細表示</span>
                            ) : (
                              <span className="text-gray-400 text-xs">詳細なし</span>
                            )}
                          </td>
                        </tr>
                        {openPlatformDetails.includes(originalIdx) && log.content && (
                          <tr>
                            <td colSpan={6} className="bg-gray-100 border-t px-3 py-2">
                              <div className="max-h-64 overflow-y-auto">
                                <pre className="whitespace-pre-wrap text-xs font-mono p-2 bg-gray-50 rounded border border-gray-200">
                                  {JSON.stringify(log.content, null, 2)}
                                </pre>
                              </div>
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


