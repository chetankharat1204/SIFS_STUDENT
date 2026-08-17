import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { apiService } from "../../services/apiService";
import { formatDate } from "../../utils/dateUtils";

// --- Type Definitions ---
type QuizItem = {
  id: number;
  student_exam_id?: number;
  course_name: string;
  exam_name: string;
  start_date: string;
  end_date: string;
  quiz_status: string;
  status: "Complete" | "Pending" | "Not Attempted";
  is_expired?: boolean;
};

/* ---------------- HELPERS ---------------- */

const stripHtml = (html: string) => {
  if (!html) return "";
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

const formatDateRange = (start: string, end: string) => {
  const s = formatDate(start);
  const e = formatDate(end);
  if (s === "N/A" && e === "N/A") return "N/A";
  if (s !== "N/A" && e !== "N/A") return `${s} - ${e}`;
  return s !== "N/A" ? s : e;
};

/* ---------------- MAIN COMPONENT ---------------- */

export const TestsAndAnnouncements: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const getStatus = (item: any): QuizItem["status"] => {
      const quizStatus = item.quiz_status?.toLowerCase();
      if (quizStatus === "completed") return "Complete";
      if (quizStatus === "pending") return "Pending";
      if (quizStatus === "expired") return "Not Attempted";

      const itemStatus = item.status !== undefined && item.status !== null ? String(item.status).toLowerCase() : "";

      if (item.is_completed || itemStatus === "1" || itemStatus === "completed" || itemStatus === "complete") {
        return "Complete";
      }
      if (item.is_submitted || itemStatus === "2" || itemStatus === "submitted" || itemStatus === "pending") {
        return "Pending";
      }
      return "Pending";
    };

    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const response = await apiService.get<any>("/EducationAndInternship/Student/quizzes");
        if (response.data?.data?.data) {
          const testList = response.data.data.data;
          const transformed = testList.map((item: any) => ({
            id: item.exam_id || item.id,
            student_exam_id: item.student_exam_id || item.id,
            course_name: item.course_name || item.course || item.subject_name || "N/A",
            exam_name: stripHtml(item.exam_name || item.title || item.test_name || "N/A"),
            start_date: item.start_date || item.date || item.created_at,
            end_date: item.end_date || item.due_date,
            quiz_status: item.quiz_status,
            status: getStatus(item),
            is_expired: item.end_date ? new Date(item.end_date) < new Date() : false
          }));

          setQuizzes(transformed.slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to fetch quizzes", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  if (!loading && quizzes.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-10">
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
          Tests
        </h3>
        <Link
          to="/tests"
          className="text-sm font-bold text-[#3E80F9] underline hover:text-[#2a14b8] dark:text-[#93c5fd] dark:hover:text-[#bfdbfe]"
        >
          View All
        </Link>
      </div>

      <div className={`w-full overflow-x-auto rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} shadow-sm`}>
        <table className="w-full min-w-[800px] text-left border-collapse">
          <thead>
            <tr className={isDark ? "bg-gray-700/50" : "bg-[#F8FAFC]"}>
              <th className={`p-4 text-[13px] font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>#</th>
              <th className={`p-4 text-[13px] font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>Course name</th>
              <th className={`p-4 text-[13px] font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>Test name</th>
              <th className={`p-4 text-[13px] font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>Date</th>
              <th className={`p-4 text-[13px] font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>Status</th>
              <th className={`p-4 text-[13px] font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i} className={`border-t ${isDark ? "border-gray-700" : "border-gray-50"}`}>
                  <td colSpan={6} className="p-4">
                    <div className={`h-10 rounded-lg animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-100"}`}></div>
                  </td>
                </tr>
              ))
            ) : (
              quizzes.map((q, index) => (
                <tr
                  key={q.id}
                  className={`border-t transition-colors hover:bg-gray-50/50 ${isDark ? "border-gray-700 hover:bg-gray-700/30" : "border-gray-100"}`}
                >
                  <td className={`p-4 text-[13px] ${isDark ? "text-gray-300" : "text-gray-600"}`}>{index + 1}</td>
                  <td className={`p-4 text-[13px] font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}>{q.course_name}</td>
                  <td className={`p-4 text-[13px] font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}>{stripHtml(q.exam_name)}</td>
                  <td className={`p-4 text-[13px] font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                    {formatDateRange(q.start_date, q.end_date)}
                  </td>
                  <td className="p-4">
                    <span className={`px-4 py-1.5 text-[12px] font-bold rounded-full border inline-block min-w-[90px] text-center ${q.status === "Complete"
                      ? "bg-[#36CA0029] border-[#36CA00] text-[#248600]"
                      : q.status === "Pending"
                        ? "bg-[#E28F1D33] border-[#E28F1D] text-[#E28F1D]"
                        : "bg-gray-200 border-gray-300 text-gray-500"
                      }`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {q.status === "Complete" ? (
                      <button
                        onClick={() =>
                          navigate(`/tests/${q.student_exam_id || q.id}`, {
                            state: { course: q.course_name, testName: q.exam_name },
                          })
                        }
                        className="bg-[#008DD2] text-white text-[12px] font-bold py-2 px-6 rounded-full hover:bg-[#007bb8] transition-colors whitespace-nowrap cursor-pointer shadow-sm"
                      >
                        Show Result
                      </button>
                    ) : q.is_expired ? (
                      <button
                        disabled
                        className="border-[#7B7C7E] text-[#7B7C7E] text-[12px] font-bold py-2 px-6 rounded-full border bg-white whitespace-nowrap cursor-not-allowed"
                      >
                        Not Attempted
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/test-take/${q.student_exam_id || q.id}`)}
                        className="bg-green-600 text-white text-[12px] font-bold py-2 px-6 rounded-full hover:bg-green-700 transition-colors whitespace-nowrap cursor-pointer shadow-sm"
                      >
                        Start Test
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};