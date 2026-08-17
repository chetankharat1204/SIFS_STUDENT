import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { studentAuthAPI } from "../../services/apiService";
import type { ZoomMeeting } from "../../services/apiService";
import { Video, Calendar, Clock, Lock, ExternalLink, ChevronLeft } from "lucide-react";
import { format } from "date-fns";

export function ZoomMeetingsPage() {
  const { isDark } = useTheme();
  const [meetings, setMeetings] = useState<ZoomMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await studentAuthAPI.getZoomMeetings();
        if (response.data?.success) {
          const allMeetings = response.data.data || [];
          const currentMeetings = allMeetings.filter(m => getStatus(m.start_time, m.duration) !== "ended");
          setMeetings(currentMeetings);
        } else {
          setError(response.error || "Failed to fetch meetings");
        }
      } catch (err) {
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  const getStatus = (startTime: string, duration: number) => {
    const start = new Date(startTime.replace("Z", "")).getTime();
    const end = start + (duration || 60) * 60 * 1000;
    const now = Date.now();

    if (now >= start && now <= end) return "live";
    if (now < start) return "scheduled";
    return "ended";
  };

  const sortedMeetings = [...meetings].sort((a, b) => 
    new Date(a.start_time.replace("Z", "")).getTime() - new Date(b.start_time.replace("Z", "")).getTime()
  );

  if (loading) {
    return (
      <div className={`p-8 min-h-screen ${isDark ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-100"} rounded-xl animate-pulse`}>
        <div className="h-8 w-48 bg-gray-300 dark:bg-gray-700 rounded mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 sm:p-10 min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} rounded-xl`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <Link to="/" className={`flex items-center gap-2 text-sm mb-2 hover:underline ${isDark ? "text-blue-400" : "text-blue-600"}`}>
            <ChevronLeft size={16} />
            Back to Dashboard
          </Link>
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            My Live Sessions & Meetings
          </h1>
          <p className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Manage and join your upcoming and live classes
          </p>
        </div>
      </div>

      {error ? (
        <div className="p-10 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      ) : sortedMeetings.length === 0 ? (
        <div className={`p-20 text-center rounded-2xl border-2 border-dashed ${isDark ? "border-gray-800" : "border-gray-200"}`}>
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
            <Video size={40} className={isDark ? "text-gray-600" : "text-gray-400"} />
          </div>
          <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>No Meetings Found</h3>
          <p className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>You don't have any scheduled meetings at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMeetings.map((meeting) => {
            const status = getStatus(meeting.start_time, meeting.duration);
            return (
              <div 
                key={meeting.id}
                className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  isDark 
                    ? "bg-gray-800 border-gray-700 hover:border-blue-500/50" 
                    : "bg-white border-gray-100 hover:border-blue-200"
                }`}
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    status === "live" 
                      ? "bg-red-500 text-white animate-pulse" 
                      : status === "scheduled"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-500 text-white"
                  }`}>
                    {status}
                  </span>
                </div>

                <div className="p-6">
                  {/* Icon & Category */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-xl ${isDark ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                      <Video size={20} />
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                        {meeting.course_type}
                      </span>
                    </div>
                  </div>

                  {/* Topic */}
                  <h3 className={`text-lg font-bold mb-4 line-clamp-2 min-h-14 ${isDark ? "text-white group-hover:text-blue-400" : "text-gray-900 group-hover:text-blue-600"} transition-colors`}>
                    {meeting.topic}
                  </h3>

                  {/* Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar size={16} className={isDark ? "text-gray-500" : "text-gray-400"} />
                      <span className={isDark ? "text-gray-300" : "text-gray-600"}>
                        {format(new Date(meeting.start_time.replace("Z", "")), "PPP")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock size={16} className={isDark ? "text-gray-500" : "text-gray-400"} />
                      <span className={isDark ? "text-gray-300" : "text-gray-600"}>
                        {format(new Date(meeting.start_time.replace("Z", "")), "p")} ({meeting.duration} min)
                      </span>
                    </div>
                    {meeting.password && (
                      <div className="flex items-center gap-3 text-sm">
                        <Lock size={16} className={isDark ? "text-gray-500" : "text-gray-400"} />
                        <span className={isDark ? "text-gray-300" : "text-gray-600"}>
                          Passcode: <code className={`px-2 py-0.5 rounded ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>{meeting.password}</code>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <a
                    href={meeting.joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold transition-all ${
                      status === "live"
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                    }`}
                    onClick={(e) => status !== "live" && e.preventDefault()}
                  >
                    Join Now
                    <ExternalLink size={16} />
                  </a>
                  {status !== "live" && (
                    <p className="text-[10px] text-center mt-2 text-gray-500">
                      Joining will be enabled when session starts
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
