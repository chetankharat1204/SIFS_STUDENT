import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { ChevronLeft, Info, AlertCircle } from "lucide-react";
import { apiService } from "../../services/apiService";

type Guideline = {
  id: number;
  text: string;
};

export const ExamGuidelinesPage: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // State management
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");



  // Fetch guidelines from API
  const fetchGuidelines = async () => {
    try {
      setIsLoading(true);
      setError("");

      // API call to fetch exam guidelines
      const { data, error: apiError } = await apiService.get<any>(
        "/EducationAndInternship/Student/exam/guideline"
      );

      if (apiError) {
        setError(apiError);
        return;
      }

      if (data?.success && data.data) {
        const apiData = data.data;
        let guidelinesData: any[] = [];

        // Extract guidelines from various possible response structures
        if (Array.isArray(apiData)) {
          guidelinesData = apiData;
        } else if (apiData.data && Array.isArray(apiData.data)) {
          guidelinesData = apiData.data;
        } else if (apiData.guidelines && Array.isArray(apiData.guidelines)) {
          guidelinesData = apiData.guidelines;
        } else if (typeof apiData === 'object') {
          guidelinesData = [apiData];
        }

        // Transform API data
        const transformedGuidelines = guidelinesData
          .map((item: any, index: number) => {
            const text = item.text || item.description || item.guideline || "";
            const id = item.id || item.guideline_id || (index + 1);

            return {
              id: Number(id),
              text: String(text)
            };
          })
          .filter((item: Guideline) => item.text && item.text.trim() !== "");

        setGuidelines(transformedGuidelines);
      } else {
        setError(data?.message || "Failed to load guidelines");
      }

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch guidelines on component mount
  useEffect(() => {
    fetchGuidelines();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full p-2 sm:p-4 lg:p-0">
        <div
          className="rounded-2xl p-4 sm:p-6 card"
          style={{ boxShadow: "0px 0px 24px 0px #00000014" }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                Exam Guidelines
              </h1>
              <div className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Home &gt; Exam Guidelines
              </div>
            </div>
            <button
              onClick={() => navigate("/exams")}
              className={`flex items-center justify-center rounded-full font-bold px-4 py-2 text-xs sm:text-sm w-fit transition-all ${isDark ? "bg-[#2e415f] text-[#93c5fd] hover:bg-[#334155]" : "bg-[#ECF2FE] text-[#3E80F9]"
                }`}
            >
              <ChevronLeft size={16} /> Back
            </button>
          </div>
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full p-2 sm:p-4 lg:p-0">
        <div
          className="rounded-2xl p-4 sm:p-6 card"
          style={{ boxShadow: "0px 0px 24px 0px #00000014" }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                Exam Guidelines
              </h1>
              <div className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Home &gt; Exam Guidelines
              </div>
            </div>
            <button
              onClick={() => navigate("/exams")}
              className={`flex items-center justify-center rounded-full font-bold px-4 py-2 text-xs sm:text-sm w-fit transition-all ${isDark ? "bg-[#2e415f] text-[#93c5fd] hover:bg-[#334155]" : "bg-[#ECF2FE] text-[#3E80F9]"
                }`}
            >
              <ChevronLeft size={16} /> Back
            </button>
          </div>
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
            <p className="font-semibold">Error Loading Guidelines</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={fetchGuidelines}
              className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-2 sm:p-4 lg:p-0 animate-in fade-in duration-500">
      <div
        className="rounded-2xl overflow-hidden card"
        style={{ boxShadow: "0px 0px 24px 0px #00000014" }}
      >
        {/* Header Section */}
        <div className={`p-6 border-b ${isDark ? "border-gray-700 bg-gray-800/50" : "border-gray-100 bg-gray-50/50"}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                <Info size={24} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  Exam Guidelines
                </h1>
                <div className={`text-sm mt-1 flex items-center gap-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Home <span className="text-gray-300">/</span> <span className="text-blue-500 font-medium">Exam Guidelines</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate("/exams")}
              className={`flex items-center justify-center rounded-xl font-bold px-5 py-2.5 text-sm transition-all shadow-sm ${isDark
                ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
            >
              <ChevronLeft size={18} className="mr-1" /> Back to Dashboard
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-8">
          <div className={`rich-text-content ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            {guidelines.length > 0 ? (
              <div className="space-y-6">
                {guidelines.map((item) => (
                  <div
                    key={item.id}
                    className="relative pl-0"
                    dangerouslySetInnerHTML={{ __html: item.text }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
                  <AlertCircle size={32} className="text-gray-400" />
                </div>
                <p className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  No guidelines available
                </p>
              </div>
            )}
          </div>


        </div>


      </div>
    </div>
  );
};