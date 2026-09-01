import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronDown, ChevronRight, Loader } from "lucide-react";
import PageShell from "../../components/PageShell";
import { useTheme } from "../../contexts/ThemeContext";
import { apiService, studentAuthAPI } from "../../services/apiService";
import { formatDate } from "../../utils/dateUtils";

// --- StatusBadge with dark mode ---
const StatusBadge = ({ status, isDark = false }: { status: string | number; isDark?: boolean }) => {
  const base = "inline-flex items-center text-xs sm:text-sm font-medium px-3 py-1 rounded-full border";

  if (status === "Complete" || status === "completed" || status === 1)
    return (
      <span className={`${base} ${isDark
        ? "bg-green-900/30 text-green-400 border-green-500"
        : "bg-[#36CA0029] text-[#248600] border-[#36CA00]"
        }`}>
        Complete
      </span>
    );

  if (status === "Pending" || status === "pending" || status === 0)
    return (
      <span className={`${base} ${isDark
        ? "bg-yellow-900/30 text-yellow-400 border-yellow-500"
        : "bg-[#E28F1D33] text-[#E28F1D] border-[#E28F1D]"
        }`}>
        Pending
      </span>
    );

  return (
    <span className={`${base} ${isDark
      ? "bg-gray-700 text-gray-300 border-gray-600"
      : "bg-gray-50 text-gray-500 border-gray-200"
      }`}>
      {status}
    </span>
  );
};

// --- MCQ Result Component with dark mode ---
const MCQResult = ({
  options,
  userAnswerIndex,
  correctAnswerIndex,
  isAttempted = true,
  isDark = false
}: {
  options: string[];
  userAnswerIndex: number;
  correctAnswerIndex: number;
  isAttempted?: boolean;
  isDark?: boolean;
}) => {
  // ── NOT ATTEMPTED CASE ────────────────────────────────────
  if (!isAttempted) {
    return (
      <div className="p-4">
        <div
          className={`flex items-center gap-3 rounded-xl px-5 py-4 border ${isDark
              ? "bg-orange-900/20 border-orange-700/50 text-orange-300"
              : "bg-orange-50 border-orange-200 text-orange-700"
            }`}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-sm">Not Attempted</p>
            <p className={`text-xs mt-0.5 ${isDark ? "text-orange-400" : "text-orange-500"}`}>
              This question was not answered by the student.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── ATTEMPTED CASE ───────────────────────────────────────
  return (
    <div className="p-4">
      <div className="space-y-3">
        {options.map((opt, index) => {
          const isUserAnswer = index === userAnswerIndex;
          const isCorrectAnswer = index === correctAnswerIndex;
          const isWrongUserAnswer = isUserAnswer && !isCorrectAnswer;

          let wrapperClasses = "w-full text-left rounded-full px-4 py-3 border flex items-center gap-3 transition-all";

          if (isCorrectAnswer) {
            wrapperClasses += ` ${isDark ? "bg-blue-900 text-white border-blue-700" : "bg-[#008DD2] text-white border-[#008DD2]"}`;
          } else if (isWrongUserAnswer) {
            wrapperClasses += ` ${isDark ? "bg-red-900 text-white border-red-700" : "bg-red-600 text-white border-red-600"}`;
          } else {
            wrapperClasses += ` ${isDark ? "bg-gray-800 text-gray-300 border-gray-700" : "bg-[#F8F8F8] text-gray-800 border-transparent"}`;
          }

          return (
            <div key={index} className={wrapperClasses}>
              <span
                className={`w-5 h-5 flex items-center justify-center rounded-full border ${isCorrectAnswer
                  ? isDark ? "bg-blue-700 border-blue-300" : "bg-[#00467A] border-white"
                  : isWrongUserAnswer
                    ? isDark ? "bg-red-700 border-red-300" : "bg-red-700 border-white"
                    : isDark ? "bg-gray-700 border-gray-500" : "bg-white border-gray-300"
                  }`}
              >
                {(isCorrectAnswer || isWrongUserAnswer) && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    {isCorrectAnswer ? (
                      <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                    ) : (
                      <path d="M6 6l12 12M18 6 6 18" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                    )}
                  </svg>
                )}
              </span>
              <span className="text-sm font-semibold flex-1">{opt}</span>
              {isCorrectAnswer ? (
                <span className="text-sm font-semibold flex-shrink-0 text-white">Correct Answer</span>
              ) : isWrongUserAnswer ? (
                <span className="text-sm font-semibold flex-shrink-0 text-white">Your Answer</span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- QuestionHeader with dark mode ---
const QuestionHeader = ({
  qId,
  text,
  isExpanded,
  onClick,
  isAttempted = true,
  isDark = false
}: {
  qId: number;
  text: string;
  isExpanded: boolean;
  onClick: () => void;
  isAttempted?: boolean;
  isDark?: boolean;
}) => {
  const headerClasses = isExpanded
    ? isDark
      ? "bg-gray-700 text-white border-gray-600 shadow-sm"
      : "bg-[#3A3A3A] text-white border-[#3A3A3A] shadow-sm"
    : isDark
      ? "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
      : "bg-white text-gray-900 border-[#E2E2E2] hover:bg-gray-50";

  const iconColor = isExpanded ? "text-white" : isDark ? "text-gray-400" : "text-gray-500";

  return (
    <div
      onClick={onClick}
      className={`font-semibold text-[15px] sm:text-base leading-relaxed tracking-normal mb-2 rounded-md flex items-start justify-between py-3.5 px-4 sm:px-5 cursor-pointer select-none transition-colors border ${headerClasses}`}
    >
      <div className="flex items-start flex-1 min-w-0 pr-3 sm:pr-4">
        <span className="flex-shrink-0 font-bold mr-2 whitespace-nowrap">
          Q.{qId}
        </span>
        <span className="flex-1 text-left break-words leading-relaxed font-medium">
          {text}
        </span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 mt-0.5">
        {/* Not Attempted badge on collapsed header */}
        {!isAttempted && !isExpanded && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${isDark
                ? "bg-orange-900/40 text-orange-300 border border-orange-700"
                : "bg-orange-100 text-orange-700 border border-orange-300"
              }`}
          >
            Not Attempted
          </span>
        )}
        {isExpanded ? (
          <ChevronDown size={20} className={iconColor} />
        ) : (
          <ChevronRight size={20} className={iconColor} />
        )}
      </div>
    </div>
  );
};

export default function ExamResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [openQuestionId, setOpenQuestionId] = useState<number | null>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [examResult, setExamResult] = useState<any>(null);
  const [detailedResults, setDetailedResults] = useState<any[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [examInfo, setExamInfo] = useState<any>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<any>(null);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState<boolean>(false);

  const handleToggle = (questionId: number) => {
    setOpenQuestionId((prevId) => (prevId === questionId ? null : questionId));
  };

  useEffect(() => {
    const fetchExamResult = async () => {
      if (!id) {
        setError("Exam ID is required");
        setIsLoading(false);
        return;
      }

      try {
        if (!examResult) {
          setIsLoading(true);
        }
        setIsQuestionsLoading(true);
        setError("");

        // Fetch Summary first to prevent backend initialization race conditions
        const summaryResponse = await apiService.get<any>(`/EducationAndInternship/Student/exams/result/${id}`);
        // Then fetch Detailed results
        const detailedResponse = await apiService.get<any>(`/EducationAndInternship/Student/exams/detailed-result/${id}?page=${currentPage}`);

        const { data: summaryDataRes, error: summaryError } = summaryResponse;
        const { data: detailedData, error: detailedError } = detailedResponse;

        if (summaryError || detailedError) {
          setError(summaryError || detailedError || "An error occurred");
          return;
        }

        // Process Summary Data (Source of truth for stats)
        if (summaryDataRes?.success) {
          const sumRoot = summaryDataRes.data; // { result, breakdown, summary }

          setExamResult({
            ...sumRoot.result,
            apiSummary: sumRoot.summary,
            breakdown: sumRoot.breakdown
          });

          const summaryInfo = sumRoot.result;
          if (summaryInfo) {
            setExamInfo({
              exam_id: summaryInfo.exam_id,
              student_exam_id: summaryInfo.id,
              submitted_at: summaryInfo.submit_date || summaryInfo.updated_at || summaryInfo.end_date,
              exam_name: summaryInfo.exam_name ? summaryInfo.exam_name.replace(/<[^>]+>/g, '') : "Exam Result",
              course_name: summaryInfo.course_name,
              course_image: summaryInfo.course_image_url || (summaryInfo.course_image ? (summaryInfo.course_image.startsWith('http') ? summaryInfo.course_image : `${import.meta.env.VITE_IMAGE_BASE_URL || ""}/uploads/${summaryInfo.course_image}`) : null)
            });
          }
        }

        // Process Detailed Data (Source for questions list)
        if (detailedData?.success) {
          const rootData = detailedData.data;
          const answersData = rootData?.answerData?.data || rootData?.data || [];

          if (rootData?.data && rootData.data.pagination) {
            setPagination(rootData.data.pagination);
          } else if (rootData?.answerData && rootData.answerData.pagination) {
            setPagination(rootData.answerData.pagination);
          } else if (rootData?.pagination) {
            setPagination(rootData.pagination);
          }

          // Transform detailed results
          const transformedDetailedResults = answersData.map((item: any) => {
            // Detect if the student actually attempted this question
            const isAttempted = !!(item.is_attempt === 1 || item.is_attempt === true || item.answer_id || item.student_answer);

            return {
              question_id: item.question_id,
              question_text: item.question ? item.question.replace(/<[^>]+>/g, '') : "",
              user_answer: item.student_answer,
              correct_answer: item.correct_answer,
              is_correct: item.is_correct === 1,
              isAttempted,
              explanation: "",
              options: (item.question_options || []).map((opt: any) => opt.option_name)
            };
          });

          setDetailedResults(transformedDetailedResults);
        }

        // Fetch student profile if not already present
        if (!studentInfo) {
          const { data: profileData, error: profileError } = await studentAuthAPI.getProfile();
          if (!profileError && profileData?.success) {
            setStudentInfo(profileData.data?.user);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load exam result");
      } finally {
        setIsLoading(false);
        setIsQuestionsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchExamResult();
    }, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [id, currentPage]);

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="text-center">
          <Loader className="animate-spin text-4xl text-blue-500 mb-4 mx-auto" />
          <p className={isDark ? "text-gray-300" : "text-gray-600"}>Loading exam result...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className={`max-w-md p-6 rounded-xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
          <h3 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>Error</h3>
          <p className={`mb-6 ${isDark ? "text-gray-300" : "text-gray-600"}`}>{error}</p>
          <button
            onClick={() => navigate("/exams")}
            className={`w-full py-3 rounded-lg font-semibold ${isDark
              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  const results = {
    totalQuestions: examResult?.apiSummary?.total_questions || examResult?.total_questions || examResult?.total_question || 0,
    attempted: examResult?.apiSummary?.attempted || 0,
    rightAnswer: examResult?.apiSummary?.correct || examResult?.correct_answers || examResult?.right_answer || 0,
    wrongAnswer: examResult?.apiSummary?.incorrect || examResult?.wrong_answer || 0,
    percentage: examResult?.apiSummary?.score || examResult?.percentage || examResult?.right_percent || 0,
    passStatus: examResult?.apiSummary?.status || ((examResult?.is_pass === true || examResult?.is_pass === 1 || examResult?.status === "Passed") ? "Pass" : "Fail"),
    status: (examResult?.status === 1 || examResult?.status === "Complete" || examResult?.status === "Passed" || examResult?.status === "Failed") ? "Complete" : "Pending"
  };

  const showingFrom = pagination?.showing_from || 1;

  return (
    <div className={`rounded-2xl p-4 sm:p-6 w-full ${isDark ? "bg-gray-900" : "bg-white"
      }`}
      style={{ boxShadow: "0px 0px 24px 0px #00000014" }}
    >
      <div className="p-2">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between mb-5 gap-3 md:items-center">
          <PageShell
            title="Exams"
            breadcrumb={["Home", "Exam Result"]}
          />

          <div className="order-1 sm:order-2 w-full sm:w-auto flex justify-end">
            <button
              onClick={() => navigate(-1)}
              className={`flex items-center justify-center rounded-full font-bold px-4 py-2 text-xs sm:text-sm w-fit transition-all ${isDark
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-[#ECF2FE] text-[#3E80F9] hover:bg-[#E0E8F9]"
                }`}
            >
              <ChevronLeft size={16} /> Back
            </button>
          </div>
        </div>

        {/* Exam Header */}
        <div className={`p-4 sm:p-3 rounded-xl border mt-6 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-[#EBE8E8]"
          }`}>
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            {/* LEFT */}
            <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                <img
                  src={examInfo?.course_image || "/1754650703 1.png"}
                  alt="Course Icon"
                  className="w-full h-full rounded-lg object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/1754650703 1.png";
                  }}
                />
              </div>

              <div>
                <p className={`text-[12px] sm:text-xs font-medium uppercase ${isDark ? "text-gray-400" : "text-gray-600"
                  }`}>
                  COURSES
                </p>
                <h2 className={`text-lg sm:text-xl font-bold ${isDark ? "text-white" : "text-gray-900"
                  }`}>
                  {examInfo?.course_name || "N/A"}
                </h2>

                <span className={`inline-block mt-2 text-xs sm:text-sm px-3 py-1 rounded-md border ${isDark
                  ? "bg-yellow-900/30 text-yellow-400 border-yellow-500"
                  : "bg-[#E28F1D29] text-[#E28F1D] border-[#E28F1D]"
                  }`}>
                  {examInfo?.exam_name || "Exam Result"}
                </span>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex gap-5 lg:gap-8 text-xs sm:text-sm justify-end flex-shrink-0">
              <div className="text-left">
                <p className={`text-xs font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-600"
                  }`}>
                  Submitted At
                </p>
                <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"
                  }`}>
                  {formatDate(examInfo?.submitted_at)}
                </p>
              </div>

              <div className="text-left">
                <p className={`text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"
                  }`}>
                  Status
                </p>
                <StatusBadge status={results.status} isDark={isDark} />
              </div>
            </div>
          </div>
        </div>

        {/* Student & Result */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Info */}
          <div className={`rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-[#EBE8E8]"
            }`}>
            <h3 className={`text-lg font-semibold p-4 ${isDark ? "text-white" : "text-gray-900"
              }`}>
              Student Information
            </h3>
            <hr className={isDark ? "border-gray-700" : "border-gray-200"} />

            <div className="flex flex-col sm:flex-row items-start gap-4 p-5 sm:p-6">
              <img
                src={studentInfo?.image_url || "/profile.jpg"}
                alt="Student"
                className="w-20 h-20 rounded-lg shrink-0 flex items-center justify-center overflow-hidden bg-[#000814] border border-gray-200"
              />

              <div className="text-sm w-full">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div className="sm:col-span-2">
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                      }`}>
                      Name
                    </p>
                    <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"
                      }`}>
                      {studentInfo?.name || "N/A"}
                    </p>
                  </div>
                  <div className="sm:col-span-3">
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                      }`}>
                      E-mail
                    </p>
                    <p className={`text-sm font-medium break-words ${isDark ? "text-white" : "text-gray-900"
                      }`}>
                      {studentInfo?.email || "N/A"}
                    </p>
                  </div>
                </div>

                <hr className={`my-3 ${isDark ? "border-gray-700" : "border-gray-200"}`} />

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div className="sm:col-span-2">
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                      }`}>
                      Phone
                    </p>
                    <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"
                      }`}>
                      {studentInfo?.phone || "N/A"}
                    </p>
                  </div>
                  <div className="sm:col-span-3">
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                      }`}>
                      Address
                    </p>
                    <p className={`text-sm font-medium break-words ${isDark ? "text-white" : "text-gray-900"
                      }`}>
                      {studentInfo?.address || "N/A"}
                    </p>
                  </div>
                </div>

                <hr className={`my-3 ${isDark ? "border-gray-700" : "border-gray-200"
                  }`} />

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div className="sm:col-span-2">
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                      }`}>
                      State
                    </p>
                    <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"
                      }`}>
                      {studentInfo?.state || "N/A"}
                    </p>
                  </div>
                  <div className="sm:col-span-3">
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                      }`}>
                      Country
                    </p>
                    <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"
                      }`}>
                      {studentInfo?.country || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className={`rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-[#EBE8E8]"
            }`}>
            <h3 className={`text-lg font-semibold p-4 ${isDark ? "text-white" : "text-gray-900"
              }`}>
              Results
            </h3>
            <hr className={isDark ? "border-gray-700" : "border-gray-200"} />

            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs sm:text-sm mb-4">
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Total Questions
                  </p>
                  <p className={`font-semibold text-lg ${isDark ? "text-white" : "text-gray-900"
                    }`}>
                    {results.totalQuestions.toString().padStart(2, "0")}
                  </p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Attempted
                  </p>
                  <p className={`font-semibold text-lg ${isDark ? "text-white" : "text-gray-900"
                    }`}>
                    {results.attempted}
                  </p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Right Answer
                  </p>
                  <p className={`font-semibold text-lg ${isDark ? "text-green-400" : "text-green-600"
                    }`}>
                    {results.rightAnswer}
                  </p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Wrong Answer
                  </p>
                  <p className={`font-semibold text-lg ${isDark ? "text-red-400" : "text-red-600"
                    }`}>
                    {results.wrongAnswer}
                  </p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Score
                  </p>
                  <p className={`font-semibold text-lg ${isDark ? "text-white" : "text-gray-900"
                    }`}>
                    {typeof results.percentage === 'string'
                      ? results.percentage
                      : `${results.percentage}%`
                    }
                  </p>
                </div>
              </div>

              <hr className={`my-4 ${isDark ? "border-gray-700" : "border-gray-200"
                }`} />

              <div className="space-y-4 text-sm">

                <div className="flex justify-between items-center">
                  <p className={isDark ? "text-gray-300" : "text-gray-900"}>
                    Pass Status
                  </p>
                  <span
                    className={`inline-block font-semibold px-3 py-1 rounded-full text-sm mt-1 w-28 text-center 
                      ${(results.passStatus === "Pass" || results.passStatus === "Passed")
                        ? isDark
                          ? "bg-green-900/30 text-green-400 border border-green-500"
                          : "bg-[#36CA0029] text-[#248600] border border-[#36CA00]"
                        : isDark
                          ? "bg-red-900/30 text-red-400 border border-red-500"
                          : "bg-[#FF1616] text-white border border-[#FF1616]"
                      }
                    `}
                  >
                    {results.passStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All Questions */}
        <div className="mt-10">
          <h3 className={`text-xl font-semibold mb-3 ${isDark ? "text-white" : "text-gray-900"
            }`}>
            All Questions & Answers
          </h3>

          {isQuestionsLoading ? (
            <div className={`flex justify-center items-center py-12 ${isDark ? "bg-gray-800" : "bg-white"} rounded-xl border ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <Loader className="animate-spin text-3xl text-blue-500" />
            </div>
          ) : (
            <div className={`space-y-3 ${isDark ? "bg-gray-900" : "bg-white"
              }`}>
              {detailedResults.map((result, index) => {
                const globalIndex = index + showingFrom;
                const isExpanded = openQuestionId === globalIndex;
                const isMCQ = true;

                // Determine if attempted
                const isAttempted = result.isAttempted ?? !!result.user_answer;

                // Parse options if available
                const options = result.options?.length > 0
                  ? result.options
                  : [result.user_answer, result.correct_answer].filter(Boolean);

                const userAnswerIndex = options.findIndex((opt: string) => opt === result.user_answer);
                const correctAnswerIndex = options.findIndex((opt: string) => opt === result.correct_answer);

                return (
                  <div key={result.question_id || index}>
                    <QuestionHeader
                      qId={globalIndex}
                      text={result.question_text || `Question ${globalIndex}`}
                      isExpanded={isExpanded}
                      onClick={() => handleToggle(globalIndex)}
                      isAttempted={isAttempted}
                      isDark={isDark}
                    />

                    {isExpanded && isMCQ && (
                      <div>
                        <MCQResult
                          options={options}
                          userAnswerIndex={userAnswerIndex}
                          correctAnswerIndex={correctAnswerIndex}
                          isAttempted={isAttempted}
                          isDark={isDark}
                        />
                        {result.explanation && (
                          <div className={`p-4 mt-2 rounded-lg ${isDark ? "bg-gray-800" : "bg-blue-50"}`}>
                            <p className={`text-sm font-semibold mb-1 ${isDark ? "text-blue-300" : "text-blue-700"}`}>Explanation:</p>
                            <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{result.explanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!isQuestionsLoading && pagination && pagination.total_pages > 1 && (
            <div className="flex justify-center items-center mt-6 gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.has_previous}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${!pagination.has_previous
                  ? isDark
                    ? "text-gray-600 cursor-not-allowed"
                    : "text-gray-300 cursor-not-allowed"
                  : isDark
                    ? "text-gray-300 hover:text-white hover:bg-gray-800"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                  let pNum = i + 1;
                  if (pagination.total_pages > 5) {
                    if (currentPage > 3) {
                      pNum = currentPage - 2 + i;
                    }
                    if (pNum > pagination.total_pages) {
                      pNum = pagination.total_pages - (4 - i);
                    }
                  }

                  if (pNum < 1 || pNum > pagination.total_pages) return null;

                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${currentPage === pNum
                        ? isDark
                          ? "bg-blue-600 text-white"
                          : "bg-blue-600 text-white"
                        : isDark
                          ? "text-gray-300 hover:bg-gray-800"
                          : "text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.total_pages, p + 1))}
                disabled={!pagination.has_next}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${!pagination.has_next
                  ? isDark
                    ? "text-gray-600 cursor-not-allowed"
                    : "text-gray-300 cursor-not-allowed"
                  : isDark
                    ? "text-gray-300 hover:text-white hover:bg-gray-800"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}