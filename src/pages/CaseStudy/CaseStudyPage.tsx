import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";

import { Eye, X } from "lucide-react";
import { apiService } from "../../services/apiService"; // Adjust path as needed
import { formatDate as formatDateUtil } from "../../utils/dateUtils";

type CaseStudy = {
  id: string;
  student_casestudy_id?: number;
  course: string;
  course_name?: string;
  caseStudyName: string;
  name?: string;
  date: string;
  raw_end_date?: string; // Added for expiration check
  end_date?: string;
  due_date?: string;
  comment?: string;
  status: "Complete" | "Pending" | "Not Attempted";
  is_completed?: boolean;
  is_submitted?: boolean;
  is_checked?: number;
  assignment_status?: string;
  isUpcoming?: boolean;
};

const ITEMS_PER_PAGE = 8;

/* Status Badge */
function StatusBadge({ status }: { status: CaseStudy["status"] }) {
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

/* Helper to create pagination list with ellipsis */
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

export const CaseStudyPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Comment Modal State
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState("");

  const handleViewComment = (comment: string) => {
    setSelectedComment(comment);
    setCommentModalOpen(true);
  };


  // Helper to strip HTML tags
  const stripHtml = (html: string) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };


  const formatDateRange = (startDate: any, endDate: any) => {
    const start = formatDateUtil(startDate);
    const end = formatDateUtil(endDate);
    if (start === "N/A" || end === "N/A") return "N/A";
    return `${start} - ${end}`;
  };

  // Helper function to check if date is expired
  const isExpired = (dateString?: string) => {
    if (!dateString) return false;
    const end = new Date(dateString);
    const now = new Date();
    // Normalize to start of day for comparison to avoid time issues
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    // If end date is before today, it's expired. If it's today or future, it's active.
    return end < now;
  };


  // Helper function to determine status
  const getStatus = (status: any, isCompleted: boolean): CaseStudy["status"] => {
    const statusStr = status?.toString().toLowerCase();
    if (isCompleted || statusStr === "completed" || statusStr === "complete" || status === 1 || status === "1") {
      return "Complete";
    }
    // Default everything else to Pending as per user request to hide "Not Attempted"
    return "Pending";
  };

  // Fetch all case studies
  const fetchCaseStudies = async () => {
    try {
      setIsLoading(true);
      setError("");

      const { data, error } = await apiService.get<any>(
        `/EducationAndInternship/Student/case-studies?page=${page}&limit=${ITEMS_PER_PAGE}`
      );

      if (error) {
        setError(error);
        return;
      }

      if (data?.success && data.data) {
        const caseStudyList = data.data.data || data.data.case_studies || [];
        const transformed = caseStudyList.map((item: any) => {
          const status = getStatus(
            item.case_study_status || item.status,
            item.is_completed || item.is_checked === 1
          );

          return {
            id: item.id?.toString() || item.case_study_id?.toString() || Math.random().toString(),
            student_casestudy_id: item.id || item.case_study_id,
            course: stripHtml(item.course_name || item.course || item.subject_name || item.course_title || "N/A"),
            caseStudyName: stripHtml(item.case_study_name || item.title || item.name || "N/A"),
            date: formatDateRange(item.start_date, item.end_date),
            raw_end_date: item.end_date, // Store raw end date
            comment: item.comment || "N/A",
            status: status,
            is_completed: item.is_completed,
            is_submitted: item.is_submitted,
            is_checked: item.is_checked,
            assignment_status: item.case_study_status,
            isUpcoming: item.start_date ? new Date(item.start_date) > new Date() : false
          };
        }) || [];

        setCaseStudies(transformed);

        if (data.data.pagination?.total_pages) {
          setTotalPages(data.data.pagination.total_pages);
        }
        if (data.data.pagination?.total) {
          setTotalItems(data.data.pagination.total);
        } else {
          setTotalItems(transformed.length);
        }

      }
    } catch (err: any) {
      setError(err.message || "Failed to load case studies");
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchCaseStudies();

  }, [page]);



  const paged = useMemo(() => {
    return caseStudies;
  }, [caseStudies]);

  return (
    <div className="w-full p-2 sm:p-4 lg:p-0">
      <div
        className="rounded-2xl p-4 sm:p-6 card"
        style={{ boxShadow: "0px 0px 24px 0px #00000014" }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h1 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"
              }`}>
              Case Studies
            </h1>
            <div className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"
              }`}>
              Home &gt; All Case Studies
            </div>
          </div>

          <button
            onClick={() => navigate("/case-study/guideline")}
            className={`rounded-full font-bold px-6 py-2 text-xs sm:text-sm md:text-[12px] transition-all ${isDark
              ? "bg-[#2e415f] text-[#93c5fd] hover:bg-[#334155]"
              : "bg-[#ECF2FE] text-[#3E80F9]"
              }`}
          >
            Guideline
          </button>
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
                      Case Study name
                    </th>
                    <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"
                      }`}>
                      Date
                    </th>
                    <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"
                      }`}>
                      Comment
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
                  {paged.map((r, index) => {
                    const expired = isExpired(r.raw_end_date);
                    return (
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
                          {r.caseStudyName}
                        </td>
                        <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                          }`}>
                          {r.date}
                        </td>
                        <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                          }`}>
                          {r.comment && r.comment !== "N/A" ? (
                            <button
                              onClick={() => handleViewComment(r.comment!)}
                              className={`p-2 rounded-full transition-colors ${isDark
                                ? "text-blue-400 hover:bg-gray-700"
                                : "text-blue-600 hover:bg-blue-50"
                                }`}
                              title="View Comment"
                            >
                              <Eye size={18} />
                            </button>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="py-4 px-4">
                          {r.status === "Complete" ? (
                            <button
                              onClick={() => navigate(`/casestudy/${r.student_casestudy_id || r.id}`)}
                              className="px-3 py-1 text-sm bg-[#008DD2] text-white border border-[#008DD2] rounded-full hover:bg-white hover:text-[#008DD2] dark:hover:bg-gray-800 dark:hover:text-[#008DD2] transition-all"
                            >
                              Show Result
                            </button>
                          ) : r.isUpcoming ? (
                            <button
                              disabled
                              className="px-3 py-1 text-sm bg-yellow-500 text-white border border-yellow-500 rounded-full cursor-not-allowed font-semibold opacity-80"
                            >
                              Coming Soon
                            </button>
                          ) : (r.status === "Pending" || r.status === "Not Attempted") ? (
                            !expired ? (
                              <button
                                onClick={() => navigate(`/casestudy/submit/${r.student_casestudy_id || r.id}`)}
                                className="px-3 py-1 text-sm bg-green-600 text-white border border-green-600 rounded-full hover:bg-green-700 transition-all"
                              >
                                Start Case Study
                              </button>
                            ) : (
                              <button
                                className={`px-3 py-1 text-sm rounded-full cursor-not-allowed border ${isDark
                                  ? "text-gray-500 border-gray-500"
                                  : "text-[#7B7C7E] border-[#7B7C7E]"
                                  }`}
                                disabled
                              >
                                Not Attempted
                              </button>
                            )
                          ) : (
                            <button
                              className={`px-3 py-1 text-sm rounded-full cursor-not-allowed border ${isDark
                                ? "text-gray-500 border-gray-500"
                                : "text-[#7B7C7E] border-[#7B7C7E]"
                                }`}
                              disabled
                            >
                              Not Attempted
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {paged.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className={`py-8 text-center ${isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                      >
                        No case studies found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View (Cards) */}
            <div className="md:hidden space-y-4">
              {paged.map((r, index) => {
                const expired = isExpired(r.raw_end_date);
                return (
                  <div
                    key={r.id}
                    className={`border rounded-xl p-4 shadow-sm card ${isDark ? "border-gray-700" : "border-gray-200"
                      }`}
                  >
                    <div className={`mb-2 text-sm font-bold ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      #{(page - 1) * ITEMS_PER_PAGE + index + 1}
                    </div>
                    <div className="flex flex-col gap-2 text-sm">
                      <p className={isDark ? "text-gray-300" : "text-gray-900"}>
                        <span className="font-semibold">Course:</span> {r.course}
                      </p>
                      <p className={isDark ? "text-gray-300" : "text-gray-900"}>
                        <span className="font-semibold">Case Study:</span> {r.caseStudyName}
                      </p>
                      <p className={isDark ? "text-gray-300" : "text-gray-900"}>
                        <span className="font-semibold">Date:</span> {r.date}
                      </p>
                      <p className={isDark ? "text-gray-300" : "text-gray-900"}>
                        <span className="font-semibold">Comment:</span>
                        {r.comment && r.comment !== "N/A" ? (
                          <button
                            onClick={() => handleViewComment(r.comment!)}
                            className={`inline-flex items-center ml-2 p-1 rounded-full ${isDark ? "text-blue-400" : "text-blue-600"}`}
                          >
                            <Eye size={16} /> <span className="ml-1 text-xs underline">View</span>
                          </button>
                        ) : (
                          <span className="ml-1 text-gray-500">N/A</span>
                        )}
                      </p>

                      <div>
                        <StatusBadge status={r.status} />
                      </div>

                      <div className="pt-2">
                        {r.status === "Complete" ? (
                          <button
                            onClick={() => navigate(`/casestudy/${r.student_casestudy_id || r.id}`)}
                            className="px-4 py-2 text-sm bg-[#008DD2] text-white border border-[#008DD2] rounded-full w-full hover:bg-white hover:text-[#008DD2] dark:hover:bg-gray-800 dark:hover:text-[#008DD2] transition-all"
                          >
                            Show Result
                          </button>
                        ) : r.isUpcoming ? (
                          <button
                            disabled
                            className="px-4 py-2 text-sm bg-yellow-500 text-white border border-yellow-500 rounded-full w-full cursor-not-allowed font-semibold opacity-80"
                          >
                            Coming Soon
                          </button>
                        ) : (r.status === "Pending" || r.status === "Not Attempted") ? (
                          !expired ? (
                            <button
                              onClick={() => navigate(`/casestudy/submit/${r.student_casestudy_id || r.id}`)}
                              className="px-4 py-2 text-sm bg-green-600 text-white border border-green-600 rounded-full w-full hover:bg-green-700 transition-all"
                            >
                              Start Case Study
                            </button>
                          ) : (
                            <button
                              className={`px-4 py-2 text-sm rounded-full w-full cursor-not-allowed border ${isDark
                                ? "text-gray-500 border-gray-500"
                                : "text-[#7B7C7E] border-[#7B7C7E]"
                                }`}
                              disabled
                            >
                              Not Attempted
                            </button>
                          )
                        ) : (
                          <button
                            className={`px-4 py-2 text-sm rounded-full w-full cursor-not-allowed border ${isDark
                              ? "text-gray-500 border-gray-500"
                              : "text-[#7B7C7E] border-[#7B7C7E]"
                              }`}
                            disabled
                          >
                            Not Attempted
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Showing {caseStudies.length} of {totalItems} case studies
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
      {/* Comment Modal */}
      {commentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl shadow-xl transform transition-all ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <div className={`flex justify-between items-center p-4 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                Case Study Comment
              </h3>
              <button
                onClick={() => setCommentModalOpen(false)}
                className={`p-1 rounded-full hover:bg-gray-100 ${isDark ? "hover:bg-gray-700 text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700"}`}
              >
                <X size={20} />
              </button>
            </div>
            <div className={`p-6 max-h-[60vh] overflow-y-auto ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              {selectedComment ? (
                <div dangerouslySetInnerHTML={{ __html: selectedComment }} />
              ) : (
                <p>No comment available.</p>
              )}
            </div>
            <div className={`flex justify-end p-4 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <button
                onClick={() => setCommentModalOpen(false)}
                className="px-4 py-2 bg-[#008DD2] text-white rounded-lg hover:bg-[#007AB8] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};