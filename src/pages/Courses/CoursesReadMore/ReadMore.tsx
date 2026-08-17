// ReadMore.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../../contexts/ThemeContext";
import { apiService } from "../../../services/apiService";
import { FaSpinner } from "react-icons/fa";

import CoursePage from "./CoursePage";
import CompleteCoursePage from "./CompleteCoursePage";
import InstructorsPage from "./InstructorsPage";
import BookmarksPage from "./BookmarksPage";
import NotesPage from "./NotesPage";

const TABS = [
  "Courses",
  "Complete Course",
  "Instructor",
  "Bookmark",
  "Notes",
];

type Course = {
  id: string; // The URL/Link ID (e.g. 5636)
  course_id: number; // The actual Course ID (e.g. 55)
  title: string;
};

export default function ReadMore() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  const tabParam = new URLSearchParams(location.search).get('tab');
  const activeIndex = tabParam ? Math.max(0, TABS.findIndex(t => t.toLowerCase() === tabParam.toLowerCase())) : 0;

  const [course, setCourse] = useState<Course | null>(null);
  const [hasOpenedCourseTab, setHasOpenedCourseTab] = useState(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.has('subject') || searchParams.has('los') || (activeIndex === 0 && tabParam === 'courses');
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch course details
  const fetchCourseDetails = async () => {
    if (!id) return;

    const runFallback = async () => {
      console.warn("Attempting fallback lookup...");
      try {
        const { data: allCoursesData } = await apiService.get<any>("/EducationAndInternship/Student/courses");

        if (allCoursesData?.success && allCoursesData.data) {
          const courseData = allCoursesData.data.studentCourses || allCoursesData.data.data || allCoursesData.data.courses || allCoursesData.data;
          const coursesList = Array.isArray(courseData) ? courseData : [];

          // Find the course where course_id matches the current ID or id matches current ID
          const foundCourse = coursesList.find((c: any) =>
            String(c.course_id) === String(id) || String(c.id) === String(id)
          );

          if (foundCourse) {
            // Case 1: ID mismatch (e.g. URL has generic ID, list has Enrollment ID) -> Redirect
            if (String(foundCourse.id) !== String(id)) {
              console.log(`Redirecting from course_id ${id} to enrollment_id ${foundCourse.id}`);
              const searchParams = new URLSearchParams(location.search);
              navigate(`/courses/${foundCourse.id}?${searchParams.toString()}`, {
                replace: true,
                state: location.state
              });
              return true; // Logically handled (redirecting)
            }

            // Case 2: ID match (URL is correct, but direct API failed) -> Set State manually
            const courseDetails: Course = {
              id: String(foundCourse.id),
              course_id: foundCourse.course_id || foundCourse.id,
              title: foundCourse.title || foundCourse.course_name || "Untitled Course",
            };
            setCourse(courseDetails);
            return true; // handled
          }
        }
      } catch (err) {
        console.error("Fallback lookup failed", err);
      }
      return false; // Not found in fallback
    };

    try {
      setLoading(true);
      setError(null);

      const { data, error: apiError } = await apiService.get<any>(
        `/EducationAndInternship/Student/courses/course/${id}`
      );

      // If API Error or explicit success: false, try fallback
      if (apiError || data?.success === false) {
        const handled = await runFallback();
        if (!handled) {
          navigate("/courses");
        }
        return;
      }

      if (data?.success && data.data) {
        const courseData = data.data.data || data.data.studentCourse || data.data.course || data.data;

        const courseDetails: Course = {
          id: id,
          // Try to find the real course ID in all common locations
          course_id: courseData.course_id || courseData.courseID || (courseData.course && (courseData.course.course_id || courseData.course.id)) || courseData.id,
          title: courseData.course_name || courseData.title || (courseData.course && (courseData.course.course_name || courseData.course.title)) || "Untitled Course",
        };
        setCourse(courseDetails);
      }
    } catch (err: any) {
      // Unexpected error, try fallback
      const handled = await runFallback();
      if (!handled) {
        navigate("/courses");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  // Set hasOpenedCourseTab when activeIndex becomes 0
  useEffect(() => {
    if (activeIndex === 0) {
      setHasOpenedCourseTab(true);
    }
  }, [activeIndex]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
          <span className="ml-3 text-lg">Loading...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
          {error}
          <button
            onClick={fetchCourseDetails}
            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      );
    }

    switch (activeIndex) {
      case 0:
        return hasOpenedCourseTab ? (
          <CoursePage courseId={id} />
        ) : (
          <div className="flex flex-col items-center justify-center py-10">
            <img
              src="/courses-links.jpg"
              alt="Course Intro"
              className="w-full max-w-4xl mb-6 rounded-lg shadow-lg"
            />
            <div className={`text-center p-6 rounded-lg max-w-2xl ${isDark ? "bg-gray-800" : "bg-gray-50"
              }`}>
              <h2 className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"
                }`}>
                {course?.title}
              </h2>
              <p className={`mb-6 ${isDark ? "text-gray-300" : "text-gray-600"
                }`}>
                Click on the "Courses" tab to start learning. You'll find all the modules,
                lessons, and learning objectives organized for you.
              </p>
              <button
                onClick={() => {
                  const newAppParams = new URLSearchParams(location.search);
                  newAppParams.set('tab', TABS[0].toLowerCase());
                  navigate(`?${newAppParams.toString()}`, { replace: true, state: location.state });
                  setHasOpenedCourseTab(true);
                }}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-200 ${isDark
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
              >
                Start Learning
              </button>
            </div>
          </div>
        );

      case 1:
        return <CompleteCoursePage courseId={course?.course_id?.toString() || id} />;
      case 2:
        return <InstructorsPage courseId={course?.course_id?.toString() || id} />;
      case 3:
        return <BookmarksPage />;
      case 4:
        return <NotesPage />;
      default:
        return null;
    }
  };

  if (!course && !loading) return null;

  return (
    <>
      {/* Header */}
      <div
        className={`flex flex-col md:flex-row justify-between gap-4 p-4 rounded-lg shadow mb-6
        ${isDark ? "bg-gray-800" : "bg-white"}`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/courses")}
            className={`px-3 py-2 rounded-lg transition-colors duration-200 ${isDark
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            ← Back
          </button>
          <h1 className={`font-semibold text-lg md:text-xl ${isDark ? "text-white" : "text-gray-900"}`}>
            {course?.title || "Loading..."}
          </h1>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {TABS.map((tab, i) => {
            const active = i === activeIndex;
            return (
              <button
                key={tab}
                onClick={() => {
                  const newSearchParams = new URLSearchParams(location.search);
                  newSearchParams.set('tab', TABS[i].toLowerCase());
                  navigate(`?${newSearchParams.toString()}`, { replace: true, state: location.state });
                  if (i === 0) {
                    setHasOpenedCourseTab(true);
                  }
                }}
                className={`px-4 py-1.5 rounded-full text-xs border whitespace-nowrap transition-colors duration-200
                  ${active
                    ? "bg-blue-100 text-blue-700 border-blue-300 font-semibold"
                    : isDark
                      ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }
                `}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div
        className={`rounded-lg shadow p-4 md:p-6
        ${isDark ? "bg-gray-800" : "bg-white"}`}
      >
        {renderContent()}
      </div>
    </>
  );
}