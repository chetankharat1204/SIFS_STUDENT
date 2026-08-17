import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { ChevronLeft } from "lucide-react";
import { apiService } from "../../services/apiService"; // Adjust path as needed

type Guideline = {
  id: number;
  text: string;
};

const AssignmentsGuidelines: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // State management
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [pageTitle, setPageTitle] = useState<string>("Assignment Guidelines");
  const [description, setDescription] = useState<string>("Follow the given instructions to complete your assignment.");

  // Fetch guidelines from API
  const fetchGuidelines = async () => {
    try {
      setIsLoading(true);
      setError("");

      // API call to fetch guidelines
      const { data, error: apiError } = await apiService.get<any>(
        "/EducationAndInternship/Student/assignment/guideline"
      );

      if (apiError) {
        setError(apiError);
        setIsLoading(false);
        return;
      }

      // Check if API response is successful
      if (data?.success) {
        // Process the API response
        const apiData = data.data || data;

        // Extract guidelines from various possible response structures
        let guidelinesData: any[] = [];

        if (Array.isArray(apiData)) {
          // If data is directly an array
          guidelinesData = apiData;
        } else if (apiData.data && Array.isArray(apiData.data)) {
          // If data is nested in 'data' property
          guidelinesData = apiData.data;
        } else if (apiData.guidelines && Array.isArray(apiData.guidelines)) {
          // If data is in 'guidelines' property
          guidelinesData = apiData.guidelines;
        } else if (apiData.rules && Array.isArray(apiData.rules)) {
          // If data is in 'rules' property
          guidelinesData = apiData.rules;
        } else if (typeof apiData === 'object' && !Array.isArray(apiData)) {
          // If it's a single object, convert to array
          guidelinesData = [apiData];
        }

        // Transform API data to match our Guideline type
        const transformedGuidelines: Guideline[] = guidelinesData.map((item: any, index: number) => {
          // Extract text from various possible fields
          const text = item.text || item.description || item.guideline || item.rule || item.content || "";

          // Extract ID from various possible fields
          const id = item.id || item.guideline_id || item.rule_id || (index + 1);

          return {
            id: Number(id),
            text: String(text)
          };
        }).filter((item: Guideline) => item.text.trim() !== ""); // Filter out empty guidelines

        // Set the transformed guidelines
        if (transformedGuidelines.length > 0) {
          setGuidelines(transformedGuidelines);
        } else {
          // Fallback to default guidelines if API returns empty
          setGuidelines([
            {
              id: 1,
              text: "No guidelines available from the server. Please contact support."
            }
          ]);
        }

        // Set page title and description if available in API response
        if (apiData.title) {
          setPageTitle(apiData.title);
        }
        if (apiData.description) {
          setDescription(apiData.description);
        }

      } else {
        // Handle non-successful response
        setError(data?.message || "Failed to load guidelines");
        // Fallback to empty state
        setGuidelines([]);
      }

    } catch (err: any) {
      console.error("Error fetching guidelines:", err);
      setError(err.message || "An unexpected error occurred");
      // Fallback to empty state on error
      setGuidelines([]);
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
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1
                className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                {pageTitle}
              </h1>
              <div
                className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"
                  }`}
              >
                Home &gt; {pageTitle}
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={() => navigate("/assignments")}
              className={`flex items-center justify-center rounded-full font-bold px-4 py-2 text-xs sm:text-sm w-fit transition-all ${isDark
                ? "bg-[#2e415f] text-[#93c5fd] hover:bg-[#334155]"
                : "bg-[#ECF2FE] text-[#3E80F9]"
                }`}
            >
              <ChevronLeft size={16} />  Back
            </button>
          </div>

          {/* Loading Content */}
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
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1
                className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                {pageTitle}
              </h1>
              <div
                className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"
                  }`}
              >
                Home &gt; {pageTitle}
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={() => navigate("/assignments")}
              className={`flex items-center justify-center rounded-full font-bold px-4 py-2 text-xs sm:text-sm w-fit transition-all ${isDark
                ? "bg-[#2e415f] text-[#93c5fd] hover:bg-[#334155]"
                : "bg-[#ECF2FE] text-[#3E80F9]"
                }`}
            >
              <ChevronLeft size={16} />  Back
            </button>
          </div>

          {/* Error Message */}
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

  // Empty state
  if (guidelines.length === 0) {
    return (
      <div className="w-full p-2 sm:p-4 lg:p-0">
        <div
          className="rounded-2xl p-4 sm:p-6 card"
          style={{ boxShadow: "0px 0px 24px 0px #00000014" }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1
                className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                {pageTitle}
              </h1>
              <div
                className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"
                  }`}
              >
                Home &gt; {pageTitle}
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={() => navigate("/assignments")}
              className={`flex items-center justify-center rounded-full font-bold px-4 py-2 text-xs sm:text-sm w-fit transition-all ${isDark
                ? "bg-[#2e415f] text-[#93c5fd] hover:bg-[#334155]"
                : "bg-[#ECF2FE] text-[#3E80F9]"
                }`}
            >
              <ChevronLeft size={16} />  Back
            </button>
          </div>

          {/* Empty State */}
          <div className="text-center py-10">
            <p className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              No guidelines available.
            </p>
            <button
              onClick={fetchGuidelines}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main render with API data
  return (
    <div className="w-full p-2 sm:p-4 lg:p-0">
      <div
        className="rounded-2xl p-4 sm:p-6 card"
        style={{ boxShadow: "0px 0px 24px 0px #00000014" }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1
              className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"
                }`}
            >
              {pageTitle}
            </h1>
            <div
              className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"
                }`}
            >
              Home &gt; {pageTitle}
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate("/assignments")}
            className={`flex items-center justify-center rounded-full font-bold px-4 py-2 text-xs sm:text-sm w-fit transition-all ${isDark
              ? "bg-[#2e415f] text-[#93c5fd] hover:bg-[#334155]"
              : "bg-[#ECF2FE] text-[#3E80F9]"
              }`}
          >
            <ChevronLeft size={16} />  Back
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"
              }`}
          >
            {description}
          </p>

          {guidelines.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col gap-2 p-4 rounded-xl border ${isDark
                ? "border-gray-700 bg-gray-900"
                : "border-[#D9D9D9] bg-white"
                }`}
            >
              <div
                className={`text-sm leading-relaxed ${isDark ? "text-gray-300" : "text-gray-900"
                  }`}
                dangerouslySetInnerHTML={{ __html: item.text }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssignmentsGuidelines;