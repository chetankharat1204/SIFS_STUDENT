import { useState } from "react";
import { Trash2 } from 'lucide-react';
import { useTheme } from "../../../contexts/ThemeContext"; // Adjust path as needed

// Mock data for notes
const notesData = [
  {
    id: 1,
    courseName: "Advanced Certificate Course Forensic Science and Criminal Investigation",
    module: "Module 1 - Introduction to Forensic Science",
    los: "History",
    note: "Document",
    action: "View"
  },
  {
    id: 2,
    courseName: "Advanced Certificate Course Forensic Science and Criminal Investigation",
    module: "Module 1 - Introduction to Forensic Science",
    los: "Introduction",
    note: "Document",
    action: "View"
  },
  {
    id: 3,
    courseName: "Advanced Certificate Course Forensic Science and Criminal Investigation",
    module: "Module 1 - Introduction to Forensic Science",
    los: "Introduction for fore...",
    note: "Forensic",
    action: "View"
  },
  {
    id: 4,
    courseName: "UGC NET Learning Program | Paper I",
    module: "Unit - I Teaching Aptitude",
    los: "Teaching",
    note: "Document",
    action: "View"
  },
  {
    id: 5,
    courseName: "Advanced Certificate Course in Questioned Document and Fingerprint Exa..",
    module: "Module 1 - Introduction to Forensic Science",
    los: "Principle and Signific...",
    note: "Forensic",
    action: "View"
  },
  {
    id: 6,
    courseName: "Advanced Certificate Course Forensic Science and Criminal Investigation",
    module: "Module 1 - Introduction to Forensic Science",
    los: "History",
    note: "Forensic",
    action: "View"
  },
  {
    id: 7,
    courseName: "Advanced Certificate Course Forensic Science and Criminal Investigation",
    module: "Module 1 - Introduction to Forensic Science",
    los: "Introduction",
    note: "Document",
    action: "View"
  },
  {
    id: 8,
    courseName: "Advanced Certificate Course Forensic Science and Criminal Investigation",
    module: "Module 1 - Introduction to Forensic Science",
    los: "Introduction for fore...",
    note: "Forensic",
    action: "View"
  },
  {
    id: 9,
    courseName: "UGC NET Learning Program | Paper I",
    module: "Unit - I Teaching Aptitude",
    los: "Teaching",
    note: "Forensic",
    action: "View"
  }
];

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
            Delete Note
          </h3>
          <p className={`text-sm mb-6 ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}>
            Are you sure you want to delete this note? This action cannot be undone.
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

export default function NotesPage() {
  const [page, setPage] = useState(1);
  const [notes, setNotes] = useState(notesData);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    itemId: number | null;
  }>({
    isOpen: false,
    itemId: null,
  });
  const { isDark } = useTheme();
  
  const itemsPerPage = 5;
  
  const totalItems = notes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const startIndex = (page - 1) * itemsPerPage;
  const paged = notes.slice(startIndex, startIndex + itemsPerPage);

  // Function to open delete confirmation modal
  const handleDeleteClick = (id: number) => {
    setDeleteModal({
      isOpen: true,
      itemId: id,
    });
  };

  // Function to handle confirmed delete
  const handleConfirmDelete = () => {
    if (deleteModal.itemId) {
      setNotes(prev => prev.filter(note => note.id !== deleteModal.itemId));
      setDeleteModal({
        isOpen: false,
        itemId: null,
      });
    }
  };

  // Function to close modal
  const handleCloseModal = () => {
    setDeleteModal({
      isOpen: false,
      itemId: null,
    });
  };

  return (
    <div className="mx-auto rounded-lg">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className={`text-left text-[16px] font-semibold rounded-2xl ${
              isDark ? "bg-gray-800" : "bg-[#F8F8F8]"
            }`}>
              <th className={`py-3 px-4 ${
                isDark ? "text-gray-300" : "text-gray-900"
              }`}>
                Course name
              </th>
              <th className={`py-3 px-4 ${
                isDark ? "text-gray-300" : "text-gray-900"
              }`}>
                Module
              </th>
              <th className={`py-3 px-4 ${
                isDark ? "text-gray-300" : "text-gray-900"
              }`}>
                LOS
              </th>
              <th className={`py-3 px-4 ${
                isDark ? "text-gray-300" : "text-gray-900"
              }`}>
                Note
              </th>
              <th className={`py-3 px-4 ${
                isDark ? "text-gray-300" : "text-gray-900"
              }`}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {paged.map((r) => (
              <tr 
                key={r.id} 
                className={`border-b last:border-b hover:bg-gray-50 ${
                  isDark 
                    ? "border-gray-700 hover:bg-gray-800" 
                    : "border-[#D9D9D9] hover:bg-gray-50"
                }`}
              >
                <td className={`py-4 px-4 text-sm font-semibold ${
                  isDark ? "text-gray-300" : "text-gray-900"
                }`}>
                  {r.courseName}
                </td>
                <td className={`py-4 px-4 text-sm font-semibold ${
                  isDark ? "text-gray-300" : "text-gray-900"
                }`}>
                  {r.module}
                </td>
                <td className={`py-4 px-4 text-sm font-semibold ${
                  isDark ? "text-gray-300" : "text-gray-900"
                }`}>
                  {r.los}
                </td>
                <td className={`py-4 px-4 text-sm font-semibold max-w-xs ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}>
                  <div className="line-clamp-2">
                    {r.note}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <button className="inline-flex items-center px-4 py-1 rounded-full bg-[#008DD2] text-white font-semibold text-[12px] border border-[#008DD2] hover:bg-white hover:text-[#008DD2] cursor-pointer transition-all duration-200">
                      {r.action}
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
                  colSpan={5} 
                  className={`py-8 text-center ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  No notes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-center">
        <div className="flex flex-wrap items-center gap-2">
          {/* Previous button */}
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`px-3 py-1 text-sm rounded-md border ${
              page === 1 
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
                className={`px-3 py-1 ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p as number)}
                className={`px-3 py-1 rounded-md text-sm border font-semibold ${
                  p === page
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
            className={`px-3 py-1 text-sm rounded-md border ${
              page === totalPages 
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