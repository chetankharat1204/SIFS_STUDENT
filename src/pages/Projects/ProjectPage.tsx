import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { apiService } from "../../services/apiService"; // Adjust path as needed
import { formatDate as formatDateUtil } from "../../utils/dateUtils";
import { Eye, X } from "lucide-react";

type Project = {
  id: string;
  student_project_id?: number;
  course: string;
  course_name?: string;
  testName: string;
  assignment_name?: string;
  projectName: string;
  title?: string;
  date: string;
  start_date?: string;
  end_date?: string;
  due_date?: string;
  comment?: string;
  status: "Complete" | "Pending" | "Not Attempted";
  is_expired?: boolean;
  isUpcoming?: boolean;
};

const ITEMS_PER_PAGE = 8;

/* Status Badge */
function StatusBadge({ status }: { status: Project["status"] }) {
  const base = "inline-flex items-center text-xs md:text-sm font-semibold px-3 md:px-4 py-1 rounded-full border whitespace-nowrap";

  if (status === "Complete")
    return (
      <span className={`${base} bg-[#36CA0029] text-[#248600] border-[#36CA00]`}>
        Complete
      </span>
    );

  // Default to Pending
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

export const ProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  const isCompletedRoute = location.pathname === "/completedprojects";
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState("");

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

    if (start !== "N/A" && end !== "N/A") {
      return `${start} - ${end}`;
    } else if (start !== "N/A") {
      return start;
    } else if (end !== "N/A") {
      return end;
    }
    return "N/A";
  };

  // Helper function to determine status
  const getStatus = (
    isCompleted: boolean,
    status: string
  ): Project["status"] => {
    if (isCompleted || status?.toLowerCase() === "completed" || status?.toLowerCase() === "complete") {
      return "Complete";
    }
    // Default to Pending as per requirement
    return "Pending";
  };

  // Helper function to check if project is expired
  const isExpired = (dateString?: string) => {
    if (!dateString) return false;
    const end = new Date(dateString);
    const now = new Date();
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return end < now;
  };

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError("");

      const url = isCompletedRoute
        ? `/EducationAndInternship/Student/projects?status=1&page=${page}&limit=${ITEMS_PER_PAGE}`
        : `/EducationAndInternship/Student/projects?page=${page}&limit=${ITEMS_PER_PAGE}`;

      const { data, error: apiError } = await apiService.get<any>(url);

      if (apiError) {
        setError(apiError);
        return;
      }

      if (data?.success && data.data) {
        let projectList = [];
        let totalItems = 0;

        // Handle different response structures
        if (Array.isArray(data.data)) {
          projectList = data.data;
          totalItems = data.data.length;
        } else if (data.data.data && Array.isArray(data.data.data)) {
          projectList = data.data.data;
          totalItems = data.data.pagination?.total || data.data.total || data.data.data.length;
        } else if (data.data.projects && Array.isArray(data.data.projects)) {
          projectList = data.data.projects;
          totalItems = data.data.pagination?.total || data.data.total || data.data.projects.length;
        } else {
          projectList = [];
        }

        const transformed = projectList.map((item: any) => {
          const isCompleted = item.is_completed || item.is_checked === 1 || item.status === "completed" || item.status === 1 || item.status === "1";
          const expired = isExpired(item.end_date || item.due_date);
          const status = getStatus(isCompleted, item.project_status || item.status);

          return {
            id: item.id?.toString() || item.project_id?.toString() || Math.random().toString(),
            student_project_id: item.id || item.student_project_id,
            course: stripHtml(item.course_name || item.course || item.subject_name || "NA"),
            testName: item.test_name || item.testName || item.assignment_type || "",
            projectName: `${item.test_name || item.testName || ""} ${stripHtml(item.project_name || item.title || item.name || "")}`.trim(),
            date: formatDateRange(item.start_date, item.end_date || item.due_date),
            comment: item.comment || item.remark || "",
            status: status,

            is_expired: expired,
            isUpcoming: item.start_date ? new Date(item.start_date) > new Date() : false,
          };
        });

        // Sort projects: Pending first, then Complete, then Not Attempted
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

        setProjects(transformed);
        setTotalItems(totalItems);

        // Calculate total pages
        if (data.data.pagination?.total_pages) {
          setTotalPages(data.data.pagination.total_pages);
        } else if (data.data.pagination?.total) {
          setTotalPages(Math.ceil(data.data.pagination.total / ITEMS_PER_PAGE));
        } else {
          setTotalPages(Math.ceil(totalItems / ITEMS_PER_PAGE));
        }
      } else {
        setError("No projects data received");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load projects");
      console.error("Fetch projects error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page]);

  const paged = useMemo(() => {
    return projects;
  }, [projects]);

  const handleViewComment = (comment: string) => {
    setSelectedComment(comment);
    setCommentModalOpen(true);
  };

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
              {isCompletedRoute ? "Completed Projects" : "Projects"}
            </h1>
            <div className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"
              }`}>
              Home &gt; {isCompletedRoute ? "Completed Projects" : "All Projects"}
            </div>
          </div>
          <button
            onClick={() => navigate("/project/guideline")}
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
          <div className={`p-4 mb-4 rounded-lg ${isDark
            ? "bg-red-900/20 text-red-300"
            : "bg-red-100 text-red-700"
            }`}>
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
                      Project name
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
                  {paged.map((project, index) => (
                    <tr
                      key={project.id}
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
                        {project.course}
                      </td>
                      <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                        }`}>
                        {project.projectName}
                      </td>
                      <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                        }`}>
                        {project.date}
                      </td>
                      <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                        }`}>
                        {project.comment ? (
                          <div
                            onClick={() => handleViewComment(project.comment!)}
                            className="bg-[#ECF2FE] p-2 rounded-full w-fit cursor-pointer hover:bg-[#E0E8F9] transition-all"
                          >
                            <Eye size={16} className="text-[#3E80F9]" />
                          </div>
                        ) : (
                          "NA"
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={project.status} />
                      </td>
                      <td className="py-4 px-4">
                        {project.status === "Complete" ? (
                          <button
                            onClick={() => navigate(`/projects/${project.student_project_id || project.id}`)}
                            className="px-3 py-1 text-sm bg-[#008DD2] text-white border border-[#008DD2] rounded-full hover:bg-white hover:text-[#008DD2] dark:hover:bg-gray-800 dark:hover:text-[#008DD2] transition-all"
                          >
                            Show Result
                          </button>
                        ) : project.isUpcoming ? (
                          <button
                            disabled
                            className="px-3 py-1 text-sm bg-yellow-500 text-white border border-yellow-500 rounded-full cursor-not-allowed font-semibold opacity-80"
                          >
                            Coming Soon
                          </button>
                        ) : project.is_expired ? (
                          <button
                            disabled
                            className={`px-3 py-1 text-sm rounded-full cursor-not-allowed ${isDark
                              ? "bg-gray-700 text-gray-500 border border-gray-600"
                              : "bg-gray-200 text-gray-500 border border-gray-300"
                              }`}
                          >
                            Not Attempted
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/projects/submit/${project.student_project_id || project.id}`)}
                            className="px-3 py-1 text-sm bg-green-600 text-white border border-green-600 rounded-full hover:bg-green-700 transition-all"
                          >
                            Start Project
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
                        No projects found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View (Cards) */}
            <div className="md:hidden space-y-4">
              {paged.map((project, index) => (
                <div
                  key={project.id}
                  className={`border rounded-xl p-4 shadow-sm card ${isDark ? "border-gray-700" : "border-gray-200"
                    }`}
                >
                  <div className={`mb-2 text-sm font-bold ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    #{(page - 1) * ITEMS_PER_PAGE + index + 1}
                  </div>
                  <div className="flex flex-col gap-2 text-sm">
                    <p className={isDark ? "text-gray-300" : "text-gray-900"}>
                      <span className="font-semibold">Course:</span> {project.course}
                    </p>
                    <p className={isDark ? "text-gray-300" : "text-gray-900"}>
                      <span className="font-semibold">Project:</span> {project.projectName}
                    </p>
                    <p className={isDark ? "text-gray-300" : "text-gray-900"}>
                      <span className="font-semibold">Date:</span> {project.date}
                    </p>
                    <p className={`flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-900"}`}>
                      <span className="font-semibold">Comment:</span>
                      {project.comment ? (
                        <div
                          onClick={() => handleViewComment(project.comment!)}
                          className="bg-[#ECF2FE] p-2 rounded-full w-fit cursor-pointer hover:bg-[#E0E8F9] transition-all"
                        >
                          <Eye size={16} className="text-[#3E80F9]" />
                        </div>
                      ) : (
                        "NA"
                      )}
                    </p>

                    <div>
                      <StatusBadge status={project.status} />
                    </div>

                    <div className="pt-2">
                      {project.status === "Complete" ? (
                        <button
                          onClick={() => navigate(`/projects/${project.student_project_id || project.id}`)}
                          className="px-4 py-2 text-sm bg-[#008DD2] text-white border border-[#008DD2] rounded-full w-full hover:bg-white hover:text-[#008DD2] dark:hover:bg-gray-800 dark:hover:text-[#008DD2] transition-all"
                        >
                          Show Result
                        </button>
                      ) : project.isUpcoming ? (
                        <button
                          disabled
                          className="px-4 py-2 text-sm bg-yellow-500 text-white border border-yellow-500 rounded-full w-full cursor-not-allowed font-semibold opacity-80"
                        >
                          Coming Soon
                        </button>
                      ) : project.is_expired ? (
                        <button
                          disabled
                          className={`px-4 py-2 text-sm rounded-full w-full cursor-not-allowed ${isDark
                            ? "bg-gray-700 text-gray-500 border border-gray-600"
                            : "bg-gray-200 text-gray-500 border border-gray-300"
                            }`}
                        >
                          Not Attempted
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/projects/submit/${project.student_project_id || project.id}`)}
                          className="px-4 py-2 text-sm bg-green-600 text-white border border-green-600 rounded-full w-full hover:bg-green-700 transition-all"
                        >
                          Start Project
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
                Showing {projects.length} of {totalItems} projects
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg rounded-2xl shadow-xl transform transition-all p-6 ${isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"
              }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Project Comment</h3>
              <button
                onClick={() => setCommentModalOpen(false)}
                className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"
                  }`}
              >
                <X size={20} />
              </button>
            </div>

            <div className={`mt-2 p-4 rounded-lg max-h-[60vh] overflow-y-auto ${isDark ? "bg-gray-900/50" : "bg-gray-50"
              }`}>
              {selectedComment ? (
                <div
                  className={`prose ${isDark ? "prose-invert" : ""}`}
                  dangerouslySetInnerHTML={{ __html: selectedComment }}
                />
              ) : (
                <p className="text-center italic text-gray-500">No comment content available.</p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setCommentModalOpen(false)}
                className="px-4 py-2 bg-[#008DD2] text-white rounded-lg hover:bg-[#007cc0] transition-colors font-medium"
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