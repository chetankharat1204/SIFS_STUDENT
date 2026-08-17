// BookmarksPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { FaSpinner } from "react-icons/fa";
import { useTheme } from "../../../contexts/ThemeContext";
import { apiService } from "../../../services/apiService";
import type { Bookmark } from "../../../types/trainingTypes";

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
            Delete Bookmark
          </h3>
          <p className={`text-sm mb-6 ${isDark ? "text-gray-400" : "text-gray-500"
            }`}>
            Are you sure you want to delete this bookmark? This action cannot be undone.
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

export default function BookmarksPage() {
  const [page, setPage] = useState(1);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
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

  // Fetch bookmarks from API
  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: apiError } = await apiService.get<any>(
        `/EducationAndInternship/Student/training-bookmarks?page=${page}&limit=${itemsPerPage}`
      );

      if (apiError) {
        setError(apiError);
        return;
      }

      if (data?.success && data.data) {
        const bookmarksData = data.data.data || data.data.bookmarks || data.data;

        // Update total pages from pagination data
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.total_pages || 1);
        }

        const transformedBookmarks: Bookmark[] = Array.isArray(bookmarksData)
          ? bookmarksData.map((item: any) => {
            // Helper to extract string from potential object {id, name}
            const getName = (val: any) => {
              if (typeof val === 'string' && val.trim() !== '') return val;
              if (val && typeof val === 'object') {
                const name = val.name || val.title;
                if (name) return name;
              }
              return null;
            };

            return {
              id: item.id || item.bookmark_id,
              training_id: item.studentTrainingID || item.student_training_id || item.training?.id || item.training_id || item.trainingID,
              training_name: getName(item.training) || getName(item.training_name) || getName(item.training_title) || "NA",
              subject_id: item.module?.id || item.subject_id || item.subjectID,
              subject_name: getName(item.module) || getName(item.subject_name) || getName(item.module) || "NA",
              los_id: item.learning_objective?.id || item.los_id || item.losID,
              los_title: getName(item.learning_objective) || getName(item.los_title) || getName(item.los) || "NA",
              created_at: item.created_at || new Date().toISOString(),
            };
          })
          : [];

        setBookmarks(transformedBookmarks);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load bookmarks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, [page]);

  const navigate = useNavigate();

  // Function to handle View action
  const handleView = (bookmark: Bookmark) => {
    // Navigate to the specific LOS in the training with the proper tab
    navigate(`/training/${bookmark.training_id}?subject=${bookmark.subject_id}&los=${bookmark.los_id}&tab=trainings`, {
      state: {
        markAsBookmarked: true,
        targetLosId: bookmark.los_id
      }
    });
  };

  // Function to open delete confirmation modal
  const handleDeleteClick = (id: number) => {
    setDeleteModal({
      isOpen: true,
      itemId: id,
    });
  };

  // Function to handle confirmed delete
  const handleConfirmDelete = async () => {
    if (deleteModal.itemId) {
      try {
        const { error: apiError } = await apiService.delete(
          `/EducationAndInternship/Student/training-bookmarks/bookmark-delete/${deleteModal.itemId}`
        );

        if (apiError) {
          console.error("Error deleting bookmark:", apiError);
          return;
        }

        // Remove from local state
        setBookmarks(prev => prev.filter(bookmark => bookmark.id !== deleteModal.itemId));

        // If current page becomes empty, go to previous page
        if (bookmarks.length === 1 && page > 1) {
          setPage(page - 1);
        }
      } catch (err) {
        console.error("Error deleting bookmark:", err);
      } finally {
        setDeleteModal({
          isOpen: false,
          itemId: null,
        });
      }
    }
  };

  // Function to close modal
  const handleCloseModal = () => {
    setDeleteModal({
      isOpen: false,
      itemId: null,
    });
  };

  const startIndex = (page - 1) * itemsPerPage;
  const paged = bookmarks;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
        <span className="ml-3 text-lg">Loading bookmarks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
        {error}
        <button
          onClick={fetchBookmarks}
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
                Training name
              </th>
              <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"
                }`}>
                Module
              </th>
              <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"
                }`}>
                LOS
              </th>
              <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"
                }`}>
                Actions
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
                  <div className="line-clamp-2">{r.training_name}</div>
                </td>
                <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                  }`}>
                  <div className="line-clamp-2">{r.subject_name}</div>
                </td>
                <td className={`py-4 px-4 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-900"
                  }`}>
                  <div className="line-clamp-2">{r.los_title}</div>
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
                  colSpan={4}
                  className={`py-8 text-center ${isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                >
                  No bookmarks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {bookmarks.length > 0 && (
        <div className="mt-6 flex items-center justify-center">
          <div className="flex flex-wrap items-center gap-2">
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