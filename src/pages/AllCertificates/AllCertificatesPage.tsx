import React, { useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { apiService } from "../../services/apiService";
import toast from "react-hot-toast";
import { formatDate } from "../../utils/dateUtils";

type Certificate = {
  id: number;
  certificate_id?: number;
  course_id: number;
  course_name?: string;
  courseName?: string;
  course_code?: string;
  date: string; // created_at or issue_date
  issue_date?: string;
  file_url?: string;
  is_correction_pending?: number;
  is_correction?: number;
  is_hardcopy?: number;
  [key: string]: any;
};

const ITEMS_PER_PAGE = 10; // User request limit=10

export const AllCertificatesPage: React.FC = () => {
  const { isDark } = useTheme();

  // State
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);

  // Correction Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCertId, setSelectedCertId] = useState<number | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [correctionText, setCorrectionText] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch Certificates
  const fetchCertificates = async (pageNum: number) => {
    setLoading(true);
    // Passing default sort params as per user request example, though usually basic get is enough
    const { data, error } = await apiService.get<any>(`/EducationAndInternship/Student/certificates?page=${pageNum}&limit=${ITEMS_PER_PAGE}&search=&sortBy=issue_date&sortOrder=desc`);

    if (data && data.success) {
      // Adjust based on API structure found in previous tasks (Marksheet was data.data.data)
      const list = data.data.certificates || data.data.studentCertificates || data.data.data || data.data.result || [];
      setCertificates(Array.isArray(list) ? list : []);

      // If pagination exists
      const pagination = data.data.pagination;
      if (pagination) {
        setTotalPages(pagination.total_pages || pagination.totalPages || 1);
      }
    } else {
      console.error("Error fetching certificates:", error);
      toast.error(error || "Failed to fetch certificates");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCertificates(page);
  }, [page]);

  // Handle View Certificate
  const handleViewCertificate = (fileUrl: string) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    } else {
      toast.error("File URL not available.");
    }
  };

  // Handle Request Correction
  const handleRequestCorrection = (cert: Certificate) => {
    // Prefer certificate_id if available, else id
    const certId = cert.certificate_id || cert.id;
    setSelectedCertId(certId);
    setSelectedCourseId(cert.course_id);
    setCorrectionText("");
    setIsModalOpen(true);
  };

  const submitCorrection = async () => {
    if (!selectedCertId || !correctionText.trim()) return;

    setSubmitting(true);
    const payload = {
      certificate_id: selectedCertId,
      course_id: selectedCourseId,
      correction: correctionText
    };

    const { data, error } = await apiService.post<any>('/EducationAndInternship/Student/certificates/correction', payload);

    if (data && data.success) {
      toast.success("Correction requested successfully.");
      setIsModalOpen(false);
      setCorrectionText("");
      setSelectedCertId(null);
      setSelectedCourseId(null);
      fetchCertificates(page);
    } else {
      toast.error("Failed to request correction: " + (error || "Unknown error"));
    }
    setSubmitting(false);
  };

  // Handle Request Hard Copy
  const handleRequestHardCopy = async (cert: Certificate) => {
    if (!window.confirm("Are you sure you want to request a hard copy of this certificate?")) return;

    const certId = cert.certificate_id || cert.id;
    const { data, error } = await apiService.post<any>('/EducationAndInternship/Student/certificates/hardcopy', {
      certificate_id: certId
    });

    if (data && data.success) {
      toast.success(data.message || "Hard copy requested successfully.");
      fetchCertificates(page);
    } else {
      toast.error(error || "Failed to request hard copy.");
    }
  };


  // Helper to create pagination list with ellipsis
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

  return (
    <div className="w-full p-2 sm:p-4 lg:p-0 relative">
      <div
        className="rounded-2xl p-4 sm:p-6 card"
        style={{ boxShadow: "0px 0px 24px 0px #00000014" }}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className={`text-xl md:text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"
              }`}>
              All Certificates
            </h1>
            <div className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"
              }`}>
              Home &gt; Certificates
            </div>
          </div>
        </div>

        {/* Desktop Table (md and up) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className={`text-left text-[14px] lg:text-[16px] font-semibold ${isDark ? "bg-gray-800" : "bg-[#F8F8F8]"
                }`}>
                <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"
                  }`}>
                  Course Name
                </th>
                <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"
                  }`}>
                  Date
                </th>
                <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"
                  }`}>
                  View
                </th>
                <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"
                  }`}>
                  Correction
                </th>
                <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-900"
                  }`}>
                  Hard Copy
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
              ) : certificates.map((r) => (
                <tr
                  key={r.id || Math.random()}
                  className={`border-b last:border-b hover:bg-gray-50 ${isDark
                    ? "border-gray-700 hover:bg-gray-800"
                    : "border-[#D9D9D9] hover:bg-gray-50"
                    }`}
                >
                  <td className={`py-4 px-4 text-sm font-semibold whitespace-nowrap ${isDark ? "text-gray-300" : "text-gray-900"
                    }`}>
                    {r.course_name || r.courseName || r.course_code || "N/A"}
                  </td>
                  <td className={`py-4 px-4 text-sm font-semibold whitespace-nowrap ${isDark ? "text-gray-300" : "text-gray-900"
                    }`}>
                    {formatDate(r.issue_date || r.date || r.created_at)}
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    <button
                      onClick={() => handleViewCertificate(r.file_url || "")}
                      className="inline-flex items-center px-4 py-1 rounded-full bg-[#E28F1D33] text-[#E28F1D] font-semibold text-[12px] border border-[#E28F1D] hover:bg-[#E28F1D] hover:text-white cursor-pointer transition-all"
                    >
                      View Certificate
                    </button>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <button
                      onClick={() => !r.is_correction_pending && !r.is_correction && handleRequestCorrection(r)}
                      disabled={!!r.is_correction_pending || !!r.is_correction}
                      className={`inline-flex items-center px-4 py-1 rounded-full font-semibold text-[12px] border transition-all ${r.is_correction_pending || r.is_correction
                        ? "bg-yellow-100 text-yellow-700 border-yellow-200 cursor-not-allowed"
                        : "bg-[#008DD2] text-white border-[#008DD2] hover:bg-white hover:text-[#008DD2] cursor-pointer"
                        }`}
                    >
                      {r.is_correction_pending || r.is_correction ? "Request Sent" : "Request For Correction"}
                    </button>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <button
                      onClick={() => !r.is_hardcopy && handleRequestHardCopy(r)}
                      disabled={!!r.is_hardcopy}
                      className={`inline-flex items-center px-4 py-1 rounded-full font-semibold text-[12px] border transition-all ${r.is_hardcopy
                        ? "bg-yellow-100 text-yellow-700 border-yellow-200 cursor-not-allowed"
                        : "bg-white text-[#24A8B5] border-[#24A8B5] hover:bg-[#24A8B5] hover:text-white cursor-pointer"
                        }`}
                    >
                      {r.is_hardcopy ? "Request Sent" : "Request For Hard Copy"}
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && certificates.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className={`py-8 text-center ${isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                  >
                    No certificates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Cards) */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : certificates.map((r) => (
            <div
              key={r.id || Math.random()}
              className={`border rounded-xl p-4 shadow-sm card ${isDark ? "border-gray-700" : "border-gray-200"
                }`}
            >
              <div className="flex flex-col gap-3 text-sm">
                <p className={isDark ? "text-gray-300" : "text-gray-900"}>
                  <span className="font-semibold">Course Name:</span> {r.course_name || r.courseName || r.course_code || "N/A"}
                </p>
                <p className={isDark ? "text-gray-300" : "text-gray-900"}>
                  <span className="font-semibold">Date:</span> {formatDate(r.issue_date || r.date || r.created_at)}
                </p>

                <div className="flex flex-col space-y-2 mt-2">
                  <button
                    onClick={() => handleViewCertificate(r.file_url || "")}
                    className="w-full px-4 py-2 text-sm rounded-full bg-[#E28F1D33] text-[#E28F1D] font-semibold border border-[#E28F1D] hover:bg-[#E28F1D] hover:text-white transition-all"
                  >
                    View Certificate
                  </button>
                  <button
                    onClick={() => !r.is_correction_pending && !r.is_correction && handleRequestCorrection(r)}
                    disabled={!!r.is_correction_pending || !!r.is_correction}
                    className={`w-full px-4 py-2 text-sm rounded-full font-semibold border transition-all ${r.is_correction_pending || r.is_correction
                      ? "bg-yellow-100 text-yellow-700 border-yellow-200 cursor-not-allowed"
                      : "bg-[#008DD2] text-white border-[#008DD2] hover:bg-white hover:text-[#008DD2]"
                      }`}
                  >
                    {r.is_correction_pending || r.is_correction ? "Request Sent" : "Request For Correction"}
                  </button>
                  <button
                    onClick={() => !r.is_hardcopy && handleRequestHardCopy(r)}
                    disabled={!!r.is_hardcopy}
                    className={`w-full px-4 py-2 text-sm rounded-full font-semibold border transition-all ${r.is_hardcopy
                      ? "bg-yellow-100 text-yellow-700 border-yellow-200 cursor-not-allowed"
                      : "bg-white text-[#24A8B5] border-[#24A8B5] hover:bg-[#24A8B5] hover:text-white"
                      }`}
                  >
                    {r.is_hardcopy ? "Request Sent" : "Request For Hard Copy"}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!loading && certificates.length === 0 && (
            <div className={`py-8 text-center ${isDark ? "text-gray-400" : "text-gray-500"
              }`}>
              No certificates found.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
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
      </div>

      {/* Request Correction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl shadow-xl transform transition-all ${isDark ? "bg-gray-800" : "bg-white"
            }`}>
            <div className={`flex justify-between items-center p-4 border-b ${isDark ? "border-gray-700" : "border-gray-200"
              }`}>
              <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-700"
                }`}>
                Request for Correction
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`text-gray-400 hover:text-gray-600 ${isDark ? "hover:text-gray-200" : ""}`}
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <label className={`block mb-2 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"
                }`}>
                Corrections **
              </label>
              <textarea
                rows={6}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                  }`}
                value={correctionText}
                onChange={(e) => setCorrectionText(e.target.value)}
                placeholder="Enter correction details..."
              ></textarea>
            </div>

            <div className={`flex justify-end gap-3 p-4 border-t ${isDark ? "border-gray-700" : "border-gray-200"
              }`}>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-[#6E3F9F] text-white rounded hover:bg-[#5C3486] transition-colors"
              >
                Close
              </button>
              <button
                onClick={submitCorrection}
                disabled={submitting}
                className={`px-4 py-2 bg-[#5A67D8] text-white rounded hover:bg-[#4C54B8] transition-colors ${submitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
