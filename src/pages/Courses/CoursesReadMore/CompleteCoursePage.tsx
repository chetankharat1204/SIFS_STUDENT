// CompleteCoursePage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../contexts/ThemeContext";
import { apiService } from "../../../services/apiService";
import { FaSpinner } from "react-icons/fa";
import { Trash2 } from 'lucide-react';
import { formatDate } from "../../../utils/dateUtils";

// Define the course type for this page
interface CompleteCourse {
  id: number;
  course_id: number;
  course_name: string;
  subject_id: number;
  subject_name: string;
  los_id: number;
  los_title: string;
  completed_at: string;
  percentage?: number;
  total_modules?: number;
  completed_modules?: number;
}

// Pagination helper function
const getPageList = (currentPage: number, totalPages: number, maxVisible: number) => {
  const pages: (number | string)[] = [];
  const half = Math.floor(maxVisible / 2);

  let start = Math.max(1, currentPage - half);
  const end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("...");
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }

  return pages;
};

// Confirmation Modal Component
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isDark
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDark: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className={`rounded-lg shadow-xl max-w-md w-full p-6 ${isDark ? "bg-gray-800" : "bg-white"
        }`}>
        <div className="text-center">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${isDark ? "bg-red-900" : "bg-red-100"
            }`}>
            <Trash2 className={`h-6 w-6 ${isDark ? "text-red-400" : "text-red-600"
              }`} />
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"
            }`}>
            Delete Completion Record
          </h3>
          <p className={`text-sm mb-6 ${isDark ? "text-gray-400" : "text-gray-500"
            }`}>
            Are you sure you want to remove this completion record? This action cannot be undone.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${isDark
                ? "text-gray-300 bg-gray-700 border-gray-600 hover:bg-gray-600 focus:ring-blue-500"
                : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-blue-500"
                }`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CompleteCoursePage({ courseId: propCourseId }: { courseId?: string }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedCourses, setCompletedCourses] = useState<CompleteCourse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const { isDark } = useTheme();
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    itemId: number | null;
  }>({
    isOpen: false,
    itemId: null,
  });
  const itemsPerPage = 10;

  const fetchCompletedCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      // We use the propCourseId passed from the parent component
      const courseId = propCourseId;

      const { data, error: apiError } = await apiService.get<any>(
        `/EducationAndInternship/Student/course-complete?page=${page}&limit=${itemsPerPage}${courseId ? `&course_id=${courseId}` : ""}`
      );

      if (apiError) {
        setError(apiError);
        return;
      }

      if (data?.success && data.data) {
        // Handle the specific structure provided by the user: { success: true, data: { data: [...], pagination: {...} } }
        const rawResponse = data.data;
        const rawItems = rawResponse.data || rawResponse.StudentModules || rawResponse.completed_courses || (Array.isArray(rawResponse) ? rawResponse : []);
        
        if (rawResponse.pagination) {
          setTotalPages(rawResponse.pagination.total_pages || 1);
        }

        const transformedCourses: CompleteCourse[] = Array.isArray(rawItems)
          ? rawItems.map((item: any) => ({
            id: item.id || item.course_complete_id || item.completion_id || item.student_course_complete_id || item.student_module_id || Math.random(),
            course_id: item.course_id || item.studentCourseID || item.student_course_id || item.courseID,
            course_name: item.course_title || item.course_name || "NA",
            subject_id: item.subject_id || 0,
            subject_name: item.subject_name || item.module || "NA",
            los_id: item.los_id || 0,
            los_title: item.los_name || item.los_title || item.los || "NA",
            completed_at: item.completed_at || item.created_at || new Date().toISOString(),
            percentage: item.percentage || item.progress_percentage || 100,
            total_modules: item.total_modules,
            completed_modules: item.completed_modules,
          }))
          : [];

        setCompletedCourses(transformedCourses);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load completed courses");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete completion record
  const handleDeleteClick = (completionId: number) => {
    setDeleteModal({
      isOpen: true,
      itemId: completionId,
    });
  };

  const handleConfirmDelete = async () => {
    if (deleteModal.itemId) {
      try {
        setLoading(true);
        const { error: apiError } = await apiService.delete(
          `/EducationAndInternship/Student/course-complete/course-complete-delete/${deleteModal.itemId}`
        );

        if (apiError) {
          console.error("Error deleting completion from server:", apiError);
        }

        await fetchCompletedCourses();

      } catch (err) {
        console.error("Error during deletion process:", err);
      } finally {
        setDeleteModal({
          isOpen: false,
          itemId: null,
        });
        setLoading(false);
      }
    }
  };

  const handleCloseModal = () => {
    setDeleteModal({
      isOpen: false,
      itemId: null,
    });
  };

  const handleView = (course: CompleteCourse) => {
    navigate(`/courses/${course.course_id}?subject=${course.subject_id}&los=${course.los_id}&tab=courses`, {
      state: {
        markAsCompleted: true,
        targetLosId: course.los_id
      }
    });
  };

  useEffect(() => {
    fetchCompletedCourses();
  }, [page, propCourseId]);

  const startIndex = (page - 1) * itemsPerPage;
  const paged = completedCourses; // No slicing here, it's server-paged

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
        <span className="ml-3 text-lg">Loading completed records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
        {error}
        <button
          onClick={fetchCompletedCourses}
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto rounded-lg">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className={`text-left text-[16px] font-semibold rounded-2xl ${isDark ? "bg-gray-800" : "bg-[#F8F8F8]"
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
                Module
              </th>
              <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"
                }`}>
                LOS
              </th>
              <th className={`py-3 px-4 whitespace-nowrap ${isDark ? "text-gray-300" : "text-gray-900"
                }`}>
                Completed On
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
                  {startIndex + index + 1}
                </td>
                <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                  }`}>
                  <div className="line-clamp-2">{r.course_name}</div>
                </td>
                <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                  }`}>
                  <div className="line-clamp-2">{r.subject_name}</div>
                </td>
                <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                  }`}>
                  <div className="line-clamp-2">{r.los_title}</div>
                </td>
                <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                  }`}>
                  {formatDate(r.completed_at)}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(r)}
                      className="inline-flex items-center px-4 py-1 rounded-full bg-[#008DD2] text-white font-semibold text-[12px] border border-[#008DD2] hover:bg-white hover:text-[#008DD2] cursor-pointer transition-all duration-200"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteClick(r.id)}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-red-500 text-white font-semibold text-[12px] border border-red-500 hover:bg-white hover:text-red-500 cursor-pointer transition-all duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {paged.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className={`py-8 text-center ${isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                >
                  No completed records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {completedCourses.length > 0 && (
        <div className="mt-6 flex items-center justify-center">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`px-3 py-1 text-sm rounded-md border ${page === 1
                ? isDark ? "text-gray-600 border-gray-700 cursor-not-allowed" : "text-gray-400 border-gray-300 cursor-not-allowed"
                : isDark ? "text-gray-300 border-gray-600 hover:bg-gray-700" : "text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              disabled={page === 1}
            >
              Prev
            </button>

            {getPageList(page, totalPages, 7).map((p, idx) =>
              p === "..." ? (
                <span key={`dot-${idx}`} className={`px-3 py-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`px-3 py-1 rounded-md text-sm border font-semibold ${p === page
                    ? isDark ? "bg-gray-700 text-white border-gray-600" : "bg-white text-[#00467A] border-[#00467A]"
                    : isDark ? "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700" : "bg-white text-[#B1B1B1] border-[#EBEBEB] hover:bg-gray-50"
                    }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={`px-3 py-1 text-sm rounded-md border ${page === totalPages
                ? isDark ? "text-gray-600 border-gray-700 cursor-not-allowed" : "text-gray-400 border-gray-300 cursor-not-allowed"
                : isDark ? "text-gray-300 border-gray-600 hover:bg-gray-700" : "text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        isDark={isDark}
      />
    </div>
  );
}