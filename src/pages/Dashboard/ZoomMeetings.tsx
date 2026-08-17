import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { studentAuthAPI } from "../../services/apiService";
import type { ZoomMeeting } from "../../services/apiService";
import { Video, Calendar, Clock, ExternalLink, ChevronRight } from "lucide-react";
import { format } from "date-fns";

type TabStatus = "live" | "scheduled" | "ended";

export function ZoomMeetings() {
  const { isDark } = useTheme();
  const [meetings, setMeetings] = useState<ZoomMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"live" | "scheduled">("live");

  const getStatus = (startTime: string, duration: number): TabStatus => {
    const start = new Date(startTime.replace("Z", "")).getTime();
    const end = start + (duration || 60) * 60 * 1000;
    const now = Date.now();

    if (now >= start && now <= end) return "live";
    if (now < start) return "scheduled";
    return "ended";
  };

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await studentAuthAPI.getZoomMeetings();
        if (response.data?.success) {
          const meetingsData = (response.data.data || []).filter(m => getStatus(m.start_time, m.duration) !== "ended");
          setMeetings(meetingsData);
          
          // Smart tab selection
          const hasLive = meetingsData.some(m => getStatus(m.start_time, m.duration) === "live");
          
          if (hasLive) {
            setActiveTab("live");
          } else if (meetingsData.length > 0) {
            setActiveTab("scheduled");
          }
        }
      } catch (err) {
        console.error("Failed to fetch meetings", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  const filteredMeetings = useMemo(() => {
    return meetings
      .filter(m => getStatus(m.start_time, m.duration) === activeTab)
      .sort((a, b) => new Date(a.start_time.replace("Z", "")).getTime() - new Date(b.start_time.replace("Z", "")).getTime());
  }, [meetings, activeTab]);

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} border shadow-sm animate-pulse`}>
        <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-40 bg-gray-200 dark:bg-gray-700/50 rounded-xl"></div>
      </div>
    );
  }

  const liveCount = meetings.filter(m => getStatus(m.start_time, m.duration) === "live").length;
  const scheduledCount = meetings.filter(m => getStatus(m.start_time, m.duration) === "scheduled").length;

  if (liveCount + scheduledCount === 0) return null;

  return (
    <div className={`p-6 rounded-2xl border transition-all ${
      isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
    } shadow-sm`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
            <div className={`p-1.5 rounded-lg ${isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
              <Video size={18} />
            </div>
            Live Sessions
          </h2>
        </div>

        <div className={`flex p-1 rounded-xl ${isDark ? "bg-gray-900" : "bg-gray-100"}`}>
          <button
            onClick={() => setActiveTab("live")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all relative ${
              activeTab === "live"
                ? "bg-blue-600 text-white shadow-md"
                : `${isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`
            }`}
          >
            Live Now
            {liveCount > 0 && (
              <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              activeTab === "scheduled"
                ? "bg-blue-600 text-white shadow-md"
                : `${isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`
            }`}
          >
            Upcoming ({scheduledCount})
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredMeetings.length === 0 ? (
          <div className={`py-12 text-center rounded-xl border-2 border-dashed ${isDark ? "border-gray-700 font-medium" : "border-gray-100 font-medium"}`}>
            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {activeTab === "live" 
                ? "No sessions are currently live." 
                : "No upcoming sessions found."}
            </p>
            {activeTab === "live" && scheduledCount > 0 && (
              <div className="mt-2 flex gap-3 justify-center">
                <button onClick={() => setActiveTab("scheduled")} className="text-xs text-blue-500 hover:underline font-bold">
                  View upcoming sessions
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMeetings.slice(0, 2).map((meeting) => {
                return (
                  <div 
                    key={meeting.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isDark 
                        ? "bg-gray-900/50 border-gray-700 hover:border-blue-500/30" 
                        : "bg-gray-50 border-gray-200 hover:border-blue-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700"
                      }`}>
                        {meeting.course_type}
                      </span>
                      {activeTab === "live" && (
                         <span className="flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      )}
                    </div>
                    
                    <h3 className={`text-sm font-bold mb-3 line-clamp-2 min-h-[40px] ${isDark ? "text-white" : "text-gray-900"}`}>
                      {meeting.topic}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className={isDark ? "text-gray-500" : "text-gray-400"} />
                        <span className={`text-[11px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          {format(new Date(meeting.start_time.replace("Z", "")), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className={isDark ? "text-gray-500" : "text-gray-400"} />
                        <span className={`text-[11px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          {format(new Date(meeting.start_time.replace("Z", "")), "p")}
                        </span>
                      </div>
                    </div>

                    <a
                      href={meeting.joinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === "live"
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-blue-50 text-blue-400 cursor-not-allowed dark:bg-blue-900/20 dark:text-blue-700"
                      }`}
                      onClick={(e) => activeTab !== "live" && e.preventDefault()}
                    >
                      {activeTab === "live" ? "Join Now" : "Upcoming"}
                      <ExternalLink size={14} />
                    </a>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-center">
              <Link
                to="/live-sessions"
                className={`flex items-center gap-1 text-[13px] font-bold transition-colors ${
                  isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"
                }`}
              >
                View All {meetings.length} Sessions
                <ChevronRight size={16} />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
