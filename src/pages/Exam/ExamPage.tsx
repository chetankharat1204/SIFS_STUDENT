import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PageShell from "../../components/PageShell";
import { useTheme } from "../../contexts/ThemeContext";
import { apiService } from "../../services/apiService";
import { formatDate as formatDateUtil } from "../../utils/dateUtils";

type Exam = {
  id: string | number;
  student_exam_id?: number;
  course: string;
  examname: string;
  date: string;
  status: "Complete" | "Pending" | "Not Attempted" | "Active";
  duration?: number;
  total_questions?: number;
  isUpcoming?: boolean;
  isExpired?: boolean;
};

const ITEMS_PER_PAGE = 8;

/* Status Badge */
function StatusBadge({ status }: { status: Exam["status"] }) {
  const base = "inline-flex items-center text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1 rounded-full border whitespace-nowrap";

  if (status === "Complete")
    return (
      <span className={`${base} bg-[#36CA0029] text-[#248600] border-[#36CA00]`}>
        Complete
      </span>
    );

  if (status === "Pending" || status === "Active")
    return (
      <span className={`${base} bg-[#E28F1D33] text-[#E28F1D] border-[#E28F1D]`}>
        Pending
      </span>
    );

  return (
    <span className={`${base} bg-gray-200 text-gray-500 border-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600`}>
      Not Attempted
    </span>
  );
}

/* Pagination Helper */
function getPageList(current: number, total: number, maxButtons = 7) {
  if (total <= maxButtons) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  pages.add(current);
  for (let i = 1; i <= 2; i++) {
    if (current - i > 1) pages.add(current - i);
    if (current + i < total) pages.add(current + i);
  }
  const arr = Array.from(pages).sort((a, b) => a - b);
  const output: (number | "...")[] = [];
  for (let i = 0; i < arr.length; i++) {
    output.push(arr[i]);
    if (i + 1 < arr.length && arr[i + 1] - arr[i] > 1) output.push("...");
  }
  return output;
}

export const ExamPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  const isCompletedRoute = location.pathname === "/completedexams";

  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [exams, setExams] = useState<Exam[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Helper to strip HTML tags
  const stripHtml = (html: string) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  // Helper function to determine status if not provided directly
  const getStatus = (status: any, isCompleted: boolean, isActive: boolean): Exam["status"] => {
    const statusStr = status !== undefined && status !== null ? String(status).toLowerCase() : "";
    if (isCompleted || statusStr === "completed" || statusStr === "complete") {
      return "Complete";
    }
    if (isActive || statusStr === "active") {
      return "Active";
    }
    if (statusStr === "pending" || statusStr === "upcoming") {
      return "Pending";
    }
    return "Not Attempted";
  };


  // Fetch exams based on active tab
  const fetchExams = async () => {
    try {
      setIsLoading(true);
      setError("");

      let url = isCompletedRoute
        ? `/EducationAndInternship/Student/exams/1?page=${page}&limit=${ITEMS_PER_PAGE}`
        : `/EducationAndInternship/Student/exams?page=${page}&limit=${ITEMS_PER_PAGE}`;

      const { data, error } = await apiService.get<any>(url);

      if (error) {
        setError(error);
        return;
      }

      if (data?.success && data.data) {
        // Handle different response structures
        const examList = Array.isArray(data.data) ? data.data : (data.data.data || data.data.exams || []);

        const transformed = examList.map((item: any) => {
          const status = getStatus(
            item.exam_status || item.status,
            item.is_completed || item.is_submitted === 1,
            item.is_active || item.is_ongoing === 1
          );

          return {
            id: item.id?.toString() || item.exam_id?.toString(),
            student_exam_id: item.student_exam_id || item.id, // Sometimes id IS the student_exam_id
            course: stripHtml(item.course_name || item.course || item.subject_name || item.course_title || "N/A"),
            examname: stripHtml(item.exam_name || item.title || item.exam_title || item.name || "N/A"),
            date: item.start_date && item.end_date
              ? `${formatDateUtil(item.start_date)} - ${formatDateUtil(item.end_date)}`
              : formatDateUtil(item.exam_date) || formatDateUtil(item.created_at) || "N/A",
            status: status,
            duration: item.duration || item.time_limit,
            total_questions: item.total_questions,
            isUpcoming: (item.start_date || item.exam_date) ? new Date(item.start_date || item.exam_date) > new Date() : false,
            isExpired: (item.end_date || item.exam_date) ? new Date(item.end_date || item.exam_date) < new Date() : false
          };
        });

        // Sort exams: Active/Pending first, then Complete, then Not Attempted
        transformed.sort((a: any, b: any) => {
          const statusPriority: Record<string, number> = {
            "Active": 1,
            "Pending": 2,
            "Complete": 3,
            "Not Attempted": 4
          };

          const priorityA = statusPriority[a.status] || 5;
          const priorityB = statusPriority[b.status] || 5;

          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }

          // Fallback to sorting by date descending if status is the same
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        setExams(transformed);

        if (data.data.pagination) {
          setTotalPages(data.data.pagination.total_pages);
          setTotalItems(data.data.pagination.total_items);
        } else if (data.data.total_pages) {
          setTotalPages(data.data.total_pages);
          setTotalItems(data.data.total_items || 0);
        } else {
          // If no pagination info, assume single page
          setTotalPages(1);
          setTotalItems(transformed.length);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load exams");
    } finally {
      setIsLoading(false);
    }
  };

  // API 3: Start an exam
  const handleStartExam = async (examId: string | number) => {
    try {
      setIsLoading(true);

      const { data, error } = await apiService.get<any>(
        `/EducationAndInternship/Student/exams/start/${examId}`
      );

      if (error) {
        setError(error);
        setIsLoading(false);
        return;
      }

      if (data?.success) {
        // The start API might return session data, but for now we just navigate to attempt page
        // If the ID passed was the exam ID, the start API typically initializes/resumes 
        // and might return a student_exam_id. 

        // From user prompt: "3) get start an exam .../start/95349". 
        // Note: The URL ID 95349 usually refers to student_exam_id if it's "Start".

        // If we are in the list, 'examId' coming from the table might be the Exam Definition ID or Student Exam Entry ID.
        // We'll trust the ID from the list.
        navigate(`/exams/attempt/${examId}`);
      } else {
        setError("Failed to start exam session");
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to start exam");
      setIsLoading(false);
    }
  };

  const handleViewResult = (examId: string | number, examName: string) => {
    navigate(`/exams/${encodeURIComponent(examName)}/result/${examId}`);
  };



  useEffect(() => {
    fetchExams();
  }, [page]);



  return (
    <div className="w-full px-2 sm:px-4 md:px-0">
      <div className={`rounded-2xl p-4 sm:p-6 card ${isDark ? "bg-gray-800" : "bg-white"
        }`} style={{ boxShadow: "0px 0px 24px 0px #00000014" }}>
        <div className="flex flex-col sm:flex-row justify-between mb-4 sm:mb-5 items-start sm:items-center gap-2">
          <PageShell
            title={isCompletedRoute ? "Completed Exams" : "Exams"}
            breadcrumb={["Home", isCompletedRoute ? "Completed Exams" : "All Exams"]}
          />
          <button
            onClick={() => navigate("/exam/guideline")}
            className={`rounded-full font-bold px-6 py-2 text-xs sm:text-sm md:text-[12px] transition-all ${isDark
              ? "bg-[#2e415f] text-[#93c5fd] hover:bg-[#334155]"
              : "bg-[#ECF2FE] text-[#3E80F9]"
              }`}>
            Guideline
          </button>
        </div>

        {/* Tabs - Removed as per user request */}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        {/* Responsive Table */}
        {!isLoading && !error && (
          <>
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full table-auto hidden sm:table">
                <thead>
                  <tr className={`text-left text-sm md:text-base font-semibold ${isDark ? "bg-gray-700" : "bg-[#F8F8F8]"
                    }`}>
                    <th className={`py-3 px-4 rounded-tl-lg ${isDark ? "text-gray-300" : "text-gray-900"
                      }`}>
                      #
                    </th>
                    <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"
                      }`}>
                      Course name
                    </th>
                    <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"
                      }`}>
                      Exam name
                    </th>
                    <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"
                      }`}>
                      Date
                    </th>
                    <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"
                      }`}>
                      Status
                    </th>
                    <th className={`py-3 px-4 rounded-tr-lg ${isDark ? "text-gray-300" : "text-gray-900"
                      }`}>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {exams.map((exam, index) => (
                    <tr key={exam.id} className={`border-b last:border-b hover:bg-gray-50 ${isDark
                      ? "border-gray-700 hover:bg-gray-800"
                      : "border-[#D9D9D9] hover:bg-gray-50"
                      }`}>
                      <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                        }`}>
                        {(page - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>
                      <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                        }`}>
                        {exam.course}
                      </td>
                      <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                        }`}>
                        {exam.examname}
                      </td>
                      <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                        }`}>
                        {exam.date}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={exam.status} />
                      </td>
                      <td className="py-4 px-4">
                        {exam.status === "Complete" ? (
                          <button
                            onClick={() => handleViewResult(exam.student_exam_id || exam.id, exam.examname)}
                            className="px-3 py-1 text-sm bg-[#008DD2] text-white border border-[#008DD2] rounded-full hover:bg-white hover:text-[#008DD2] dark:hover:bg-gray-800 dark:hover:text-[#008DD2] transition-all"
                          >
                            Show Result
                          </button>
                        ) : exam.isUpcoming ? (
                          <button
                            disabled
                            className="px-3 py-1 text-sm bg-yellow-500 text-white border border-yellow-500 rounded-full cursor-not-allowed font-semibold opacity-80"
                          >
                            Coming Soon
                          </button>
                        ) : exam.isExpired ? (
                          <button
                            disabled
                            className="px-3 py-1 text-sm bg-gray-400 text-white border border-gray-400 rounded-full cursor-not-allowed font-semibold"
                          >
                            Not Attempted
                          </button>
                        ) : exam.status === "Pending" || exam.status === "Active" ? (
                          <button
                            onClick={() => handleStartExam(exam.student_exam_id || exam.id)}
                            disabled={isLoading}
                            className="px-3 py-1 text-sm bg-green-600 text-white border border-green-600 rounded-full hover:bg-white hover:text-green-600 dark:hover:bg-gray-800 dark:hover:text-green-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Start Exam
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-1 text-sm bg-gray-400 text-white border border-gray-400 rounded-full cursor-not-allowed font-semibold"
                          >
                            Not Attempted
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {exams.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className={`py-8 text-center ${isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                      >
                        No exams found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* MOBILE CARD LIST */}
              <div className="sm:hidden space-y-4">
                {exams.map((exam, index) => (
                  <div
                    key={exam.id}
                    className={`border rounded-xl p-4 shadow-sm card ${isDark ? "border-gray-700" : "border-gray-200"
                      }`}
                  >
                    <div className={`mb-2 text-sm font-bold ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      #{(page - 1) * ITEMS_PER_PAGE + index + 1}
                    </div>
                    <div className="flex flex-col gap-2 text-sm">
                      <p className={isDark ? "text-gray-300" : "text-gray-900"}>
                        <span className="font-semibold">Course:</span> {exam.course}
                      </p>
                      <p className={isDark ? "text-gray-300" : "text-gray-900"}>
                        <span className="font-semibold">Exam:</span> {exam.examname}
                      </p>
                      <p className={isDark ? "text-gray-300" : "text-gray-900"}>
                        <span className="font-semibold">Date:</span> {exam.date}
                      </p>

                      <div>
                        <StatusBadge status={exam.status} />
                      </div>

                      <div className="pt-2">
                        {exam.status === "Complete" ? (
                          <button
                            onClick={() => handleViewResult(exam.student_exam_id || exam.id, exam.examname)}
                            className="px-4 py-2 text-sm bg-[#008DD2] text-white border border-[#008DD2] rounded-full w-full hover:bg-white hover:text-[#008DD2] dark:hover:bg-gray-800 dark:hover:text-[#008DD2] transition-all"
                          >
                            Show Result
                          </button>
                        ) : exam.isUpcoming ? (
                          <button
                            disabled
                            className="px-4 py-2 text-sm bg-yellow-500 text-white border border-yellow-500 rounded-full w-full cursor-not-allowed font-semibold opacity-80"
                          >
                            Coming Soon
                          </button>
                        ) : exam.isExpired ? (
                          <button
                            disabled
                            className="px-4 py-2 text-sm bg-gray-400 text-white border border-gray-400 rounded-full w-full cursor-not-allowed font-semibold"
                          >
                            Not Attempted
                          </button>
                        ) : exam.status === "Pending" || exam.status === "Active" ? (
                          <button
                            onClick={() => handleStartExam(exam.student_exam_id || exam.id)}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm bg-green-600 text-white border border-green-600 rounded-full w-full hover:bg-white hover:text-green-600 dark:hover:bg-gray-800 dark:hover:text-green-600 transition-all font-semibold disabled:opacity-50"
                          >
                            Start Exam
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-4 py-2 text-sm bg-gray-400 text-white border border-gray-400 rounded-full w-full cursor-not-allowed font-semibold"
                          >
                            Not Attempted
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Showing {exams.length} of {totalItems} exams
              </div>
              <div className="flex items-center space-x-2">
                {/* Previous button */}
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={`px-3 py-1 text-sm rounded-md border ${page === 1
                    ? isDark
                      ? "text-gray-600 border-gray-700 cursor-not-allowed"
                      : "text-gray-400 border-gray-300 cursor-not-allowed"
                    : isDark
                      ? "text-gray-300 border-gray-600 hover:bg-gray-700"
                      : "text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  disabled={page === 1}
                >
                  Prev
                </button>

                {getPageList(page, totalPages, 7).map((p, idx) =>
                  p === "..." ? (
                    <span
                      key={`dot-${idx}`}
                      className={`px-3 py-1 ${isDark ? "text-gray-500" : "text-gray-400"
                        }`}
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`px-3 py-1 rounded-md text-sm border font-semibold ${p === page
                        ? isDark
                          ? "bg-gray-700 text-white border-gray-600"
                          : "bg-white text-[#00467A] border-[#00467A]"
                        : isDark
                          ? "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                          : "bg-white text-[#B1B1B1] border-[#EBEBEB] hover:bg-gray-50"
                        }`}
                    >
                      {p}
                    </button>
                  )
                )}

                {/* Next button */}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={`px-3 py-1 text-sm rounded-md border ${page === totalPages
                    ? isDark
                      ? "text-gray-600 border-gray-700 cursor-not-allowed"
                      : "text-gray-400 border-gray-300 cursor-not-allowed"
                    : isDark
                      ? "text-gray-300 border-gray-600 hover:bg-gray-700"
                      : "text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};