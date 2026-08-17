import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { ChevronLeft } from "lucide-react";
import { apiService } from "../../services/apiService";

type GuidelineData = {
  quiz_title: string;
  quiz_guideline: string;
};

export const TestGuidelinesPage: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // State management
  const [data, setData] = useState<GuidelineData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Fetch guidelines from API
  const fetchGuidelines = async () => {
    try {
      setIsLoading(true);
      setError("");

      const { data: responseData, error: apiError } = await apiService.get<any>(
        "/EducationAndInternship/Student/quiz/guideline"
      );

      if (apiError) {
        setError(apiError);
        return;
      }

      if (responseData?.success && responseData.data) {
        setData(responseData.data);
      } else {
        setError(responseData?.message || "Failed to load test guidelines");
      }

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuidelines();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full p-2 sm:p-4 lg:p-0">
        <div className="rounded-2xl p-4 sm:p-6 card" style={{ boxShadow: "0px 0px 24px 0px #00000014" }}>
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-2 sm:p-4 lg:p-0">
        <div className="rounded-2xl p-4 sm:p-6 card" style={{ boxShadow: "0px 0px 24px 0px #00000014" }}>
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
            <p>{error}</p>
            <button onClick={fetchGuidelines} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-2 sm:p-4 lg:p-0">
      <div className="rounded-2xl p-4 sm:p-6 card" style={{ boxShadow: "0px 0px 24px 0px #00000014" }}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
              {data?.quiz_title || "Test Guidelines"}
            </h1>
            <div className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Home &gt; {data?.quiz_title || "Test Guidelines"}
            </div>
          </div>

          <button
            onClick={() => navigate("/tests")}
            className={`flex items-center justify-center rounded-full font-bold px-4 py-2 text-xs sm:text-sm w-fit transition-all ${isDark
              ? "bg-[#2e415f] text-[#93c5fd] hover:bg-[#334155]"
              : "bg-[#ECF2FE] text-[#3E80F9]"
              }`}
          >
            <ChevronLeft size={16} /> Back
          </button>
        </div>

        {/* Content */}
        <div className={`prose max-w-none ${isDark ? "prose-invert" : ""}`}>
          <div
            className={`text-sm leading-relaxed ${isDark ? "text-gray-300" : "text-gray-900"}`}
            dangerouslySetInnerHTML={{ __html: data?.quiz_guideline || "<p>No guidelines available.</p>" }}
          />
        </div>
      </div>
    </div>
  );
};