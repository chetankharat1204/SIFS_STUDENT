import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { studentAuthAPI } from "../../services/apiService";
import type { ZoomMeeting } from "../../services/apiService";
import { PlayCircle, Video, ChevronRight, X, Calendar } from "lucide-react";
import { format } from "date-fns";

export function CourseRecordings() {
  const { isDark } = useTheme();
  const [recordings, setRecordings] = useState<ZoomMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoModal, setVideoModal] = useState<{ isOpen: boolean; videoId: string | null }>({
    isOpen: false,
    videoId: null
  });

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const response = await studentAuthAPI.getZoomMeetings();
        if (response.data?.success) {
          // Filter for meetings that are ended (status ended) AND might have recording info
          // Note: In a real scenario, we'd filter for specifically provided recordings
          const allMeetings = response.data.data || [];
          const endedMeetings = allMeetings.filter(m => {
            const start = new Date(m.start_time).getTime();
            const end = start + (m.duration || 60) * 60 * 1000;
            return Date.now() > end;
          });
          setRecordings(endedMeetings);
        }
      } catch (err) {
        console.error("Failed to fetch recordings", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordings();
  }, []);


  if (loading) {
    return (
      <div className={`p-6 rounded-2xl ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} border shadow-sm animate-pulse`}>
        <div className="h-6 w-48 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700/50 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  if (recordings.length === 0) return null;

  return (
    <div className={`p-6 rounded-2xl border transition-all ${isDark ? "bg-gray-800 border-gray-700 font-mulish" : "bg-white border-gray-100 font-mulish"
      } shadow-sm`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
          <div className={`p-1.5 rounded-lg ${isDark ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600"}`}>
            <PlayCircle size={18} />
          </div>
          Course Recordings
        </h2>
        <Link to="/live-sessions" className={`text-xs font-bold hover:underline ${isDark ? "text-blue-400" : "text-blue-600"}`}>
          View All
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recordings.slice(0, 3).map((rec) => {
          const videoId = getYouTubeId(rec.recording_url || rec.joinUrl);
          return (
            <div
              key={rec.id}
              className={`group p-4 rounded-xl border transition-all cursor-pointer ${isDark
                  ? "bg-gray-900/40 border-gray-700 hover:border-red-500/30"
                  : "bg-red-50/30 border-red-100 hover:border-red-200"
                }`}
              onClick={() => {
                if (videoId) setVideoModal({ isOpen: true, videoId });
                else window.open(rec.recording_url || rec.joinUrl, "_blank");
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${isDark ? "bg-gray-800 text-red-400" : "bg-white text-red-600"} shadow-sm group-hover:bg-red-600 group-hover:text-white transition-colors`}>
                  <Video size={16} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isDark ? "bg-gray-800 text-gray-400" : "bg-white text-gray-500"}`}>
                  Recording
                </span>
              </div>

              <h3 className={`text-sm font-bold mb-3 line-clamp-2 min-h-[40px] ${isDark ? "text-white group-hover:text-red-400" : "text-gray-800 group-hover:text-red-700"}`}>
                {rec.topic}
              </h3>

              <div className="flex items-center justify-between mt-auto">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <Calendar size={10} className="text-gray-400" />
                    <span className="text-[10px] text-gray-400">{format(new Date(rec.start_time), "MMM d, yyyy")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-red-500 group-hover:translate-x-1 transition-transform">
                  Watch <ChevronRight size={14} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Video Modal */}
      {videoModal.isOpen && videoModal.videoId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setVideoModal({ isOpen: false, videoId: null });
              }}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
              <X size={24} />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${videoModal.videoId}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
}
