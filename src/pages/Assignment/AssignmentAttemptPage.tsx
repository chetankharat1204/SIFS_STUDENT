import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { apiService } from "../../services/apiService";
import { FaCircleCheck } from "react-icons/fa6";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

type Question = {
    id: number;
    question: string;
    marks?: number;
};

type AssignmentDetails = {
    id: number;
    name: string;
    course_name: string;
    questions: Question[];
};

/* ─── Quill toolbar config ─── */
const quillModules = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["link", "image", "code-block"],
        ["clean"],
    ],
};

const quillFormats = [
    "header",
    "bold", "italic", "underline", "strike",
    "color", "background",
    "list",
    "align",
    "link", "image", "code-block",
];

/* ─── Quill-based Rich Text Editor ─── */
const RichTextEditor = ({
    value,
    onChange,
}: {
    value: string;
    onChange: (val: string) => void;
}) => {
    const { isDark } = useTheme();

    return (
        <div className={`quill-wrapper rounded-lg overflow-hidden ${isDark ? "quill-dark" : ""}`}>
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Write your answer here..."
                style={{ minHeight: "180px" }}
            />
        </div>
    );
};

export const AssignmentAttemptPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isDark } = useTheme();

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [unsavedQuestions, setUnsavedQuestions] = useState<Set<number>>(new Set());
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchAssignmentDetails();
    }, [id]);

    const fetchAssignmentDetails = async () => {
        if (!id) return;
        try {
            setIsLoading(true);

            const { data, error } = await apiService.get<any>(`/EducationAndInternship/Student/assignments/start/${id}`);

            if (error) throw new Error(error);

            if (data?.success && data.data) {
                const responseData = data.data;
                const assignmentObj = responseData.assignment || responseData;
                const questionsList = responseData.questions || responseData.examAnswers || [];

                const submissionId = assignmentObj.student_assignment_id || assignmentObj.id || parseInt(id);

                setAssignment({
                    id: submissionId,
                    name: assignmentObj.name || assignmentObj.assignment_name || assignmentObj.title || "Assignment",
                    course_name: assignmentObj.course_name || assignmentObj.course || "",
                    questions: questionsList.map((q: any) => ({
                        id: q.question_id || q.id,
                        question: q.question || q.text,
                        marks: q.marks
                    }))
                });

                const initialAnswers: Record<number, string> = {};
                questionsList.forEach((q: any) => {
                    const existingAnswer = q.answer || q.student_answer || q.saved_answer;
                    if (existingAnswer) {
                        initialAnswers[q.question_id || q.id] = existingAnswer;
                    }
                });
                setAnswers(initialAnswers);
            }
        } catch (err: any) {
            const errorMessage = err.message || "Failed to load assignment";

            if (errorMessage.toLowerCase().includes("completed")) {
                toast.error("Assignment already completed");
                navigate("/assignments");
                return;
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerChange = (questionId: number, value: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
        setUnsavedQuestions(prev => new Set(prev).add(questionId));
    };

    const handleSaveProgress = async () => {
        if (!id || !assignment) return;

        try {
            setIsSaving(true);
            const submissionId = assignment.id;

            const answerPayload = assignment.questions.map(q => ({
                question_id: q.id,
                answer: answers[q.id] || ""
            }));

            const payload = {
                student_assignment_id: submissionId,
                assignment_id: submissionId,
                answers: answerPayload,
                save_as_draft: true
            };

            const { error } = await apiService.post<any>('/EducationAndInternship/Student/assignments/submit', payload);

            if (error) throw new Error(error);

            setUnsavedQuestions(new Set());
            toast.success("Progress saved successfully");
        } catch (err) {
            console.error("Failed to save progress:", err);
            toast.error("Failed to save progress");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = () => {
        if (!id || !assignment) return;
        setShowSubmitConfirm(true);
    };

    const confirmSubmit = async () => {
        if (!id || !assignment) return;
        setShowSubmitConfirm(false);
        try {
            setIsSubmitting(true);

            const answerPayload = assignment.questions.map(q => ({
                question_id: q.id,
                answer: answers[q.id] || ""
            }));

            const submissionId = assignment.id;

            const payload = {
                student_assignment_id: submissionId,
                assignment_id: submissionId,
                answers: answerPayload,
                save_as_draft: false
            };

            const { data, error } = await apiService.post<any>('/EducationAndInternship/Student/assignments/submit', payload);

            if (error) throw new Error(error);

            if (data?.success) {
                navigate(`/assignments/${submissionId}`);
            } else {
                throw new Error(data?.message || "Submission failed");
            }
        } catch (err: any) {
            setError(err.message || "Failed to submit assignment");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 m-4 text-red-700 bg-red-100 rounded-lg">
                {error}
                <button onClick={() => navigate(-1)} className="ml-4 underline">Go Back</button>
            </div>
        );
    }

    return (
        <div className={`min-h-screen p-4 pb-24 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
            {/* Quill dark-mode overrides */}
            <style>{`
                .quill-dark .ql-toolbar { background: #374151; border-color: #4B5563; }
                .quill-dark .ql-toolbar .ql-stroke { stroke: #D1D5DB; }
                .quill-dark .ql-toolbar .ql-fill  { fill:  #D1D5DB; }
                .quill-dark .ql-toolbar .ql-picker-label { color: #D1D5DB; }
                .quill-dark .ql-toolbar .ql-picker-options { background: #374151; border-color: #4B5563; }
                .quill-dark .ql-container { background: #1F2937; border-color: #4B5563; }
                .quill-dark .ql-editor { color: #F3F4F6; min-height: 160px; }
                .quill-dark .ql-editor.ql-blank::before { color: #9CA3AF; }
                .ql-editor { min-height: 160px; }
                .ql-toolbar.ql-snow { border-radius: 0; }
                .ql-container.ql-snow { border-radius: 0; }
            `}</style>

            {/* Submit Confirmation Modal */}
            {showSubmitConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className={`max-w-md w-full rounded-2xl p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mx-auto mb-4">
                            <FaCircleCheck className="text-yellow-600 text-xl" />
                        </div>
                        <h3 className={`text-xl font-bold text-center mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                            Submit Assignment?
                        </h3>
                        <p className={`text-center mb-6 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                            Are you sure you want to submit the assignment? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSubmitConfirm(false)}
                                className={`flex-1 py-3 rounded-lg font-semibold ${isDark
                                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    }`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSubmit}
                                className="flex-1 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:opacity-90"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className={`rounded-xl p-4 mb-6 ${isDark ? "bg-gray-800" : "bg-white"} shadow-sm`}>
                    <div className="flex justify-between items-center mb-2">
                        <h1 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                            {assignment?.name || "Assignment"}
                        </h1>
                        <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            Home &gt; Assignment
                        </div>
                    </div>
                </div>

                {/* Save Notice */}
                <div className={`rounded-xl p-4 mb-6 ${isDark ? "bg-gray-800" : "bg-white"} shadow-sm`}>
                    <p className={`font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}>
                        Save any time using the fixed button below.
                    </p>
                </div>

                {/* Questions List */}
                <div className={`rounded-xl p-6 mb-6 ${isDark ? "bg-gray-800" : "bg-white"} shadow-sm`}>
                    {assignment?.questions.map((q) => (
                        <div key={q.id} className="mb-10 last:mb-0">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`text-lg font-medium pr-12 ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                                    <span className="font-bold">Question: </span>
                                    <span dangerouslySetInnerHTML={{ __html: q.question }} className="inline-block" />
                                </div>
                            </div>

                            <div className="mb-2">
                                <label className={`block mb-2 font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                    Answer :
                                </label>
                                <RichTextEditor
                                    value={answers[q.id] || ""}
                                    onChange={(val) => handleAnswerChange(q.id, val)}
                                />
                            </div>
                        </div>
                    ))}

                    {(!assignment?.questions || assignment.questions.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                            No questions found for this assignment.
                        </div>
                    )}
                </div>

            </div>

            {/* Fixed Save/Submit Bar */}
            <div className={`fixed bottom-0 left-0 right-0 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-40 ${isDark ? "bg-gray-800 border-t border-gray-700" : "bg-white border-t border-gray-200"}`}>
                <div className="max-w-6xl mx-auto flex justify-end items-center gap-4">
                    <button
                        onClick={handleSaveProgress}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg border font-medium transition-colors ${isDark
                            ? "border-blue-500 text-blue-400 hover:bg-blue-900/20"
                            : "border-blue-600 text-blue-600 hover:bg-blue-50"
                            }`}
                    >
                        <FaCircleCheck />
                        {isSaving ? "Saving..." : "Save Draft"}
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || unsavedQuestions.size > 0}
                        className={`px-8 py-2.5 rounded-lg text-white font-medium transition-colors ${isSubmitting || unsavedQuestions.size > 0
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-green-600 to-green-700 hover:opacity-90"
                            }`}
                        title={unsavedQuestions.size > 0 ? "Please save all answers before submitting" : ""}
                    >
                        {isSubmitting ? "Submitting..." : "Submit Assignment"}
                    </button>
                </div>
            </div>
        </div>
    );
};
