import { useState, useEffect } from "react";
import { ClockIcon, X } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { apiService } from "../../services/apiService";


interface Announcement {
  id: string | number;
  title: string;
  excerpt: string;
  date: string;
  created_at?: string;
  published_at?: string;
  announcement_date?: string;
  content?: string;
  description?: string;
  instructor_name?: string;
}

type ViewAnnouncementModalProps = {
  announcement: Announcement | null;
  onClose: () => void;
};

const ViewAnnouncementModal = ({ announcement, onClose }: ViewAnnouncementModalProps) => {
  const { isDark } = useTheme();

  useEffect(() => {
    if (announcement) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [announcement]);

  if (!announcement) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: "#0202028a" }}
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div
          className={`rounded-xl shadow-2xl w-full max-w-lg relative ${isDark ? "bg-gray-800" : "bg-white"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
            <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
              Announcement
            </h3>
            <button
              onClick={onClose}
              className={`rounded-full w-7 h-7 flex items-center justify-center transition-colors ${isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>

          <div className={`px-6 pt-3 flex items-center justify-between gap-1.5 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            <div className="flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5" />
              <span>{announcement.date}</span>
            </div>
            {announcement.instructor_name && (
              <span>By: {announcement.instructor_name}</span>
            )}
          </div>

          <div className={`px-6 py-4 text-sm leading-relaxed max-h-[60vh] overflow-y-auto whitespace-pre-wrap custom-scrollbar ${isDark ? "text-gray-200" : "text-gray-700"
            }`}>
            {announcement.title !== announcement.excerpt && (
              <div className={`text-base font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                {announcement.title}
              </div>
            )}
            {announcement.excerpt || announcement.content || announcement.title}
          </div>

          <div className={`px-6 py-4 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
            <button
              onClick={onClose}
              className="w-full py-2 rounded-lg font-semibold text-white transition-colors"
              style={{ background: "linear-gradient(to right, #008DD2, #00467A)" }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const Announcements = () => {
  const { isDark } = useTheme();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [viewAnnouncement, setViewAnnouncement] = useState<Announcement | null>(null);

  const stripHtml = (html: string) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hourNum = date.getHours();
    const hours = hourNum.toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes} ${hourNum >= 12 ? 'PM' : 'AM'}`;
  };

  const transformAnnouncementData = (apiData: any): Announcement => {
    const apiTitle = stripHtml(
      apiData.title ||
      apiData.name ||
      apiData.announcement_title ||
      apiData.subject ||
      ""
    );

    const content = stripHtml(
      apiData.content ||
      apiData.announcement_content ||
      apiData.announcement ||
      apiData.description ||
      apiData.excerpt ||
      "No description available"
    );

    const dateField = apiData.date ||
      apiData.created_at ||
      apiData.published_at ||
      apiData.announcement_date ||
      apiData.updated_at;

    return {
      id: apiData.id || apiData.announcement_id || Math.random().toString(),
      title: apiTitle || content,
      excerpt: content,
      date: formatDateTime(dateField),
      created_at: apiData.created_at,
      published_at: apiData.published_at,
      announcement_date: apiData.announcement_date,
      content: apiData.content,
      description: apiData.description,
      instructor_name: apiData.instructor_name || apiData.author,
    };
  };

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      setError("");

      const { data, error: apiError } = await apiService.get<any>(
        "/EducationAndInternship/Student/announcements"
      );

      if (apiError) {
        setError(apiError);
        setAnnouncements([]);
        return;
      }

      if (data?.success) {
        let announcementsList: any[] = [];

        if (Array.isArray(data.data)) {
          announcementsList = data.data;
        } else if (data.data?.data && Array.isArray(data.data.data)) {
          announcementsList = data.data.data;
        } else if (data.data?.announcements && Array.isArray(data.data.announcements)) {
          announcementsList = data.data.announcements;
        } else if (Array.isArray(data.announcements)) {
          announcementsList = data.announcements;
        } else if (typeof data.data === 'object' && data.data !== null) {
          announcementsList = [data.data];
        }

        const transformed = announcementsList.map(transformAnnouncementData);
        setAnnouncements(transformed);
      } else {
        setError(data?.message || "Failed to fetch announcements");
        setAnnouncements([]);
      }
    } catch (err: any) {
      console.error("Announcements fetch error:", err);
      setError(err.message || "An unexpected error occurred");
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleRetry = () => {
    fetchAnnouncements();
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen max-w-full p-4 sm:p-6 lg:p-8 ${isDark ? "bg-gray-900" : "bg-gray-50"
        }`}>
        <div className="mb-6">
          <h1 className={`text-xl md:text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"
            }`}>
            Announcements
          </h1>
          <div className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"
            }`}>
            Home &gt; All announcements
          </div>
        </div>
        <hr className={`mb-6 ${isDark ? "border-gray-700" : "border-gray-200"}`} />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className={`min-h-screen max-w-full p-4 sm:p-6 lg:p-8 ${isDark ? "bg-gray-900" : "bg-gray-50"
        }`}>
        <div className="mb-6">
          <h1 className={`text-xl md:text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"
            }`}>
            Announcements
          </h1>
          <div className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"
            }`}>
            Home &gt; All announcements
          </div>
        </div>
        <hr className={`mb-6 ${isDark ? "border-gray-700" : "border-gray-200"}`} />
        <div className="flex flex-col justify-center items-center py-20">
          <p className={`text-lg mb-4 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            {error}
          </p>
          <button
            onClick={handleRetry}
            className={`px-6 py-2 rounded-lg font-semibold ${isDark
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen max-w-full p-4 sm:p-6 lg:p-8 ${isDark ? "bg-gray-900" : "bg-gray-50"
      }`}>

      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div>
          <h1 className={`text-xl md:text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"
            }`}>
            Announcements
          </h1>

          <div className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"
            }`}>
            Home &gt; All announcements
          </div>
        </div>
      </div>

      <hr className={`mb-6 ${isDark ? "border-gray-700" : "border-gray-200"}`} />

      <div className="mb-4 flex justify-end">
        <button
          onClick={handleRetry}
          className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark
            ? "bg-gray-700 hover:bg-gray-600 text-white"
            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
        >
          Refresh
        </button>
      </div>

      <div className={`rounded-2xl overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"
        }`} style={{ boxShadow: "0px 0px 24px 0px #00000014" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${isDark ? "bg-gray-700" : "bg-[#F8F8F8]"} text-left`}>
                <th className={`py-3 px-4 font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                  } rounded-tl-lg`}>
                  #
                </th>
                <th className={`py-3 px-4 font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                  }`}>
                  Announcement
                </th>
                <th className={`py-3 px-4 font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                  }`}>
                  Date
                </th>
                <th className={`py-3 px-4 font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                  } rounded-tr-lg`}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {announcements.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className={`text-center py-12 ${isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                  >
                    No announcements found.
                  </td>
                </tr>
              ) : (
                announcements.map((announcement, index) => (
                  <tr
                    key={announcement.id}
                    className={`border-b last:border-b-0 hover:bg-gray-50 ${isDark ? "border-gray-700 hover:bg-gray-700" : "border-[#D9D9D9]"
                      }`}
                  >
                    <td className={`py-4 px-4 font-medium ${isDark ? "text-gray-300" : "text-gray-900"
                      }`}>
                      {index + 1}
                    </td>
                    <td className={`py-4 px-4 max-w-xs ${isDark ? "text-gray-300" : "text-gray-800"}`}>
                      <div className="text-sm font-medium">
                        {(() => {
                          const fullText = announcement.title !== announcement.excerpt
                            ? `${announcement.title} ${announcement.excerpt}`
                            : announcement.title;
                          return fullText.length > 120 ? fullText.substring(0, 120) + "..." : fullText;
                        })()}
                      </div>
                    </td>
                    <td className={`py-4 px-4 ${isDark ? "text-gray-400" : "text-gray-600"
                      }`}>
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          <span>{announcement.date}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewAnnouncement(announcement)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${isDark
                            ? "border-blue-600 text-blue-400 hover:bg-blue-900/30"
                            : "border-[#008DD2] text-[#008DD2] hover:bg-blue-50"
                            }`}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ViewAnnouncementModal
        announcement={viewAnnouncement}
        onClose={() => setViewAnnouncement(null)}
      />
    </div>
  );
};

export default Announcements;