import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import toast from 'react-hot-toast';
import { useTheme } from "../../contexts/ThemeContext";
import { apiService } from "../../services/apiService";

export const ProjectSubmitPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isDark } = useTheme();

    const [isLoading, setIsLoading] = useState(true);
    const [project, setProject] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);

    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Helper to strip HTML tags
    const stripHtml = (html: string) => {
        if (!html) return "";
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setIsLoading(true);
                if (!id) return;

                // Fetch details using the start endpoint
                const { data, error } = await apiService.get<any>(
                    `/EducationAndInternship/Student/projects/start/${id}`
                );

                if (error) {
                    toast.error(error);
                    return;
                }

                if (data?.success) {
                    const responseData = data.data;
                    const projectData = responseData.project || responseData.student_project || responseData;
                    const questionsData = responseData.questions || [];

                    setProject(projectData);
                    setQuestions(questionsData);
                }
            } catch (err) {
                toast.error("Failed to load project details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    const handleProjectAction = async (asDraft: boolean) => {
        if (!file) {
            toast.error("Please upload an answer file");
            return;
        }

        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("student_project_id", id!);

            // If questions exist, we attach the file to the first question ID to satisfy potential backend requirements
            // Since the UI presents an "OR" choice with a single file, this assumes one submission covers the requirement.
            if (questions.length > 0) {
                formData.append("question_id", questions[0].id);
            }

            formData.append("file", file);

            // Set flags based on action type
            formData.append("save_as_draft", asDraft.toString());
            formData.append("save", asDraft ? "save" : "submit");

            const { data, error } = await apiService.post<any>(
                `/EducationAndInternship/Student/projects/submit`,
                formData
            );

            if (data?.success) {
                if (asDraft) {
                    toast.success("Draft saved successfully!");
                } else {
                    toast.success("Project submitted successfully!");
                    // Navigate to existing route for results/details
                    navigate(`/projects/${id}`);
                }
            } else {
                toast.error(error || `Failed to ${asDraft ? "save draft" : "submit project"}`);
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred during submission");
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className={`p-4 md:p-6 w-full ${isDark ? "bg-gray-900" : "bg-white"}`}>

            {/* Header */}
            <div className={`rounded-xl p-4 mb-6 shadow-sm ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                            {stripHtml(project?.project_name || project?.title || project?.name || "Project")}
                        </h1>
                        <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            Home &gt; Project
                        </div>
                    </div>
                </div>
            </div>



            {/* Content Card */}
            <div className={`rounded-xl border p-8 shadow-sm mb-24 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>

                {/* Question Section */}
                <div className="mb-8 space-y-6">
                    {questions && questions.length > 0 ? (
                        questions.map((q, index) => (
                            <div key={q.id || index}>
                                <div className={`font-semibold text-lg ${isDark ? "text-gray-200" : "text-[#425466]"}`}>
                                    Question: <span className={isDark ? "text-gray-300" : "text-[#425466]"}>{q.question}</span>
                                </div>
                                {index < questions.length - 1 && (
                                    <div className="text-center py-4">
                                        <span className={`text-sm font-bold ${isDark ? "text-gray-400" : "text-[#425466]"}`}>OR</span>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className={`text-base leading-relaxed ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                            {stripHtml(project?.question || project?.description || "No specific questions details available.")}
                        </p>
                    )}
                </div>

                {/* Single File Upload */}
                <div className="mt-8">
                    <label className={`block font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>
                        Upload Answer
                    </label>
                    <div className={`border rounded p-1 ${isDark ? "border-gray-600" : "border-gray-200"}`}>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setFile(e.target.files[0]);
                                }
                            }}
                            className={`block w-full text-sm 
                            file:mr-4 file:py-2 file:px-4
                            file:border-1 file:border-black
                            file:text-sm file:font-medium
                            ${isDark
                                    ? "text-gray-300 file:bg-gray-700 file:text-white hover:file:bg-gray-600 bg-gray-800"
                                    : "text-gray-600 file:bg-[#EFEFEF] file:text-black hover:file:bg-gray-200 bg-white"
                                }
                        `}
                        />
                    </div>
                </div>

            </div>

            {/* Fixed Bottom action bar as per screenshot style seems to be simplified or inline, 
               but user requested "project me question ki ui ese show hona chahiye".
               The screenshot shows a "Submit Answer" button at bottom right (green).
               I will match that.
            */}
            <div className="flex justify-end gap-3 mt-6">
                {/* 
                  The screenshot shows "Save Draft" in blue outline (maybe?) and "Submit Assignment" in green. 
                  Actually screenshot only shows "Submit Answer" green button.
                  I will keep Save Draft but style Submit as green.
                */}


                <button
                    onClick={() => handleProjectAction(false)}
                    disabled={submitting}
                    className={`px-6 py-2 rounded font-medium text-white transition-all ${submitting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-[#36CA00] hover:bg-[#2fa800]"
                        }`}
                >
                    {submitting ? "Submitting..." : "Submit Answer"}
                </button>
            </div>
        </div>
    );
};
