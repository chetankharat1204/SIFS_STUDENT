import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PageShell from "../../components/PageShell";
import { ChevronLeft, ChevronDown, MinusCircle } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { apiService, studentAuthAPI } from "../../services/apiService";
import { formatDate as formatDateUtil } from "../../utils/dateUtils";

// --- Types ---
type MCQQuestion = {
  id: number;
  kind: "mcq";
  text: string;
  options: string[];
  userAnswerIndex: number;
  correctAnswerIndex: number;
  isAttempted: boolean;
  userAnswerId?: number;
  correctAnswerId?: number;
  optionsWithIds?: Array<{
    id: number;
    option_name: string;
    is_correct: boolean;
  }>;
};

type Question = MCQQuestion;

type TestData = {
  id: string;
  student_exam_id?: number;
  course: string;
  testName: string;
  exam_name?: string;
  date: string;
  start_date?: string;
  end_date?: string;
  status: "Complete" | "Pending" | "Not Attempted";
  is_completed?: boolean;
  is_checked?: boolean;
  courseImage?: string;
};

type StudentInfo = {
  name: string;
  email: string;
  phone: string;
  address: string;
  state: string;
  country: string;
  image_url?: string;
  avatar?: string;
};

type ResultData = {
  total_questions: number;
  total_marks: number;
  obtained_marks?: number;
  percentage: number;
  check_status: string;
  pass_status: string;
  attempted_questions?: number;
  correct_answers?: number;
  wrong_answers?: number;
  is_pass?: boolean;
  marks_display?: string;
  percentage_display?: string;
};

// --- StatusBadge with dark mode ---
const StatusBadge = ({ status, isDark = false }: { status: string; isDark?: boolean }) => {
  const base = "inline-flex items-center text-sm font-medium px-3 py-1 rounded-full border min-w-28 justify-center";

  if (status === "Complete" || status === "completed") {
    return (
      <span className={`${base} ${isDark
        ? "bg-green-900/30 text-green-400 border-green-500"
        : "bg-green-50 text-green-700 border-green-200"
        }`}>
        Complete
      </span>
    );
  }
  if (status === "Pending" || status === "pending") {
    return (
      <span className={`${base} ${isDark
        ? "bg-yellow-900/30 text-yellow-400 border-yellow-500"
        : "bg-orange-50 text-orange-600 border-orange-200"
        }`}>
        Pending
      </span>
    );
  }
  if (status === "Not Checked" || status === "not_checked") {
    return (
      <span className={`${base} ${isDark
        ? "bg-blue-900/30 text-blue-400 border-blue-500"
        : "bg-blue-100 text-blue-700 border-blue-200"
        }`}>
        Not Checked
      </span>
    );
  }
  if (status === "Passed" || status === "pass") {
    return (
      <span className={`${base} ${isDark
        ? "bg-green-900/30 text-green-400 border-green-500"
        : "bg-green-100 text-green-700 border-green-200"
        }`}>
        Passed
      </span>
    );
  }
  if (status === "Failed" || status === "fail") {
    return (
      <span className={`${base} ${isDark
        ? "bg-red-900/30 text-red-400 border-red-500"
        : "bg-red-100 text-red-700 border-red-200"
        }`}>
        Failed
      </span>
    );
  }

  return (
    <span className={`${base} ${isDark
      ? "bg-gray-700 text-gray-300 border-gray-600"
      : "bg-white text-gray-500 border-[#D9D9D9]"
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
  optionsWithIds,
  isAttempted = true,
  isDark = false
}: {
  options: string[];
  userAnswerIndex: number;
  correctAnswerIndex: number;
  optionsWithIds?: Array<{
    id: number;
    option_name: string;
    is_correct: boolean;
  }>;
  isAttempted?: boolean;
  isDark?: boolean;
}) => {
  // ── NOT ATTEMPTED CASE ──────────────────────────────────────────────────────
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

  // ── ATTEMPTED CASE (original render) ────────────────────────────────────────
  return (
    <div className="p-4">
      <div className="space-y-3">
        {options.map((opt, index) => {
          const isUserAnswer = index === userAnswerIndex;
          const isCorrectAnswer = index === correctAnswerIndex;
          const isCorrectOption = optionsWithIds?.[index]?.is_correct;
          const isWrongUserAnswer = isUserAnswer && !isCorrectAnswer && !isCorrectOption;

          let wrapperClasses = "w-full text-left rounded-full px-4 py-3 border flex items-center gap-3 transition-all";

          if (isCorrectAnswer || isCorrectOption) {
            wrapperClasses += ` ${isDark ? "bg-blue-900 text-white border-blue-700" : "bg-[#008DD2] text-white border-[#008DD2]"}`;
          } else if (isWrongUserAnswer) {
            wrapperClasses += ` ${isDark ? "bg-red-900 text-white border-red-700" : "bg-red-600 text-white border-red-600"}`;
          } else {
            wrapperClasses += ` ${isDark ? "bg-gray-800 text-gray-300 border-gray-700" : "bg-[#F8F8F8] text-gray-800 border-transparent"}`;
          }

          return (
            <div key={index} className={wrapperClasses}>
              <span
                className={`w-5 h-5 flex items-center justify-center rounded-full border ${isCorrectAnswer || isCorrectOption
                  ? isDark ? "bg-blue-700 border-blue-300" : "bg-[#00467A] border-white"
                  : isWrongUserAnswer
                    ? isDark ? "bg-red-700 border-red-300" : "bg-red-700 border-white"
                    : isDark ? "bg-gray-700 border-gray-500" : "bg-white border-gray-300"
                  }`}
              >
                {(isCorrectAnswer || isCorrectOption || isWrongUserAnswer) && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    {isCorrectAnswer || isCorrectOption ? (
                      <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                    ) : (
                      <path d="M6 6l12 12M18 6 6 18" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                    )}
                  </svg>
                )}
              </span>
              <span className="text-sm font-semibold flex-1">{opt}</span>
              {isCorrectAnswer || isCorrectOption ? (
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
      ? "bg-gray-700 text-white border-gray-600"
      : "bg-[#3A3A3A] text-white border-[#3A3A3A]"
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
        <span className="flex-shrink-0 font-bold mr-2 whitespace-nowrap">Q.{qId}</span>
        <span className="flex-1 text-left break-words leading-relaxed font-medium">{text}</span>
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
        {isExpanded ? <MinusCircle size={20} className={iconColor} /> : <ChevronDown size={20} className={iconColor} />}
      </div>
    </div>
  );
};

/* -----------------------
   Main Component
   ----------------------- */
export default function TestResultPage() {
  const { id } = useParams<{ id: string }>();
  const testId = id ? parseInt(id) : 0;
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = location.state as { course?: string; testName?: string } | null;
  const { isDark } = useTheme();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [openQuestionId, setOpenQuestionId] = useState<number | null>(1);

  const [test, setTest] = useState<TestData | null>(null);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [results, setResults] = useState<ResultData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Helper to strip HTML tags
  const stripHtml = (html: string) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate && !endDate) return "N/A";

    if (startDate && endDate) {
      return `${formatDateUtil(startDate)} - ${formatDateUtil(endDate)}`;
    }
    return startDate ? formatDateUtil(startDate) : formatDateUtil(endDate!);
  };

  const handleToggle = (questionId: number) => {
    setOpenQuestionId((prevId) => (prevId === questionId ? null : questionId));
  };

  // Fetch test result
  const fetchTestResult = async () => {
    try {
      setIsLoading(true);
      setError("");

      if (!id) {
        setError("Test ID is required");
        return;
      }

      // Fetch detailed quiz result
      const { data: detailedData, error: detailedError } = await apiService.get<any>(
        `/EducationAndInternship/Student/quizzes/detailed-result/${testId}`
      );

      if (detailedError) {
        // Try fetching basic result if detailed fails
        const { data: basicData, error: basicError } = await apiService.get<any>(
          `/EducationAndInternship/Student/quizzes/result/${testId}`
        );

        if (basicError) {
          setError(basicError);
          return;
        }

        processBasicResult(basicData);
      } else {
        processDetailedResult(detailedData);
      }

      // Fetch student profile
      const { data: profileData, error: profileError } = await studentAuthAPI.getProfile();

      if (!profileError && profileData?.success && profileData.data?.user) {
        const user = profileData.data.user;
        setStudent({
          name: user.name || "N/A",
          email: user.email || "N/A",
          phone: user.phone || "N/A",
          address: user.address || "N/A",
          state: user.state || "N/A",
          country: user.country || "N/A",
          avatar: user.image_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=60",
        });
      }

    } catch (err: any) {
      setError(err.message || "Failed to load test result");
      console.error("Error fetching test result:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const processBasicResult = (data: any) => {
    if (data?.success && data.data) {
      const resultData = data.data;
      const stats = resultData.statistics || resultData.results || {};
      const quizInfo = resultData.quiz || resultData.exam || resultData;

      setResults({
        total_questions: stats.total_questions || resultData.total_questions || quizInfo.total_question || quizInfo.no_question || 0,
        total_marks: stats.total_marks || resultData.total_marks || quizInfo.total_question || 0,
        obtained_marks: stats.correct_answers || stats.obtained_marks || resultData.obtained_marks || quizInfo.right_answer || 0,
        percentage: parseFloat(stats.percentage || resultData.percentage) || 0,
        check_status: "Checked",
        pass_status: stats.status || (stats.is_pass ? "Passed" : "Failed"),
        attempted_questions: stats.attempted_questions || resultData.attempted_questions || quizInfo.ans_attmpt,
        correct_answers: stats.correct_answers || resultData.correct_answers || quizInfo.right_answer,
        wrong_answers: stats.wrong_answers || resultData.wrong_answers || quizInfo.wrong_answer,
        is_pass: stats.status === "Passed" || quizInfo.is_pass === 1 || resultData.is_pass === 1 || stats.is_pass,
        marks_display: stats.marks_display,
        percentage_display: stats.percentage_display,
      });

      setTest({
        id: id || "",
        student_exam_id: testId,
        course: stateData?.course || quizInfo.course_name || quizInfo.subject_name || quizInfo.course_title || quizInfo.course || quizInfo.subject ||
          resultData.course_name || resultData.subject_name || resultData.course_title || resultData.course || "N/A",
        testName: stateData?.testName || stripHtml(quizInfo.exam_name || quizInfo.title || quizInfo.test_name || quizInfo.name || "N/A"),
        date: formatDateRange(quizInfo.start_date, quizInfo.end_date),
        status: "Complete" as const,
        is_completed: true,
        is_checked: true,
        courseImage: quizInfo.course_image_url ||
          (quizInfo.course_image ? (quizInfo.course_image.startsWith('http') ? quizInfo.course_image : `${import.meta.env.VITE_IMAGE_BASE_URL || ""}/uploads/${quizInfo.course_image}`) : "") ||
          resultData.course_image_url,
      });

      const questionsData = resultData.answers || resultData.questions || resultData.detailed_results || [];
      if (questionsData.length > 0) {
        const transformed = questionsData.map((q: any, index: number) => {
          const userAnswer = q.student_answer || q.user_answer || q.selected_option || q.answer;
          const correctAnswer = q.correct_answer || q.correct_option;

          let options = q.options || [];
          if (options.length === 0 && (userAnswer || correctAnswer)) {
            // Fallback: create options from answers if missing
            options = Array.from(new Set([correctAnswer, userAnswer])).filter(Boolean);
          }

          const optionsText = options.map((opt: any) =>
            typeof opt === 'string' ? opt : (opt.option_name || opt.text || "")
          );

          let userAnswerIndex = -1;
          let correctAnswerIndex = -1;

          if (userAnswer && optionsText.length > 0) {
            const uStr = String(userAnswer).toLowerCase();
            userAnswerIndex = optionsText.findIndex((opt: string) =>
              String(opt).toLowerCase() === uStr ||
              String(opt).toLowerCase().includes(uStr) ||
              uStr.includes(String(opt).toLowerCase())
            );
          }

          if (correctAnswer && optionsText.length > 0) {
            const cStr = String(correctAnswer).toLowerCase();
            correctAnswerIndex = optionsText.findIndex((opt: string) =>
              String(opt).toLowerCase() === cStr ||
              String(opt).toLowerCase().includes(cStr) ||
              cStr.includes(String(opt).toLowerCase())
            );
          }

          // If still not found but we have answers, use fallback indices
          if (userAnswerIndex === -1 && userAnswer) {
            userAnswerIndex = optionsText.indexOf(String(userAnswer));
          }
          if (correctAnswerIndex === -1 && correctAnswer) {
            correctAnswerIndex = optionsText.indexOf(String(correctAnswer));
          }

          // Determine if the student actually attempted this question
          const isAttempted = !!(q.is_attempt === 1 || q.is_attempt === true || q.answer_id || q.student_answer || q.user_answer || q.selected_option || q.answer);

          return {
            id: q.id || q.question_number || index + 1,
            kind: "mcq" as const,
            text: stripHtml(q.question || q.text || ""),
            options: optionsText,
            userAnswerIndex,
            correctAnswerIndex,
            isAttempted,
            userAnswerId: q.answer_id,
            correctAnswerId: q.correct_answer_id,
            optionsWithIds: q.options || [],
          };
        });

        setQuestions(transformed);
        if (transformed.length > 0) {
          setOpenQuestionId(transformed[0].id);
        }
      }
    }
  };

  const processDetailedResult = (data: any) => {
    // Re-use processBasicResult as it's now more robust and covers both structures
    processBasicResult(data);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTestResult();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 m-4 text-red-700 bg-red-100 rounded-lg">
        <p>{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-4 sm:p-6 w-full ${isDark ? "bg-gray-900" : "bg-white"
      }`}
      style={{ boxShadow: "0px 0px 24px 0px #00000014" }}
    >
      <div className="max-w-full mx-auto">
        {/* Header & Back */}
        <div className="flex flex-col md:flex-row justify-between mb-5 gap-3 md:items-center">
          <PageShell
            title="Tests"
            breadcrumb={["Home", "Tests Result"]}
          />
          <button
            onClick={() => navigate('/tests')}
            className={`flex items-center justify-center rounded-full font-bold px-4 py-2 text-xs sm:text-sm w-fit transition-all ${isDark
              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "bg-[#ECF2FE] text-[#3E80F9] hover:bg-[#E0E8F9]"
              }`}
          >
            <ChevronLeft size={16} /> Back
          </button>
        </div>

        {/* Test Header */}
        <div className={`p-4 sm:p-3 rounded-xl border mt-6 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-[#EBE8E8]"
          }`}>
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            {/* LEFT */}
            <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                <img
                  src={test?.courseImage || "https://dummyimage.com/90x70/dae2f8/7186ff"}
                  alt="Course Icon"
                  className="w-full h-full rounded-lg object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://dummyimage.com/90x70/dae2f8/7186ff";
                  }}
                />
                <span className={`absolute top-0 left-0 text-xs px-2 py-0.5 rounded-br-lg rounded-tl-lg font-medium transform -translate-x-1 -translate-y-1 ${isDark
                  ? "bg-red-900/50 text-red-300"
                  : "bg-red-100 text-red-700"
                  }`}>
                  NEW
                </span>
              </div>
              <div>
                <p className={`text-[12px] sm:text-xs font-medium uppercase ${isDark ? "text-gray-400" : "text-gray-600"
                  }`}>
                  Courses
                </p>
                <h2 className={`text-lg sm:text-xl font-bold ${isDark ? "text-white" : "text-gray-900"
                  }`}>
                  {test?.course || "N/A"}
                </h2>
                <span className={`inline-block mt-2 text-xs sm:text-sm px-3 py-1 rounded-md border ${isDark
                  ? "bg-yellow-900/30 text-yellow-400 border-yellow-500"
                  : "bg-orange-50 text-orange-700 border-orange-200"
                  }`}>
                  {test?.testName || "N/A"}
                </span>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex gap-5 lg:gap-8 text-xs sm:text-sm justify-end flex-shrink-0">
              <div className="text-left">
                <p className={`text-xs font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-600"
                  }`}>
                  Date
                </p>
                <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"
                  }`}>
                  {test?.date || "N/A"}
                </p>
              </div>
              <div className="text-left">
                <p className={`text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"
                  }`}>
                  Status
                </p>
                <StatusBadge status={test?.status || "Not Attempted"} isDark={isDark} />
              </div>
            </div>
          </div>
        </div>

        {/* Student & Result Grid */}
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
                src={student?.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=60"}
                alt={`Profile picture for ${student?.name}`}
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
                      {student?.name || "N/A"}
                    </p>
                  </div>
                  <div className="sm:col-span-3">
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                      }`}>
                      E-mail
                    </p>
                    <p className={`text-sm font-medium break-words ${isDark ? "text-white" : "text-gray-900"
                      }`}>
                      {student?.email || "N/A"}
                    </p>
                  </div>
                </div>

                <hr className={`my-3 ${isDark ? "border-gray-700" : "border-gray-200"
                  }`} />

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div className="sm:col-span-2">
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                      }`}>
                      Phone
                    </p>
                    <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"
                      }`}>
                      {student?.phone || "N/A"}
                    </p>
                  </div>
                  <div className="sm:col-span-3">
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                      }`}>
                      Address
                    </p>
                    <p className={`text-sm font-medium break-words ${isDark ? "text-white" : "text-gray-900"
                      }`}>
                      {student?.address || "N/A"}
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
                      {student?.state || "N/A"}
                    </p>
                  </div>
                  <div className="sm:col-span-3">
                    <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                      }`}>
                      Country
                    </p>
                    <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"
                      }`}>
                      {student?.country || "N/A"}
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
              <div className="grid grid-cols-3 gap-4 text-xs sm:text-sm mb-4">
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Total Questions
                  </p>
                  <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"
                    }`}>
                    {(results?.total_questions || 0).toString().padStart(2, "0")}
                  </p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Total Mark
                  </p>
                  <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"
                    }`}>
                    {results?.marks_display || `${results?.obtained_marks || 0}/${results?.total_marks || 0}`}
                  </p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Percentage
                  </p>
                  <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"
                    }`}>
                    {results?.percentage_display || `${results?.percentage?.toFixed(2) || 0}%`}
                  </p>
                </div>
              </div>

              <hr className={`my-4 ${isDark ? "border-gray-700" : "border-gray-200"
                }`} />

              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Attempted Questions
                  </p>
                  <span className="font-semibold">
                    {results?.attempted_questions || 0}/{results?.total_questions || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Correct Answers
                  </p>
                  <span className="font-semibold text-green-600">
                    {results?.correct_answers || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Wrong Answers
                  </p>
                  <span className="font-semibold text-red-600">
                    {results?.wrong_answers || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Pass Status
                  </p>
                  <StatusBadge
                    status={results?.is_pass ? "Passed" : "Failed"}
                    isDark={isDark}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All Questions & Answers */}
        <div className="mt-10">
          <h3 className={`text-xl sm:text-2xl font-semibold mb-3 ${isDark ? "text-white" : "text-gray-900"
            }`}>
            All Questions & Answers ({questions.length})
          </h3>

          <div className={`space-y-3 ${isDark ? "bg-gray-900" : "bg-white"
            }`}>
            {questions.map((q, index) => {
              const isExpanded = openQuestionId === q.id;
              const isMCQ = q.kind === "mcq";

              return (
                <div key={q.id || index}>
                  <QuestionHeader
                    qId={index + 1}
                    text={q.text}
                    isExpanded={isExpanded}
                    onClick={() => handleToggle(q.id || index + 1)}
                    isAttempted={q.isAttempted}
                    isDark={isDark}
                  />

                  {isExpanded && isMCQ && (
                    <MCQResult
                      options={q.options}
                      userAnswerIndex={q.userAnswerIndex}
                      correctAnswerIndex={q.correctAnswerIndex}
                      optionsWithIds={q.optionsWithIds}
                      isAttempted={q.isAttempted}
                      isDark={isDark}
                    />
                  )}
                </div>
              );
            })}

            {questions.length === 0 && (
              <div className={`p-8 text-center ${isDark ? "text-gray-400" : "text-gray-500"
                }`}>
                No questions data available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}