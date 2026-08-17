// NotificationBell.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import {
  FaRegBell, FaBell, FaTimes, FaClock,
  FaExclamationTriangle, FaCheckCircle, FaArrowRight,
  FaCalendarAlt, FaLayerGroup,
} from "react-icons/fa";
import { MdAssignment, MdQuiz, MdSchool, MdWork, MdMenuBook } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { studentAuthAPI } from "../../services/apiService";
import type { NotificationItem } from "../../services/apiService";
import { useTheme } from "../../contexts/ThemeContext";

// ─── Helpers ────────────────────────────────────────────────────────────────

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getTypeIcon(type: string, size = "text-[14px]") {
  switch (type.toLowerCase()) {
    case "test":       return <MdQuiz className={size} />;
    case "exam":       return <MdSchool className={size} />;
    case "assignment": return <MdAssignment className={size} />;
    case "project":    return <MdWork className={size} />;
    case "case_study": return <MdMenuBook className={size} />;
    default:           return <MdAssignment className={size} />;
  }
}

export const urgencyConfig = {
  high: {
    badge:     "bg-red-100 text-red-700 border border-red-200",
    badgeDark: "bg-red-900/40 text-red-400 border border-red-700/40",
    strip:     "border-l-red-500",
    headerBg:  "from-red-500 to-rose-600",
    icon:      <FaExclamationTriangle className="text-red-500 text-[11px]" />,
  },
  medium: {
    badge:     "bg-amber-100 text-amber-700 border border-amber-200",
    badgeDark: "bg-amber-900/40 text-amber-400 border border-amber-700/40",
    strip:     "border-l-amber-400",
    headerBg:  "from-amber-400 to-orange-500",
    icon:      <FaClock className="text-amber-400 text-[11px]" />,
  },
  low: {
    badge:     "bg-blue-100 text-blue-700 border border-blue-200",
    badgeDark: "bg-blue-900/40 text-blue-400 border border-blue-700/40",
    strip:     "border-l-blue-400",
    headerBg:  "from-blue-400 to-indigo-500",
    icon:      <FaClock className="text-blue-400 text-[11px]" />,
  },
} as const;

// ─── Notification Detail Modal ────────────────────────────────────────────────

interface DetailModalProps {
  notification: NotificationItem;
  isDark: boolean;
  onClose: () => void;
}

export function NotificationDetailModal({ notification, isDark, onClose }: DetailModalProps) {
  const navigate = useNavigate();
  const cfg = urgencyConfig[notification.urgency_level] ?? urgencyConfig.low;
  const cleanName = stripHtml(notification.item_name);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden
          ${isDark ? "bg-[#192840] border border-gray-700" : "bg-white border border-gray-200"}`}
      >
        {/* Gradient header strip */}
        <div className={`bg-gradient-to-r ${cfg.headerBg} p-5 text-white`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                {getTypeIcon(notification.type, "text-[20px]")}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
                  {notification.type_label}
                </p>
                <h2 className="text-sm font-bold leading-snug mt-0.5">
                  {cleanName || "Untitled"}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <FaTimes className="text-[12px]" />
            </button>
          </div>

          {/* Urgency badge */}
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/25 text-[11px] font-bold">
              <FaExclamationTriangle className="text-[10px]" />
              {notification.urgency_label}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Course */}
          <div className={`flex items-start gap-3 p-3 rounded-xl ${isDark ? "bg-gray-800/60" : "bg-gray-50"}`}>
            <FaLayerGroup className={`text-[15px] mt-0.5 flex-shrink-0 ${isDark ? "text-blue-400" : "text-blue-500"}`} />
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                Course
              </p>
              <p className={`text-sm font-medium mt-0.5 ${isDark ? "text-gray-200" : "text-slate-700"}`}>
                {notification.course_name}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`flex items-start gap-2.5 p-3 rounded-xl ${isDark ? "bg-gray-800/60" : "bg-gray-50"}`}>
              <FaCalendarAlt className={`text-[13px] mt-0.5 flex-shrink-0 ${isDark ? "text-green-400" : "text-green-500"}`} />
              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-wide ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  Start Date
                </p>
                <p className={`text-xs font-semibold mt-0.5 ${isDark ? "text-gray-200" : "text-slate-700"}`}>
                  {formatDate(notification.start_date)}
                </p>
              </div>
            </div>
            <div className={`flex items-start gap-2.5 p-3 rounded-xl ${isDark ? "bg-red-900/20" : "bg-red-50"}`}>
              <FaCalendarAlt className={`text-[13px] mt-0.5 flex-shrink-0 ${isDark ? "text-red-400" : "text-red-500"}`} />
              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-wide ${isDark ? "text-red-600" : "text-red-400"}`}>
                  Deadline
                </p>
                <p className={`text-xs font-bold mt-0.5 ${isDark ? "text-red-300" : "text-red-600"}`}>
                  {formatDate(notification.end_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Days remaining */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${
            notification.urgency_level === "high"
              ? isDark ? "bg-red-900/20 border-red-700/40" : "bg-red-50 border-red-200"
              : notification.urgency_level === "medium"
              ? isDark ? "bg-amber-900/20 border-amber-700/40" : "bg-amber-50 border-amber-200"
              : isDark ? "bg-blue-900/20 border-blue-700/40" : "bg-blue-50 border-blue-200"
          }`}>
            <FaClock className={`text-[15px] flex-shrink-0 ${
              notification.urgency_level === "high"
                ? "text-red-500"
                : notification.urgency_level === "medium"
                ? "text-amber-500"
                : "text-blue-500"
            }`} />
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                Time Remaining
              </p>
              <p className={`text-sm font-bold mt-0.5 ${
                notification.urgency_level === "high"
                  ? isDark ? "text-red-400" : "text-red-600"
                  : notification.urgency_level === "medium"
                  ? isDark ? "text-amber-400" : "text-amber-600"
                  : isDark ? "text-blue-400" : "text-blue-600"
              }`}>
                {notification.days_remaining} day{notification.days_remaining !== 1 ? "s" : ""} remaining
              </p>
            </div>
          </div>

          {/* Message */}
          <div className={`p-3 rounded-xl ${isDark ? "bg-gray-800/60" : "bg-gray-50"}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              Message
            </p>
            <p className={`text-xs leading-relaxed ${isDark ? "text-gray-300" : "text-slate-600"}`}>
              {stripHtml(notification.message)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex gap-3 px-5 pb-5`}>
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isDark
                ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Close
          </button>

          {(() => {
            let route = "";
            let btnLabel = "";
            switch (notification.type.toLowerCase()) {
              case "test":       route = "/tests";       btnLabel = "Go to Tests"; break;
              case "exam":       route = "/exams";       btnLabel = "Go to Exams"; break;
              case "assignment": route = "/assignments"; btnLabel = "Go to Assignments"; break;
              case "project":    route = "/projects";    btnLabel = "Go to Projects"; break;
              case "case_study": route = "/casestudy";   btnLabel = "Go to Case Studies"; break;
            }

            if (!route) return null;

            return (
              <button
                onClick={() => {
                  onClose();
                  navigate(route);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-colors text-white ${
                  notification.urgency_level === "high"
                    ? isDark ? "bg-red-600 hover:bg-red-500" : "bg-red-500 hover:bg-red-600"
                    : notification.urgency_level === "medium"
                    ? isDark ? "bg-amber-600 hover:bg-amber-500" : "bg-amber-500 hover:bg-amber-600"
                    : isDark ? "bg-blue-600 hover:bg-blue-500" : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {btnLabel} <FaArrowRight className="text-[11px]" />
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ─── Notification Card (shared, used in bell + full page) ─────────────────────

interface NotificationCardProps {
  notification: NotificationItem;
  isRead: boolean;
  isDark: boolean;
  onMarkRead: (id: number) => void;
  onViewDetail: (notification: NotificationItem) => void;
}

export function NotificationCard({
  notification, isRead, isDark, onMarkRead, onViewDetail,
}: NotificationCardProps) {
  const cfg = urgencyConfig[notification.urgency_level] ?? urgencyConfig.low;
  const cleanName = stripHtml(notification.item_name);

  const handleClick = () => {
    onMarkRead(notification.id);
    onViewDetail(notification);
  };

  return (
    <li
      onClick={handleClick}
      className={`relative flex gap-3 px-4 py-3 cursor-pointer border-l-[3px] transition-all duration-150 ${cfg.strip} ${
        isRead
          ? isDark
            ? "bg-transparent hover:bg-gray-800/50"
            : "bg-white hover:bg-gray-50"
          : isDark
          ? "bg-blue-900/10 hover:bg-blue-900/20"
          : "bg-blue-50/60 hover:bg-blue-50"
      }`}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
        <span className={isDark ? "text-gray-300" : "text-gray-600"}>
          {getTypeIcon(notification.type)}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-xs font-semibold leading-snug truncate ${isDark ? "text-gray-100" : "text-slate-800"}`} title={cleanName}>
            {cleanName || "Untitled"}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-0.5" />}
            <FaArrowRight className={`text-[9px] ${isDark ? "text-gray-600" : "text-gray-300"}`} />
          </div>
        </div>

        <p className={`text-[11px] mt-0.5 truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          {notification.course_name}
        </p>

        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          <span className={`inline-flex items-center gap-1 px-1.5 py-[2px] rounded-md text-[10px] font-semibold ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
            {getTypeIcon(notification.type)}
            {notification.type_label}
          </span>
          <span className={`inline-flex items-center gap-1 px-1.5 py-[2px] rounded-md text-[10px] font-semibold ${isDark ? cfg.badgeDark : cfg.badge}`}>
            {cfg.icon}
            {notification.urgency_label}
          </span>
        </div>

        <p className={`text-[10px] mt-1.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
          Deadline: {formatDate(notification.end_date)}
        </p>
      </div>
    </li>
  );
}

// ─── Main Bell Component ───────────────────────────────────────────────────────

const POPUP_LIMIT = 3;
const POLL_INTERVAL_MS = 60_000;

export default function NotificationBell() {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await studentAuthAPI.getNotifications();
      if (apiError || !data?.success) { setError(apiError || "Failed to load notifications"); return; }
      const items = data.data.notifications ?? [];
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.is_read && !readIds.has(n.id)).length);
    } catch {
      setError("Unexpected error. Please retry.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchNotifications]);

  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.is_read && !readIds.has(n.id)).length);
  }, [readIds, notifications]);

  // ── Outside click ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead    = (id: number) => setReadIds((prev) => new Set([...prev, id]));
  const markAllRead = () => setReadIds(new Set(notifications.map((n) => n.id)));
  const isRead      = (n: NotificationItem) => n.is_read || readIds.has(n.id);

  const handleViewAll = () => {
    setOpen(false);
    navigate("/notifications");
  };

  const visibleNotifs = notifications.slice(0, POPUP_LIMIT);
  const hasMore = notifications.length > POPUP_LIMIT;

  return (
    <>
      <div className="relative" ref={panelRef}>
        {/* ── Bell Button ── */}
        <button
          id="notification-bell-btn"
          onClick={() => setOpen((p) => !p)}
          className={`relative p-2 rounded-md transition-colors ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          {unreadCount > 0
            ? <FaBell className={`text-[18px] ${isDark ? "text-amber-400" : "text-amber-500"}`} />
            : <FaRegBell className={`text-[18px] ${isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-800"}`} />
          }

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-[3px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shadow-md animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* ── Popup Panel ── */}
        {open && (
          <div
            className={`absolute right-0 mt-2 w-[360px] sm:w-[400px] rounded-xl shadow-2xl border z-[999] flex flex-col overflow-hidden
              ${isDark ? "bg-[#192840] border-gray-700" : "bg-white border-gray-200"}`}
            style={{ maxHeight: "520px" }}
          >
            {/* Panel Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? "border-gray-700 bg-[#1a2f4a]" : "border-gray-100 bg-gray-50"}`}>
              <div className="flex items-center gap-2">
                <FaBell className={`text-[15px] ${isDark ? "text-amber-400" : "text-amber-500"}`} />
                <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}>Notifications</h3>
                {unreadCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">{unreadCount}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className={`text-[11px] font-semibold flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${isDark ? "text-blue-400 hover:bg-blue-900/30" : "text-blue-600 hover:bg-blue-50"}`}
                  >
                    <FaCheckCircle className="text-[10px]" /> Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className={`p-1 rounded-md transition-colors ${isDark ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-200"}`}
                  aria-label="Close"
                >
                  <FaTimes className="text-[13px]" />
                </button>
              </div>
            </div>

            {/* Panel Body */}
            <div className="overflow-y-auto custom-scrollbar flex-1">
              {loading && notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Fetching notifications…</p>
                </div>
              )}

              {!loading && error && (
                <div className="flex flex-col items-center justify-center py-10 gap-3 px-4">
                  <FaExclamationTriangle className="text-red-400 text-2xl" />
                  <p className={`text-xs text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>{error}</p>
                  <button onClick={fetchNotifications} className="text-xs font-semibold text-blue-500 hover:underline">Retry</button>
                </div>
              )}

              {!loading && !error && notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <FaRegBell className={`text-3xl ${isDark ? "text-gray-600" : "text-gray-300"}`} />
                  <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>You're all caught up! 🎉</p>
                  <p className={`text-xs ${isDark ? "text-gray-600" : "text-gray-400"}`}>No upcoming deadlines right now.</p>
                </div>
              )}

              {!error && notifications.length > 0 && (
                <ul className="divide-y divide-transparent">
                  {visibleNotifs.map((n) => (
                    <NotificationCard
                      key={n.id}
                      notification={n}
                      isRead={isRead(n)}
                      isDark={isDark}
                      onMarkRead={markRead}
                      onViewDetail={setSelectedNotif}
                    />
                  ))}
                </ul>
              )}
            </div>

            {/* Panel Footer */}
            {notifications.length > 0 && (
              <div className={`border-t ${isDark ? "border-gray-700 bg-[#1a2f4a]" : "border-gray-100 bg-gray-50"}`}>
                {hasMore ? (
                  <button
                    onClick={handleViewAll}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-colors ${
                      isDark ? "text-blue-400 hover:bg-blue-900/20" : "text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    View All {notifications.length} Notifications
                    <FaArrowRight className="text-[10px]" />
                  </button>
                ) : (
                  <p className={`text-center py-2.5 text-[10px] ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                    Showing all {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
                    {loading && <span className="ml-1 inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin align-middle" />}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Detail Modal (rendered at root level to avoid z-index clipping) ── */}
      {selectedNotif && (
        <NotificationDetailModal
          notification={selectedNotif}
          isDark={isDark}
          onClose={() => setSelectedNotif(null)}
        />
      )}
    </>
  );
}
