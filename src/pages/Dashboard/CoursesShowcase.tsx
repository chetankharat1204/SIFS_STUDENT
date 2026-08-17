import React, { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { apiService } from "../../services/apiService";
import { formatDate } from "../../utils/dateUtils";

/* ---------------- TYPES ---------------- */

type Course = {
  id: number;
  title: string;
  image_url?: string;
  duration: string;
  course_code: string;
  image?: string;
  thumbnail_url?: string;
};

type Announcement = {
  id: number;
  announcement: string;
  instructor_name: string;
  created_at: string;
};

/* ---------------- COMPONENTS ---------------- */

const stripHtml = (html: string) => {
  if (!html) return "";
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

const ReadMoreText = ({ text, isDark }: { text: string, isDark: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const cleanText = stripHtml(text);
  const shouldTruncate = cleanText.length > 100; // tuned for sidebar width

  return (
    <div className="flex flex-col items-start w-full text-left">
      <div className={`text-sm font-semibold leading-snug w-full ${isDark ? "text-white" : "text-gray-900"} ${!expanded && shouldTruncate ? "line-clamp-2" : ""}`}>
        {cleanText}
      </div>
      {shouldTruncate && (
        <button
          onClick={() => setExpanded(!expanded)}
          className={`text-[10px] mt-0.5 font-bold cursor-pointer focus:outline-none self-end ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"}`}
        >
          {expanded ? "Read Less" : "Read More"}
        </button>
      )}
    </div>
  );
};

const CourseCard: React.FC<{ course: Course }> = React.memo(({ course }) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  let rawUrl = course.image_url || course.image || course.thumbnail_url || "";
  
  if (rawUrl && !rawUrl.startsWith('http')) {
    if (rawUrl.includes("Education-And-Internship-Admin-Course-Image")) {
      rawUrl = `${import.meta.env.VITE_IMAGE_BASE_URL || ""}/uploads/${rawUrl}`;
    } else {
      rawUrl = `${import.meta.env.VITE_IMAGE_BASE_URL || ""}/uploads/Education-And-Internship-Admin-Course-Image/${rawUrl}`;
    }
  } else if (rawUrl && rawUrl.startsWith('http')) {
    if (rawUrl.includes('/uploads/') && !rawUrl.includes('Education-And-Internship-Admin-Course-Image')) {
      rawUrl = rawUrl.replace('/uploads/', '/uploads/Education-And-Internship-Admin-Course-Image/');
    }
  }

  const imageUrl = rawUrl
    ? (rawUrl.startsWith("http:") ? rawUrl.replace("http:", "https:") : rawUrl)
    : "";

  return (
    <article className={`rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col group ${isDark
      ? "bg-gray-800 border-gray-700"
      : "bg-white border-gray-100"
      }`}>
      <div className="p-4 flex flex-col h-full">
        {/* 🔹 Course Image */}
        <div className={`aspect-[16/10] flex items-center justify-center rounded-lg overflow-hidden relative ${isDark ? "bg-gray-700/50" : "bg-[#F8FAFC]"
          }`}>
          <img
            src={imageUrl}
            alt={course.title}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        {/* 🔹 Course Title */}
        <h3 className={`mt-4 text-[15px] font-semibold line-clamp-2 leading-snug h-10 ${isDark ? "text-white" : "text-gray-800"
          }`}>
          {course.title}
        </h3>

        {/* 🔹 Duration & Action */}
        <div className={`mt-4 pt-4 border-t ${isDark ? "border-gray-700" : "border-gray-50"}`}>
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Duration:
            </span>
            <span className={`text-xs font-bold ${isDark ? "text-blue-400" : "text-[#075385]"}`}>
              {course.duration} Hours
            </span>
          </div>

          <button
            onClick={() => navigate(`/courses/${course.id}`)}
            className="w-full bg-[#075385] text-white text-[13px] font-bold py-2.5 rounded hover:bg-[#06426a] transition-colors shadow-sm cursor-pointer"
            aria-label={`Read more about ${course.title}`}
          >
            Read more
          </button>
        </div>
      </div>
    </article>
  );
});

/* ---------------- MAIN COMPONENT ---------------- */

export default function CoursesShowcase() {
  const { isDark } = useTheme();
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState<boolean>(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await apiService.get<{ data: { studentCourses: Course[] } }>("/EducationAndInternship/Student/courses");
        if (response.data?.data?.studentCourses) {
          setCourses(response.data.data.studentCourses.slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to fetch courses", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchAnnouncements = async () => {
      try {
        setLoadingAnnouncements(true);
        const response = await apiService.get<{ data: { data: Announcement[] } }>("/EducationAndInternship/Student/announcements");
        if (response.data?.data?.data) {
          setAnnouncements(response.data.data.data.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to fetch announcements", err);
      } finally {
        setLoadingAnnouncements(false);
      }
    };

    fetchCourses();
    fetchAnnouncements();
  }, []);


  if (!loading && !loadingAnnouncements && courses.length === 0 && announcements.length === 0) {
    return null;
  }

  const showCourses = courses.length > 0 || loading;
  const showAnnouncements = announcements.length > 0 || loadingAnnouncements;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Course Cards */}
        {showCourses && (
          <div className={showAnnouncements ? "lg:col-span-9" : "lg:col-span-12"}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg sm:text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>
                All Courses
              </h2>
              <Link
                to="/courses"
                className="text-[#381BDE] text-sm font-bold underline hover:text-[#2a14b8] dark:text-[#93c5fd] dark:hover:text-[#bfdbfe]"
                aria-label="View all courses"
              >
                View All
              </Link>
            </div>

            {loading ? (
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${showAnnouncements ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-6`}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`h-64 rounded-xl animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-100"}`}></div>
                ))}
              </div>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${showAnnouncements ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-6`}>
                {courses.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Right: Announcements */}
        {showAnnouncements && (
          <aside className={showCourses ? "lg:col-span-3" : "lg:col-span-12"}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                Announcement List
              </h3>
              <Link
                to="/announcements"
                className="text-sm font-bold underline hover:text-[#2a14b8] dark:text-[#93c5fd] dark:hover:text-[#bfdbfe]"
              >
                View All
              </Link>
            </div>

            {loadingAnnouncements ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`h-16 rounded-xl animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-100"}`}></div>
                ))}
              </div>
            ) : (
              <div className={`border rounded-xl overflow-hidden shadow-sm ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                {announcements.map((a, idx) => (
                  <div
                    key={a.id}
                    className={`flex flex-col items-start gap-1 p-4 ${idx !== announcements.length - 1 ? (isDark ? "border-b border-gray-700" : "border-b border-gray-50") : ""}`}
                  >
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-start justify-between w-full">
                        <div className={`text-[16px] font-bold flex-shrink-0 ${isDark ? "text-[#93c5fd]" : "text-[#381BDE]"}`}>
                          #{idx + 1}
                        </div>
                        <div className="flex flex-col items-end justify-start gap-1">
                          <div className={`text-[10px] whitespace-nowrap pt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            {formatDate(a.created_at)}
                          </div>
                          {a.instructor_name && (
                            <div className={`text-[10px] whitespace-nowrap ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                              By: {a.instructor_name}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="w-full">
                        <ReadMoreText text={a.announcement} isDark={isDark} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}