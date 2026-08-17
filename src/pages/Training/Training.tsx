// TrainingGrid.tsx
import React, { useMemo, useState, useEffect } from "react";
import { FaRegClock, FaSpinner } from "react-icons/fa";
import PageShell from "../../components/PageShell";
import { useTheme } from "../../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { apiService } from "../../services/apiService";
import type { Training, Status } from "../../types/trainingTypes";

// Helper function to determine status from API response
const getTrainingStatus = (progress: number, isBookmarked?: boolean): Status => {
  if (progress === 100) return "complete";
  if (progress > 0) return "ongoing";
  if (isBookmarked) return "saved";
  if (isBookmarked) return "saved";
  return "saved"; // default for saved trainings
};

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

export const Trainings: React.FC = () => {
  const { isDark } = useTheme();
  const [tab, setTab] = useState<Status>("saved");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const perPage = 6;
  const navigate = useNavigate();

  // Fetch all trainings
  const fetchTrainings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: apiError } = await apiService.get<any>(
        "/EducationAndInternship/Student/trainings"
      );

      if (apiError) {
        setError(apiError);
        return;
      }

      if (data?.success && data.data) {
        const trainingData = data.data.studentTrainings || data.data.data || data.data.trainings || data.data;
        const transformedTrainings: Training[] = Array.isArray(trainingData)
          ? trainingData.map((training: any) => ({
            id: training.id?.toString() || training.training_id?.toString() || Math.random().toString(),
            trainingId: training.training_id || training.id,
            title: training.title || training.training_name || training.training_title || "NA",
            durationHours: parseInt(training.duration) || training.duration_hours || 30,
            progress: training.progress_percentage || training.progress || 0,
            status: getTrainingStatus(training.progress_percentage || training.progress || 0, training.is_bookmarked),
            thumbnail: training.image_url || (training.image ? (training.image.startsWith('http') ? training.image : `${import.meta.env.VITE_IMAGE_BASE_URL || ""}/uploads/trainings/${training.image}`) : (training.thumbnail_url || "/1754650703 1.png")),
            subjectID: training.subject_id,
            subject_name: training.subject_name,
            training_name: training.training_name || training.title,
          }))
          : [];

        setTrainings(transformedTrainings);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load trainings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  // Get trainings for current tab
  const filtered = useMemo(() => {
    switch (tab) {
      case "saved":
      default:
        return trainings;
    }
  }, [tab, trainings]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  // reset page when tab changes
  React.useEffect(() => setPage(1), [tab]);

  // Function to handle Continue Reading click
  const handleContinueReading = (trainingId: string, training?: Training) => {
    navigate(`/training/${trainingId}`, { state: { training } });
  };

  if (loading) {
    return (
      <div className={`rounded-[14px] p-6 card ${isDark ? "bg-gray-800" : "bg-white"}`}
        style={{ boxShadow: "0px 0px 24px 0px #00000014" }}>
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
          <span className="ml-3 text-lg">Loading trainings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-[14px] p-6 card ${isDark ? "bg-gray-800" : "bg-white"}`}
        style={{ boxShadow: "0px 0px 24px 0px #00000014" }}>
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
          {error}
          <button
            onClick={fetchTrainings}
            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-[14px] p-6 card ${isDark ? "bg-gray-800" : "bg-white"}`}
      style={{ boxShadow: "0px 0px 24px 0px #00000014" }}>
      <div className="">
        <div className="flex justify-between mb-5">
          <PageShell title="All Trainings" breadcrumb={["Home", "All Trainings"]} />
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <button
                key="saved"
                onClick={() => setTab("saved")}
                className={`px-4 py-2 rounded-full text-sm border cursor-pointer transition-colors ${isDark
                  ? "bg-blue-900/30 border-blue-700 text-blue-300"
                  : "bg-blue-50 border-blue-200 text-blue-700"
                  }`}
              >
                Trainings ({trainings.length})
              </button>
            </div>
          </div>
        </div>

        <main className="">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pageItems.length === 0 ? (
              <div className="col-span-3 flex flex-col items-center justify-center py-10">

                <h2 className="text-2xl font-bold text-gray-400 mb-4 uppercase">
                  NO COURSE FOUND
                </h2>
              </div>
            ) : (
              pageItems.map((training) => (
                <article
                  key={training.id}
                  className={`border rounded-[14px] p-3 hover:shadow-lg transition-shadow duration-300 ${isDark ? "border-gray-700 bg-gray-800 hover:bg-gray-750" : "border-[#EBE8E8] bg-white hover:bg-gray-50"
                    }`}
                >
                  <div className="gap-3">
                    <div className={`h-[160px] sm:h-[170px] md:h-[190px] flex items-center justify-center border rounded overflow-hidden ${isDark ? "border-gray-600 bg-gray-700" : "border-[#EBE8E8] bg-gray-50"
                      }`}>
                      <img
                        src={training.thumbnail || "/1754650703 1.png"}
                        alt={training.title}
                        className="h-full w-full object-contain"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/1754650703 1.png";
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className={`mt-4 text-[16px] font-bold line-clamp-2 h-12 ${isDark ? "text-white" : "text-gray-800"
                        }`}>
                        {training.title}
                      </h3>

                      {training.progress > 0 && (
                        <div className="flex items-center gap-3 mt-3">
                          <div className={`text-xs font-semibold mb-1 ${isDark ? "text-gray-300" : "text-gray-700"
                            }`}>
                            {training.progress}%
                          </div>

                          <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-gray-600" : "bg-gray-100"
                            }`}>
                            <div
                              style={{
                                width: `${training.progress}%`,
                                backgroundColor: "#008DD2",
                              }}
                              className="h-2 rounded-full"
                            />
                          </div>
                        </div>
                      )}

                      <div className={`flex items-center text-sm gap-2 mt-3 ${isDark ? "text-gray-300" : "text-gray-600"
                        }`}>
                        <FaRegClock size={14} color="#008DD2" /> Duration:{" "}
                        <span className={`font-bold ${isDark ? "text-white" : "text-gray-900"
                          }`}>
                          {training.durationHours} Hours
                        </span>
                      </div>

                      <button
                        onClick={() => handleContinueReading(training.id, training)}
                        className={`mt-3 w-full text-sm font-semibold border rounded-[6px] py-2 cursor-pointer transition-colors duration-200 ${isDark
                          ? "border-[#60a5fa] text-[#60a5fa] hover:bg-blue-900/30"
                          : "border-[#00467A] text-[#00467A] hover:bg-blue-50"
                          }`}
                      >
                        {training.progress === 100 ? "View Training" : "Continue Reading"}
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Showing {pageItems.length} of {filtered.length} trainings
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
          )}
        </main>
      </div>
    </div>
  );
};