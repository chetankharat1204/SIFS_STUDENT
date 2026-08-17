import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PageShell from "../../components/PageShell";
import { useTheme } from "../../contexts/ThemeContext";
import { apiService } from "../../services/apiService"; // Adjust path as needed
import { formatDate as formatDateUtil } from "../../utils/dateUtils";

type Test = {
  id: string;
  student_exam_id?: number;
  course: string;
  course_name?: string;
  testName: string;
  exam_name?: string;
  date: string;
  start_date?: string;
  end_date?: string;
  comment?: string;
  status: "Complete" | "Pending" | "Not Attempted";
  is_completed?: boolean;
  is_submitted?: boolean;
  is_checked?: boolean;
  is_expired?: boolean;
};

const ITEMS_PER_PAGE = 8;

/* Status Badge */
function StatusBadge({ status }: { status: Test["status"] }) {
  const base = "inline-flex items-center text-xs md:text-sm font-semibold px-3 md:px-4 py-1 rounded-full border whitespace-nowrap";

  if (status === "Complete")
    return (
      <span className={`${base} bg-[#36CA0029] text-[#248600] border-[#36CA00]`}>
        Complete
      </span>
    );

  // Default to Pending as per requirement
  return (
    <span className={`${base} bg-[#E28F1D33] text-[#E28F1D] border-[#E28F1D]`}>
      Pending
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

export const TestPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  const isCompletedRoute = location.pathname === "/completedtests";
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [filteredTests, setFilteredTests] = useState<Test[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);


  // Helper to strip HTML tags
  const stripHtml = (html: string) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate && !endDate) return "N/A";

    if (startDate && endDate) {
      return `${formatDateUtil(startDate)} - ${formatDateUtil(endDate)}`;
    }
    return startDate ? formatDateUtil(startDate) : formatDateUtil(endDate!);
  };

  // Helper function to determine status
  const getStatus = (item: any): Test["status"] => {
    // Check quiz_status first as it's from the latest API
    const quizStatus = item.quiz_status?.toLowerCase();
    if (quizStatus === "completed") return "Complete";
    if (quizStatus === "pending") return "Pending";
    if (quizStatus === "expired") return "Not Attempted"; // Treat expired explicitly if needed for badge, or keep Pending

    // Fallback
    const itemStatus = item.status !== undefined && item.status !== null ? String(item.status).toLowerCase() : "";

    if (item.is_completed || itemStatus === "1" || itemStatus === "completed" || itemStatus === "complete") {
      return "Complete";
    }
    if (item.is_submitted || itemStatus === "2" || itemStatus === "submitted" || itemStatus === "pending") {
      return "Pending";
    }
    return "Pending";
  };

  // Fetch all quizzes
  const fetchTests = async () => {
    try {
      setIsLoading(true);
      setError("");

      const endpoint = "/EducationAndInternship/Student/quizzes";
      const limit = ITEMS_PER_PAGE;
      const queryParams = isCompletedRoute
        ? `?status=1&page=${page}&limit=${limit}`
        : `?page=${page}&limit=${limit}`;

      const { data, error } = await apiService.get<any>(
        `${endpoint}${queryParams}`
      );

      if (error) {
        setError(error);
        return;
      }

      if (data?.success && data.data) {
        const testList = data.data.data || data.data.quizzes || data.data || [];
        const transformed = testList.map((item: any) => {
          const status = getStatus(item);
          const isExpired = item.end_date ? new Date(item.end_date) < new Date() : false;

          // If expired and not complete, logic dictates 'Not Attempted' display for action, 
          // Status badge requests often differ, but let's stick to user request for Action column

          return {
            id: item.id?.toString() || item.exam_id?.toString() || Math.random().toString(),
            student_exam_id: item.student_exam_id || item.id,
            course: stripHtml(item.course_name || item.course || item.subject_name || "N/A"),
            testName: stripHtml(item.exam_name || item.title || item.test_name || "N/A"),
            date: formatDateRange(item.start_date, item.end_date),
            comment: item.comment || "N/A",
            status: status,
            is_completed: item.is_completed,
            is_submitted: item.is_submitted,
            is_checked: item.is_checked,
            is_expired: isExpired
          };
        }) || [];

        // Sort tests: Pending first, then Complete, then Not Attempted
        transformed.sort((a: any, b: any) => {
          const statusPriority: Record<string, number> = {
            "Pending": 1,
            "Complete": 2,
            "Not Attempted": 3
          };

          const priorityA = statusPriority[a.status] || 4;
          const priorityB = statusPriority[b.status] || 4;

          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }

          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        setFilteredTests(transformed);

        // Handle pagination
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.total_pages || Math.ceil(data.data.pagination.total / limit) || 1);
          setTotalItems(data.data.pagination.total || transformed.length);
        } else if (data.pagination) {
          setTotalPages(data.pagination.total_pages || Math.ceil(data.pagination.total / limit) || 1);
          setTotalItems(data.pagination.total || transformed.length);
        } else {
          setTotalPages(1);
          setTotalItems(transformed.length);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load tests");
      console.error("Error fetching tests:", err);
    } finally {
      setIsLoading(false);
    }
  };





  // Handle start test
  const handleStartTest = (testId: number) => {
    // Navigate directly to test take page. The page itself will fetch the start data.
    navigate(`/test-take/${testId}`);
  };

  useEffect(() => {
    fetchTests();
  }, [page]);



  const paged = useMemo(() => {
    return filteredTests;
  }, [filteredTests]);

  return (
    <div className="w-full p-2 sm:p-4 lg:p-0">
      <div
        className="rounded-2xl p-4 sm:p-6 card"
        style={{ boxShadow: "0px 0px 24px 0px #00000014" }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <PageShell
            title={isCompletedRoute ? "Completed Tests" : "Tests"}
            breadcrumb={["Home", isCompletedRoute ? "Completed Tests" : "All Tests"]}
          />

          <div className="flex flex-col sm:flex-row gap-3">



            <button
              onClick={() => navigate("/quiz/guideline")}
              className={`rounded-full font-bold px-6 py-2 text-xs sm:text-sm md:text-[12px] transition-all ${isDark
                ? "bg-[#2e415f] text-[#93c5fd] hover:bg-[#334155]"
                : "bg-[#ECF2FE] text-[#3E80F9]"
                }`}
            >
              Guideline
            </button>
          </div>
        </div>

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

        {/* Desktop Table (md and up) */}
        {!isLoading && !error && (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className={`text-left text-[14px] lg:text-[16px] font-semibold ${isDark ? "bg-gray-800" : "bg-[#F8F8F8]"
                    }`}>
                    <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"
                      }`}>
                      #
                    </th>
                    <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"
                      }`}>
                      Course name
                    </th>
                    <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"
                      }`}>
                      Test name
                    </th>
                    <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"
                      }`}>
                      Date
                    </th>

                    <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"
                      }`}>
                      Status
                    </th>
                    <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"
                      }`}>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paged.map((r, index) => (
                    <tr
                      key={r.id}
                      className={`border-b last:border-b hover:bg-gray-50 ${isDark
                        ? "border-gray-700 hover:bg-gray-800"
                        : "border-[#D9D9D9] hover:bg-gray-50"
                        }`}
                    >
                      <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                        }`}>
                        {(page - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>
                      <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                        }`}>
                        {r.course}
                      </td>
                      <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                        }`}>
                        {r.testName}
                      </td>
                      <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                        }`}>
                        {r.date}
                      </td>

                      <td className="py-4 px-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-4 px-4">
                        {r.status === "Complete" ? (
                          <button
                            onClick={() =>
                              navigate(`/tests/${r.student_exam_id || r.id}`, {
                                state: { course: r.course, testName: r.testName },
                              })
                            }
                            className="px-3 py-1 text-sm bg-[#008DD2] text-white border border-[#008DD2] rounded-full hover:bg-white hover:text-[#008DD2] dark:hover:text-[#008DD2] transition-all"
                          >
                            Show Result
                          </button>
                        ) : r.is_expired ? (
                          <button
                            className={`px-3 py-1 text-sm rounded-full cursor-not-allowed border ${isDark
                              ? "text-gray-500 border-gray-500 bg-gray-700/50"
                              : "text-[#7B7C7E] border-[#7B7C7E] bg-gray-100"
                              }`}
                            disabled
                          >
                            Not Attempted
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartTest(Number(r.student_exam_id || r.id))}
                            className="px-3 py-1 text-sm rounded-full border bg-[#008DD2] text-white border-[#008DD2] hover:bg-white hover:text-[#008DD2] dark:hover:text-[#008DD2] transition-all"
                          >
                            Start Test
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {paged.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className={`py-8 text-center ${isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                      >
                        No tests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View (Cards) */}
            <div className="md:hidden space-y-4">
              {paged.map((r) => (
                <div
                  key={r.id}
                  className={`border rounded-xl p-4 shadow-sm card ${isDark ? "border-gray-700" : "border-gray-200"
                    }`}
                >
                  <div className="flex flex-col gap-2 text-sm">
                    <p className={isDark ? "text-gray-300" : "text-gray-900"}>
                      <span className="font-semibold">Course:</span> {r.course}
                    </p>
                    <p className={isDark ? "text-gray-300" : "text-gray-900"}>
                      <span className="font-semibold">Test:</span> {r.testName}
                    </p>
                    <p className={isDark ? "text-gray-300" : "text-gray-900"}>
                      <span className="font-semibold">Date:</span> {r.date}
                    </p>


                    <div>
                      <StatusBadge status={r.status} />
                    </div>

                    <div className="pt-2">
                      {r.status === "Complete" ? (
                        <button
                          onClick={() =>
                            navigate(`/tests/${r.student_exam_id || r.id}`, {
                              state: { course: r.course, testName: r.testName },
                            })
                          }
                          className="px-4 py-2 text-sm bg-[#008DD2] text-white border border-[#008DD2] rounded-full w-full hover:bg-white hover:text-[#008DD2] dark:hover:text-[#008DD2] transition-all"
                        >
                          Show Result
                        </button>
                      ) : r.is_expired ? (
                        <button
                          className={`px-4 py-2 text-sm rounded-full w-full cursor-not-allowed border ${isDark
                            ? "text-gray-500 border-gray-500 bg-gray-700/50"
                            : "text-[#7B7C7E] border-[#7B7C7E] bg-gray-100"
                            }`}
                          disabled
                        >
                          Not Attempted
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartTest(Number(r.student_exam_id || r.id))}
                          className="px-4 py-2 text-sm rounded-full w-full border bg-[#008DD2] text-white border-[#008DD2] hover:bg-white hover:text-[#008DD2] dark:hover:text-[#008DD2] transition-all"
                        >
                          Start Test
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Showing {filteredTests.length} of {totalItems} tests
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

                {/* Page buttons */}
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