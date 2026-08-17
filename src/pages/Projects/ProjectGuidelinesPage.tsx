import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import {
  ChevronLeft,
  FileText,
  BookOpen,
  Settings,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { apiService } from "../../services/apiService";

/* ---------------- Section Card ---------------- */
const SectionCard = ({
  icon: Icon,
  title,
  children,
  isDark,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
  isDark: boolean;
}) => (
  <div
    className={`rounded-xl border p-5 ${isDark
      ? "bg-[#0f172a]/40 border-white/10"
      : "bg-white border-gray-100"
      }`}
  >
    <div className="flex items-center gap-3 mb-3">
      <div
        className={`p-2 rounded-lg ${isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"
          }`}
      >
        <Icon size={18} />
      </div>
      <h3
        className={`font-semibold ${isDark ? "text-white" : "text-gray-800"
          }`}
      >
        {title}
      </h3>
    </div>

    <div
      className={`text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"
        }`}
    >
      {children}
    </div>
  </div>
);

/* ---------------- Page ---------------- */
export const ProjectGuidelinesPage: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // State management
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [guidelineData, setGuidelineData] = useState<any>({
    intro: "",
    project: [],
    reviewPaper: [],
    format: [],
    evaluation: [],
    note: []
  });

  // Helper function to strip HTML tags if needed
  const stripHtml = (html: string) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  // Fetch guidelines from API
  const fetchGuidelines = async () => {
    try {
      setIsLoading(true);
      setError("");

      // API call to fetch project guidelines
      const { data, error: apiError } = await apiService.get<any>(
        "/EducationAndInternship/Student/project/guideline"
      );

      if (apiError) {
        setError(apiError);
        return;
      }

      if (data?.success && data.data) {
        const apiData = data.data;

        // Extract data from various possible response structures
        let projectData: any = {
          intro: "",
          project: [],
          reviewPaper: [],
          format: [],
          evaluation: [],
          note: []
        };

        // Parse HTML content from guideline field
        if (apiData.guideline) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(apiData.guideline, 'text/html');

          // Extract intro text (first div without bold heading)
          const allDivs = doc.querySelectorAll('div');
          if (allDivs.length > 0) {
            const firstDiv = allDivs[0];
            if (!firstDiv.querySelector('b')) {
              projectData.intro = firstDiv.textContent?.trim() || "";
            }
          }

          // Helper function to extract list items from a section
          const extractListItems = (heading: string): string[] => {
            const items: string[] = [];
            const boldElements = doc.querySelectorAll('b');

            for (const bold of boldElements) {
              if (bold.textContent?.trim().toLowerCase().includes(heading.toLowerCase())) {
                // Find the next ul element
                let nextElement = bold.parentElement?.nextElementSibling;
                while (nextElement) {
                  if (nextElement.tagName === 'UL') {
                    const listItems = nextElement.querySelectorAll('li');
                    listItems.forEach(li => {
                      const text = li.textContent?.trim();
                      if (text) items.push(text);
                    });
                    break;
                  }
                  nextElement = nextElement.nextElementSibling;
                }
                break;
              }
            }
            return items;
          };

          // Extract sections
          projectData.project = extractListItems('Project');
          projectData.reviewPaper = extractListItems('Review Paper');
          projectData.format = extractListItems('Format and File Details');
          projectData.evaluation = extractListItems('Evaluation');
          projectData.note = extractListItems('Note');
        }

        // Fallback: Direct mapping approach - check for different field names
        if (projectData.intro === "" && (apiData.intro || apiData.introduction || apiData.description)) {
          projectData.intro = stripHtml(apiData.intro || apiData.introduction || apiData.description);
        }

        // Extract project guidelines (fallback)
        if (projectData.project.length === 0 && apiData.project && Array.isArray(apiData.project)) {
          projectData.project = apiData.project.map((item: any) =>
            stripHtml(item.text || item.description || item.item || item)
          );
        } else if (projectData.project.length === 0 && apiData.project_section && Array.isArray(apiData.project_section)) {
          projectData.project = apiData.project_section.map((item: any) =>
            stripHtml(item.text || item.description || item.item || item)
          );
        }

        // Extract review paper guidelines (fallback)
        if (projectData.reviewPaper.length === 0 && apiData.review_paper && Array.isArray(apiData.review_paper)) {
          projectData.reviewPaper = apiData.review_paper.map((item: any) =>
            stripHtml(item.text || item.description || item.item || item)
          );
        } else if (projectData.reviewPaper.length === 0 && apiData.review_paper_section && Array.isArray(apiData.review_paper_section)) {
          projectData.reviewPaper = apiData.review_paper_section.map((item: any) =>
            stripHtml(item.text || item.description || item.item || item)
          );
        }

        // Extract format guidelines (fallback)
        if (projectData.format.length === 0 && apiData.format && Array.isArray(apiData.format)) {
          projectData.format = apiData.format.map((item: any) =>
            stripHtml(item.text || item.description || item.item || item)
          );
        } else if (projectData.format.length === 0 && apiData.format_section && Array.isArray(apiData.format_section)) {
          projectData.format = apiData.format_section.map((item: any) =>
            stripHtml(item.text || item.description || item.item || item)
          );
        }

        // Extract evaluation guidelines (fallback)
        if (projectData.evaluation.length === 0 && apiData.evaluation && Array.isArray(apiData.evaluation)) {
          projectData.evaluation = apiData.evaluation.map((item: any) =>
            stripHtml(item.text || item.description || item.item || item)
          );
        } else if (projectData.evaluation.length === 0 && apiData.evaluation_section && Array.isArray(apiData.evaluation_section)) {
          projectData.evaluation = apiData.evaluation_section.map((item: any) =>
            stripHtml(item.text || item.description || item.item || item)
          );
        }

        // Extract note guidelines (fallback)
        if (projectData.note.length === 0 && apiData.note && Array.isArray(apiData.note)) {
          projectData.note = apiData.note.map((item: any) =>
            stripHtml(item.text || item.description || item.item || item)
          );
        } else if (projectData.note.length === 0 && apiData.note_section && Array.isArray(apiData.note_section)) {
          projectData.note = apiData.note_section.map((item: any) =>
            stripHtml(item.text || item.description || item.item || item)
          );
        }

        // Fallback: If no structured data found, try to parse as plain array
        if (
          projectData.project.length === 0 &&
          projectData.reviewPaper.length === 0 &&
          projectData.format.length === 0 &&
          projectData.evaluation.length === 0 &&
          projectData.note.length === 0 &&
          Array.isArray(apiData)
        ) {
          // Simple list display if API returns simple array
          projectData.project = apiData.map((item: any) =>
            stripHtml(item.text || item.description || item.item || item)
          );
        }

        setGuidelineData(projectData);
      } else {
        setError(data?.message || "Failed to load project guidelines");
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
          className={`rounded-2xl p-5 sm:p-7 ${isDark
            ? "bg-gradient-to-br from-[#0b1220] to-[#020617]"
            : "bg-gradient-to-br from-white to-[#f8fafc]"
            }`}
          style={{ boxShadow: "0px 0px 24px 0px #00000014" }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                Project Guidelines
              </h1>
              <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Home &gt; Project Guidelines
              </p>
            </div>
            <button
              onClick={() => navigate("/projects")}
              className={`flex items-center justify-center rounded-full font-bold px-4 py-2 text-xs sm:text-sm w-fit transition-all ${isDark
                ? "bg-[#2e415f] text-[#93c5fd] hover:bg-[#334155]"
                : "bg-[#ECF2FE] text-[#3E80F9]"
                }`}
            >
              <ChevronLeft size={16} />
              Back
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
          className={`rounded-2xl p-5 sm:p-7 ${isDark
            ? "bg-gradient-to-br from-[#0b1220] to-[#020617]"
            : "bg-gradient-to-br from-white to-[#f8fafc]"
            }`}
          style={{ boxShadow: "0px 0px 24px 0px #00000014" }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                Project Guidelines
              </h1>
              <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Home &gt; Project Guidelines
              </p>
            </div>
            <button
              onClick={() => navigate("/projects")}
              className={`flex items-center justify-center rounded-full font-bold px-4 py-2 text-xs sm:text-sm w-fit transition-all ${isDark
                ? "bg-[#2e415f] text-[#93c5fd] hover:bg-[#334155]"
                : "bg-[#ECF2FE] text-[#3E80F9]"
                }`}
            >
              <ChevronLeft size={16} />
              Back
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
    <div className="w-full p-2 sm:p-4 lg:p-0">
      <div
        className={`rounded-2xl p-5 sm:p-7 ${isDark
          ? "bg-gradient-to-br from-[#0b1220] to-[#020617]"
          : "bg-gradient-to-br from-white to-[#f8fafc]"
          }`}
        style={{ boxShadow: "0px 0px 24px 0px #00000014" }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1
              className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"
                }`}
            >
              Project Guidelines
            </h1>
            <p
              className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"
                }`}
            >
              Home &gt; Project Guidelines
            </p>
          </div>

          <button
            onClick={() => navigate("/projects")}
            className={`flex items-center justify-center rounded-full font-bold px-4 py-2 text-xs sm:text-sm w-fit transition-all ${isDark
              ? "bg-[#2e415f] text-[#93c5fd] hover:bg-[#334155]"
              : "bg-[#ECF2FE] text-[#3E80F9]"
              }`}
          >
            <ChevronLeft size={16} />
            Back
          </button>
        </div>

        {/* Intro */}
        {guidelineData.intro && (
          <div
            className={`text-sm mb-8 rounded-xl p-5 border ${isDark
              ? "bg-white/5 border-white/10 text-gray-300"
              : "bg-gray-50 border-gray-100 text-gray-600"
              }`}
          >
            {guidelineData.intro}
          </div>
        )}

        {/* Sections */}
        <div className="grid grid-cols-1 gap-6">
          {/* Project */}
          {guidelineData.project.length > 0 && (
            <SectionCard icon={FileText} title="Project" isDark={isDark}>
              <ul className="list-disc pl-6 space-y-1">
                {guidelineData.project.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* Review Paper */}
          {guidelineData.reviewPaper.length > 0 && (
            <SectionCard icon={BookOpen} title="Review Paper" isDark={isDark}>
              <ul className="list-disc pl-6 space-y-1">
                {guidelineData.reviewPaper.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* Format */}
          {guidelineData.format.length > 0 && (
            <SectionCard icon={Settings} title="Format and File Details" isDark={isDark}>
              <ul className="list-disc pl-6 space-y-1">
                {guidelineData.format.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* Evaluation */}
          {guidelineData.evaluation.length > 0 && (
            <SectionCard icon={CheckCircle} title="Evaluation" isDark={isDark}>
              <ul className="list-disc pl-6 space-y-1">
                {guidelineData.evaluation.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* Note */}
          {guidelineData.note.length > 0 && (
            <SectionCard icon={AlertTriangle} title="Note" isDark={isDark}>
              <ul className="list-disc pl-6 space-y-1">
                {guidelineData.note.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* Empty state if no sections have data */}
          {guidelineData.project.length === 0 &&
            guidelineData.reviewPaper.length === 0 &&
            guidelineData.format.length === 0 &&
            guidelineData.evaluation.length === 0 &&
            guidelineData.note.length === 0 && (
              <div className="text-center py-8">
                <p className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  No project guidelines available
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};