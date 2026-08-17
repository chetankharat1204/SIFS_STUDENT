import { useState, useEffect } from "react";
import { Trash2 } from 'lucide-react';
import { useTheme } from "../../../contexts/ThemeContext"; // Adjust path as needed
import { apiService } from "../../../services/apiService";
import { FaSpinner } from "react-icons/fa";
import { formatDate } from "../../../utils/dateUtils";
import { useNavigate } from "react-router-dom";

// Define mapping type for clarity
interface CompleteCourse {
  id: number;
  course_id: number;
  course_title: string;
  module: string;
  los: string;
  completed_at: string;
  action: string;
}

// Pagination helper function
const getPageList = (currentPage: number, totalPages: number, maxVisible: number) => {
  const pages: (number | string)[] = [];
  const half = Math.floor(maxVisible / 2);
  
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxVisible - 1);
  
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 font-inter">
      <div className={`rounded-lg shadow-xl max-w-md w-full p-6 ${
        isDark ? "bg-gray-800" : "bg-white"
      }`}>
        <div className="text-center">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
            isDark ? "bg-red-900" : "bg-red-100"
          }`}>
            <Trash2 className={`h-6 w-6 ${
              isDark ? "text-red-400" : "text-red-600"
            }`} />
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${
            isDark ? "text-white" : "text-gray-900"
          }`}>
            Delete Completed Record
          </h3>
          <p className={`text-sm mb-6 ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}>
            Are you sure you want to delete this record? This action cannot be undone.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
                isDark 
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

export default function CompleteCoursePage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [courses, setCourses] = useState<CompleteCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    itemId: number | null;
  }>({
    isOpen: false,
    itemId: null,
  });
  const { isDark } = useTheme();
  const itemsPerPage = 10;
  
  const fetchCompletedCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: apiError } = await apiService.get<any>(
        `/EducationAndInternship/Student/course-complete?page=${page}&limit=${itemsPerPage}`
      );

      if (apiError) {
        setError(apiError);
        return;
      }

      if (data?.success && data.data) {
        const rawResponse = data.data;
        const rawItems = rawResponse.data || [];
        
        if (rawResponse.pagination) {
          setTotalPages(rawResponse.pagination.total_pages || 1);
        }

        const mapped = rawItems.map((item: any) => ({
          id: item.id,
          course_id: item.student_course_id || item.course_id,
          course_title: item.course_title || "NA",
          module: item.subject_name || "NA",
          los: item.los_name || "NA",
          completed_at: item.completed_at || "",
          action: "View"
        }));

        setCourses(mapped);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedCourses();
  }, [page]);

  // Function to open delete confirmation modal
  const handleDeleteClick = (id: number) => {
    setDeleteModal({
      isOpen: true,
      itemId: id,
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
          console.error("Delete Error:", apiError);
        }

        await fetchCompletedCourses();
      } catch (err) {
        console.error("Delete failed", err);
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

  const handleView = (r: CompleteCourse) => {
    navigate(`/courses/${r.course_id}?tab=courses`);
  };

  const startIndex = (page - 1) * itemsPerPage;
  const paged = courses;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
        <span className="ml-3 text-lg">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
        {error}
        <button onClick={fetchCompletedCourses} className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Retry</button>
      </div>
    );
  }

  return (
    <div className="mx-auto rounded-lg">
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className={`text-left text-[16px] font-semibold rounded-2xl ${
              isDark ? "bg-gray-800" : "bg-[#F8F8F8]"
            }`}>
              <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"}`}>#</th>
              <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"}`}>Course name</th>
              <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"}`}>Module</th>
              <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"}`}>LOS</th>
              <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"}`}>Completed On</th>
              <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"}`}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paged.map((r, index) => (
              <tr 
                key={r.id} 
                className={`border-b last:border-b hover:bg-gray-50 ${
                  isDark ? "border-gray-700 hover:bg-gray-800" : "border-[#D9D9D9] hover:bg-gray-50"
                }`}
              >
                <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"}`}>
                  {startIndex + index + 1}
                </td>
                <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"}`}>
                  <div className="line-clamp-2">{r.course_title}</div>
                </td>
                <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"}`}>
                  <div className="line-clamp-2">{r.module}</div>
                </td>
                <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"}`}>
                  <div className="line-clamp-2">{r.los}</div>
                </td>
                <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"}`}>
                  {formatDate(r.completed_at)}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleView(r)} className="inline-flex items-center px-4 py-1 rounded-full bg-[#008DD2] text-white font-semibold text-[12px] border border-[#008DD2] hover:bg-white hover:text-[#008DD2] cursor-pointer transition-all duration-200">
                      View
                    </button>
                    <button onClick={() => handleDeleteClick(r.id)} className="inline-flex items-center px-3 py-1 rounded-full bg-red-500 text-white font-semibold text-[12px] border border-red-500 hover:bg-white hover:text-red-500 cursor-pointer transition-all duration-200">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {paged.length === 0 && (
              <tr>
                <td colSpan={6} className={`py-8 text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>No courses found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-center">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`px-3 py-1 text-sm rounded-md border ${page === 1 ? (isDark ? "text-gray-600 border-gray-700 cursor-not-allowed" : "text-gray-400 border-gray-300 cursor-not-allowed") : (isDark ? "text-gray-300 border-gray-600 hover:bg-gray-700" : "text-gray-700 border-gray-300 hover:bg-gray-50")}`}
            disabled={page === 1}
          >Prev</button>

          {getPageList(page, totalPages, 7).map((p, idx) =>
            p === "..." ? (
              <span key={`dot-${idx}`} className={`px-3 py-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>…</span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p as number)}
                className={`px-3 py-1 rounded-md text-sm border font-semibold ${p === page ? (isDark ? "bg-gray-700 text-white border-gray-600" : "bg-white text-[#00467A] border-[#00467A]") : (isDark ? "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700" : "bg-white text-[#B1B1B1] border-[#EBEBEB] hover:bg-gray-50")}`}
              >{p}</button>
            )
          )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={`px-3 py-1 text-sm rounded-md border ${page === totalPages ? (isDark ? "text-gray-600 border-gray-700 cursor-not-allowed" : "text-gray-400 border-gray-300 cursor-not-allowed") : (isDark ? "text-gray-300 border-gray-600 hover:bg-gray-700" : "text-gray-700 border-gray-300 hover:bg-gray-50")}`}
            disabled={page === totalPages}
          >Next</button>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        isDark={isDark}
      />
    </div>
  );
}