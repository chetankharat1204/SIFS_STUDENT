// NotificationsPage.tsx
import { useState, useEffect, useCallback } from "react";
import {
  FaRegBell, FaBell, FaExclamationTriangle,
  FaCheckCircle, FaFilter, FaSearch, FaSyncAlt,
} from "react-icons/fa";
import { studentAuthAPI } from "../../services/apiService";
import type { NotificationItem } from "../../services/apiService";
import { useTheme } from "../../contexts/ThemeContext";
import PageShell from "../../components/PageShell";
import {
  NotificationCard,
  NotificationDetailModal,
  stripHtml,
} from "../../components/ui/NotificationBell";

// ─── Filter types ─────────────────────────────────────────────────────────────
type UrgencyFilter = "all" | "high" | "medium" | "low";
type TypeFilter    = "all" | "test" | "exam" | "assignment" | "project" | "case_study";
type ReadFilter    = "all" | "unread" | "read";

const URGENCY_TABS: { label: string; value: UrgencyFilter; color: string }[] = [
  { label: "All",    value: "all",    color: "bg-gray-200 text-gray-600" },
  { label: "High",   value: "high",   color: "bg-red-100 text-red-700" },
  { label: "Medium", value: "medium", color: "bg-amber-100 text-amber-700" },
  { label: "Low",    value: "low",    color: "bg-blue-100 text-blue-700" },
];

const TYPE_OPTIONS: { label: string; value: TypeFilter }[] = [
  { label: "All Types",   value: "all" },
  { label: "Test",        value: "test" },
  { label: "Exam",        value: "exam" },
  { label: "Assignment",  value: "assignment" },
  { label: "Project",     value: "project" },
  { label: "Case Study",  value: "case_study" },
];

export default function NotificationsPage() {
  const { isDark } = useTheme();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState<string | null>(null);
  const [readIds, setReadIds]  = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<NotificationItem | null>(null);

  // filters
  const [urgency, setUrgency]   = useState<UrgencyFilter>("all");
  const [typeF, setTypeF]       = useState<TypeFilter>("all");
  const [readF, setReadF]       = useState<ReadFilter>("all");
  const [search, setSearch]     = useState("");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await studentAuthAPI.getNotifications();
      if (apiError || !data?.success) { setError(apiError || "Failed to load notifications"); return; }
      setNotifications(data.data.notifications ?? []);
    } catch {
      setError("Unexpected error. Please retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead    = (id: number) => setReadIds((prev) => new Set([...prev, id]));
  const markAllRead = () => setReadIds(new Set(notifications.map((n) => n.id)));
  const isRead      = (n: NotificationItem) => n.is_read || readIds.has(n.id);
  const unreadCount = notifications.filter((n) => !isRead(n)).length;

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = notifications.filter((n) => {
    if (urgency !== "all" && n.urgency_level !== urgency) return false;
    if (typeF   !== "all" && n.type          !== typeF)   return false;
    if (readF   === "unread" && isRead(n))  return false;
    if (readF   === "read"   && !isRead(n)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        stripHtml(n.item_name).toLowerCase().includes(q) ||
        n.course_name.toLowerCase().includes(q) ||
        n.type_label.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── Grouped by urgency for display ───────────────────────────────────────
  const high   = filtered.filter((n) => n.urgency_level === "high");
  const medium = filtered.filter((n) => n.urgency_level === "medium");
  const low    = filtered.filter((n) => n.urgency_level === "low");

  const groups =
    urgency !== "all"
      ? [{ label: urgency === "high" ? "🔴 High Priority" : urgency === "medium" ? "🟡 Medium Priority" : "🔵 Low Priority", items: filtered }]
      : [
          { label: "🔴 High Priority", items: high },
          { label: "🟡 Medium Priority", items: medium },
          { label: "🔵 Low Priority", items: low },
        ].filter((g) => g.items.length > 0);

  return (
    <PageShell
      title="Notifications"
      subtitle="All your upcoming deadlines in one place"
      breadcrumb={["Home", "Notifications"]}
    >
      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total",  value: notifications.length,                       color: isDark ? "text-blue-400"  : "text-blue-600",  bg: isDark ? "bg-blue-900/20"  : "bg-blue-50"  },
          { label: "Unread", value: unreadCount,                                color: isDark ? "text-red-400"   : "text-red-600",   bg: isDark ? "bg-red-900/20"   : "bg-red-50"   },
          { label: "High",   value: notifications.filter(n => n.urgency_level === "high").length,   color: isDark ? "text-rose-400"  : "text-rose-600",  bg: isDark ? "bg-rose-900/20"  : "bg-rose-50"  },
          { label: "Low",    value: notifications.filter(n => n.urgency_level === "low").length,    color: isDark ? "text-green-400" : "text-green-600", bg: isDark ? "bg-green-900/20" : "bg-green-50" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl p-4 card border ${isDark ? "border-gray-700" : "border-gray-100"} ${stat.bg}`}>
            <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
            <p className={`text-xs font-semibold mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className={`rounded-xl border p-4 mb-5 card ${isDark ? "border-gray-700" : "border-gray-100"}`}>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className={`flex items-center gap-2 flex-1 rounded-lg border px-3 py-2 ${isDark ? "bg-gray-800 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
            <FaSearch className={`text-[13px] flex-shrink-0 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
            <input
              type="text"
              placeholder="Search notifications…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`flex-1 bg-transparent text-sm outline-none ${isDark ? "text-gray-200 placeholder-gray-600" : "text-gray-700 placeholder-gray-400"}`}
            />
            {search && (
              <button onClick={() => setSearch("")} className={`text-[11px] ${isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}>✕</button>
            )}
          </div>

          {/* Type filter */}
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${isDark ? "bg-gray-800 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
            <FaFilter className={`text-[12px] flex-shrink-0 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
            <select
              value={typeF}
              onChange={(e) => setTypeF(e.target.value as TypeFilter)}
              className={`bg-transparent text-sm outline-none ${isDark ? "text-gray-200" : "text-gray-700"}`}
            >
              {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Read filter */}
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${isDark ? "bg-gray-800 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
            <select
              value={readF}
              onChange={(e) => setReadF(e.target.value as ReadFilter)}
              className={`bg-transparent text-sm outline-none ${isDark ? "text-gray-200" : "text-gray-700"}`}
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${isDark ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
              >
                <FaCheckCircle className="text-[11px]" /> Mark all read
              </button>
            )}
            <button
              onClick={fetchNotifications}
              disabled={loading}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              <FaSyncAlt className={`text-[11px] ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Urgency tabs */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {URGENCY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setUrgency(tab.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                urgency === tab.value
                  ? isDark
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-blue-600 text-white shadow-md"
                  : isDark
                  ? "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Loading notifications…</p>
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className={`flex flex-col items-center justify-center py-16 gap-4 rounded-2xl border ${isDark ? "bg-red-900/10 border-red-800/30" : "bg-red-50 border-red-100"}`}>
          <FaExclamationTriangle className="text-red-400 text-3xl" />
          <p className={`text-sm font-medium ${isDark ? "text-red-400" : "text-red-600"}`}>{error}</p>
          <button onClick={fetchNotifications} className="text-sm font-semibold text-blue-500 hover:underline">Try again</button>
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && filtered.length === 0 && (
        <div className={`flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border ${isDark ? "bg-[#192840] border-gray-700" : "bg-gray-50 border-gray-100"}`}>
          {notifications.length === 0 ? (
            <>
              <FaRegBell className={`text-5xl ${isDark ? "text-gray-600" : "text-gray-300"}`} />
              <p className={`text-base font-semibold ${isDark ? "text-gray-400" : "text-gray-500"}`}>You're all caught up! 🎉</p>
              <p className={`text-sm ${isDark ? "text-gray-600" : "text-gray-400"}`}>No upcoming deadlines right now.</p>
            </>
          ) : (
            <>
              <FaBell className={`text-5xl ${isDark ? "text-gray-600" : "text-gray-300"}`} />
              <p className={`text-base font-semibold ${isDark ? "text-gray-400" : "text-gray-500"}`}>No results found</p>
              <p className={`text-sm ${isDark ? "text-gray-600" : "text-gray-400"}`}>Try adjusting your filters or search query.</p>
              <button onClick={() => { setSearch(""); setUrgency("all"); setTypeF("all"); setReadF("all"); }} className="text-sm font-semibold text-blue-500 hover:underline">
                Clear filters
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Grouped Notification List ── */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              {/* Group heading */}
              <div className="flex items-center gap-3 mb-3">
                <h2 className={`text-sm font-bold ${isDark ? "text-gray-300" : "text-slate-700"}`}>{group.label}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                  {group.items.length}
                </span>
              </div>

              <div className={`rounded-xl border overflow-hidden card ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                <ul className="divide-y divide-transparent">
                  {group.items.map((n) => (
                    <NotificationCard
                      key={n.id}
                      notification={n}
                      isRead={isRead(n)}
                      isDark={isDark}
                      onMarkRead={markRead}
                      onViewDetail={setSelected}
                    />
                  ))}
                </ul>
              </div>
            </div>
          ))}

          <p className={`text-center text-xs pt-2 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
            Showing {filtered.length} of {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selected && (
        <NotificationDetailModal
          notification={selected}
          isDark={isDark}
          onClose={() => setSelected(null)}
        />
      )}
    </PageShell>
  );
}
