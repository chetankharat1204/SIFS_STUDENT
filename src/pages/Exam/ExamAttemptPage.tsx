import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageShell from "../../components/PageShell";
import { FaCircleUser, FaClock, FaFlag, FaCircleCheck, FaSpinner } from "react-icons/fa6";
import { useTheme } from "../../contexts/ThemeContext";
import { apiService } from "../../services/apiService";
import { studentAuthAPI } from "../../services/apiService";

type Option = { id: string; text: string };
type Question = {
  id: string; // This is the unique identifier for the question in the list (can be index based or actual id)
  question_id: number; // Actual DB ID
  title: string;
  text: string;
  options: Option[]
};
type AnswerState = {
  questionId: string;
  question_id: number;
  selectedOptionId: string | null;
  selectedOptionText: string | null;
  visited: boolean;
  flagged: boolean;
  answered: boolean;
};

function formatTime(sec: number) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}


export const ExamAttemptPage: React.FC = () => {
  const { studentExamId } = useParams<{ studentExamId: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(60 * 60); // Default 1 hour
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [examInfo, setExamInfo] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [show5MinAlert, setShow5MinAlert] = useState<boolean>(false);
  const [show1MinPopup, setShow1MinPopup] = useState<boolean>(false);
  const initializationStarted = useRef(false);
  const fiveMinTriggered = useRef(false);
  const oneMinTriggered = useRef(false);

  // Initialize exam
  useEffect(() => {
    const initializeExam = async () => {
      if (!studentExamId || initializationStarted.current) return;
      initializationStarted.current = true;

      try {
        setIsLoading(true);
        setError("");

        // 3. Start the exam
        const { data: startData, error: startError } = await apiService.get<any>(
          `/EducationAndInternship/Student/exams/start/${studentExamId}`
        );

        if (startError) {
          setError(startError);
          setIsLoading(false);
          return;
        }

        if (startData?.success && startData.data) {
          const data = startData.data;

          // Helper to check various possible field names
          const student_exam = data.exam || data?.student_exam;
          // List of questions (for palette) - API returns 'examAnswers' which has the list
          const questions_list = data.examAnswers || data.questions || data.exam_answers || [];

          // Current question details (for display) - API returns 'question' (singular) for the full question object with options
          // Use 'question' from root data if available, or try to find one in list
          const current_question_data = data.question || data.current_question;

          const total_questions_count = data.statistics?.total || data.total_questions || student_exam?.total_questions || questions_list.length;

          if (!student_exam && !questions_list.length) {
            setError("Exam data not found in response");
            setIsLoading(false);
            return;
          }

          // Strip HTML from exam name for breadcrumbs/title
          const examName = (student_exam?.exam_name || student_exam?.exam_title || "Exam").replace(/<[^>]*>?/gm, '');

          // Helper to parse time
          // exam_time might be in minutes (120) provided in JSON
          // remaining_seconds might be in seconds (7200) provided in JSON
          const durationMinutes = student_exam?.exam_time || student_exam?.time_limit || 0;
          const remainingSecs = student_exam?.remaining_seconds !== undefined
            ? student_exam.remaining_seconds
            : (student_exam?.remaining_time || durationMinutes * 60);

          // Set exam info
          setExamInfo({
            student_exam_id: data.student_exam_id || student_exam?.id,
            total_questions: total_questions_count,
            duration_minutes: durationMinutes,
            exam_name: examName,
          });

          setSecondsLeft(remainingSecs);

          const allQuestions: Question[] = questions_list.map((item: any, index: number) => ({
            id: (item.question_id || item.id)?.toString() || (index + 1).toString(),
            question_id: item.question_id || item.id,
            title: `Question ${item.question_number || index + 1}`,
            text: item.question || "",
            options: (item.options || []).map((opt: any, optIdx: number) => ({
              id: opt.id?.toString() || (optIdx + 1).toString(),
              text: opt.option_name || opt.text || ""
            }))
          }));

          let resolvedCurrentIdx = 0;

          if (current_question_data) {
            const qId = current_question_data.id || current_question_data.question_id;
            const foundIdx = allQuestions.findIndex(q => q.question_id == qId);

            if (foundIdx !== -1) {
              resolvedCurrentIdx = foundIdx;
              allQuestions[foundIdx].text = current_question_data.question;
              allQuestions[foundIdx].options = (current_question_data.options || []).map((opt: any, optIdx: number) => ({
                id: opt.id?.toString() || (optIdx + 1).toString(),
                text: opt.option_name || opt.text || ""
              }));
            }
          }

          setCurrentIndex(resolvedCurrentIdx);
          setQuestions(allQuestions);

          const initialAnswers: AnswerState[] = questions_list.map((q: any, idx: number) => ({
            questionId: (q.question_id || q.id)?.toString(),
            question_id: q.question_id || q.id,
            selectedOptionId: q.answer_id?.toString() || null,
            selectedOptionText: q.answer_value || null,
            visited: q.is_attempt === 1 || idx === resolvedCurrentIdx,
            flagged: q.is_flagged === 1 || false,
            answered: q.answer_id ? true : false,
          }));

          setAnswers(initialAnswers);
        }

        // Fetch student profile
        const { data: profileData, error: profileError } = await studentAuthAPI.getProfile();
        if (!profileError && profileData?.success) {
          setStudentInfo(profileData.data?.user);
        }

      } catch (err: any) {
        setError(err.message || "Failed to initialize exam");
      } finally {
        setIsLoading(false);
      }
    };

    initializeExam();
  }, [studentExamId]);

  // Update visited status when changing questions
  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      setAnswers((prev) =>
        prev.map((a, idx) =>
          idx === currentIndex
            ? { ...a, visited: true }
            : a
        )
      );
    }
  }, [currentIndex, questions]);

  // Timer effect
  useEffect(() => {
    if (secondsLeft <= 0 || submitted) {
      if (secondsLeft <= 0 && !submitted) {
        handleFinalSubmitDirect();
      }
      return;
    }

    // 5-minute warning banner (triggers once)
    if (secondsLeft <= 300 && !fiveMinTriggered.current) {
      fiveMinTriggered.current = true;
      setShow5MinAlert(true);
    }

    // 1-minute warning popup (triggers once, auto-dismisses after 8s)
    if (secondsLeft <= 60 && !oneMinTriggered.current) {
      oneMinTriggered.current = true;
      setShow1MinPopup(true);
      setTimeout(() => setShow1MinPopup(false), 8000);
    }

    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, submitted]);


  // Calculate question statistics
  const counts = useMemo(() => {
    const answered = answers.filter((a) => a.selectedOptionId !== null).length;
    const flagged = answers.filter((a) => a.flagged).length;
    const visited = answers.filter((a) => a.visited).length;
    const notVisited = questions.length - visited;
    const notAnswered = visited - answered;
    return { answered, flagged, notAnswered, notVisited };
  }, [answers, questions.length]);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex];


  // 9. Save Progress (Auto-save on selection)
  const handleSelectOption = async (optionId: string, optionText: string) => {
    if (submitted || !currentQuestion || !studentExamId) return;

    // Optimistic UI update
    setAnswers((prev) =>
      prev.map((a, idx) =>
        idx === currentIndex
          ? { ...a, selectedOptionId: optionId, selectedOptionText: optionText, answered: true }
          : a
      )
    );

    try {
      // API call to save progress
      await apiService.post<any>(
        '/EducationAndInternship/Student/exams/save-progress',
        {
          student_exam_id: parseInt(studentExamId),
          question_id: currentQuestion.question_id,
          answer: optionText,
          answer_id: parseInt(optionId),
        }
      );
      // We don't need to do much with response unless it fails
    } catch (err) {
      console.error("Failed to save progress:", err);
    }
  };



  const handleClear = () => {
    if (submitted) return;
    setAnswers((prev) =>
      prev.map((a, idx) =>
        idx === currentIndex
          ? { ...a, selectedOptionId: null, selectedOptionText: null, answered: false }
          : a
      )
    );
  };


  const updateQuestionState = (newQuestionData: any) => {
    if (!newQuestionData) return;
    setQuestions(prev => {
      const updated = [...prev];
      const newQId = newQuestionData.id;
      const idx = updated.findIndex(q => q.question_id === newQId);
      if (idx !== -1) {
        updated[idx] = {
          ...updated[idx],
          text: newQuestionData.question,
          options: (newQuestionData.options || []).map((opt: any, optIdx: number) => ({
            id: opt.id?.toString() || (optIdx + 1).toString(),
            text: opt.option_name || opt.text || ""
          }))
        };
      }
      return updated;
    });
    const qIndex = questions.findIndex(q => q.question_id === newQuestionData.id);
    if (qIndex !== -1 && qIndex !== currentIndex) {
      setCurrentIndex(qIndex);
    }
  };

  // 5. Submit & Go to Next
  const goNext = async () => {
    if (!studentExamId || !currentQuestion) return;
    if (currentIndex === questions.length - 1) return;
    try {
      const { data } = await apiService.post<any>(
        '/EducationAndInternship/Student/exams/submit-next',
        {
          student_exam_id: parseInt(studentExamId),
          question_id: currentQuestion.question_id,
          answer: currentAnswer?.selectedOptionText || "",
          answer_id: currentAnswer?.selectedOptionId ? parseInt(currentAnswer.selectedOptionId) : null,
          question_index: currentIndex
        }
      );
      if (data?.success) {
        const nextIndex = currentIndex + 1;
        if (nextIndex < questions.length) {
          if (data.data?.current_question || data.data?.question) {
            updateQuestionState(data.data.current_question || data.data.question);
          }
          setCurrentIndex(nextIndex);
        }
      }
    } catch (err) {
      console.error("Failed to move next:", err);
      if (currentIndex < questions.length - 1) setCurrentIndex(i => i + 1);
    }
  };

  // 7. Submit & Go to Previous
  const goPrev = async () => {
    if (!studentExamId || !currentQuestion || currentIndex === 0) return;
    try {
      const { data } = await apiService.post<any>(
        '/EducationAndInternship/Student/exams/submit-previous',
        {
          student_exam_id: parseInt(studentExamId),
          question_id: currentQuestion.question_id,
          answer: currentAnswer?.selectedOptionText || "",
          answer_id: currentAnswer?.selectedOptionId ? parseInt(currentAnswer.selectedOptionId) : null,
          question_index: currentIndex
        }
      );
      if (data?.success) {
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
          if (data.data?.current_question || data.data?.question) {
            updateQuestionState(data.data.current_question || data.data.question);
          }
          setCurrentIndex(prevIndex);
        }
      }
    } catch (err) {
      console.error("Failed to move prev:", err);
      if (currentIndex > 0) setCurrentIndex(i => i - 1);
    }
  };

  // 8. Submit Final Exam (Direct)
  const handleFinalSubmitDirect = async () => {
    if (submitted || !studentExamId) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await apiService.post<any>(
        '/EducationAndInternship/Student/exams/submit-exam',
        {
          student_exam_id: parseInt(studentExamId)
        }
      );

      if (error) {
        setError(error);
        setIsSubmitting(false);
        return;
      }

      if (data?.success) {
        setSubmitted(true);
        setTimeout(() => navigate(`/exams/${encodeURIComponent(examInfo?.exam_name || "Exam")}/result/${studentExamId}`), 1000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit exam");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Submit Answer with Finish (Last Question)
  const handleSubmitLastQuestion = async () => {
    if (submitted || !studentExamId || !currentQuestion) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await apiService.post<any>(
        '/EducationAndInternship/Student/exams/submit',
        {
          student_exam_id: parseInt(studentExamId),
          question_id: currentQuestion.question_id,
          answer: currentAnswer?.selectedOptionText || "",
          answer_id: currentAnswer?.selectedOptionId ? parseInt(currentAnswer.selectedOptionId) : null,
          finish: true
        }
      );

      if (error) {
        setError(error);
        setIsSubmitting(false);
        return;
      }

      if (data?.success) {
        setSubmitted(true);
        setTimeout(() => navigate(`/exams/${encodeURIComponent(examInfo?.exam_name || "Exam")}/result/${studentExamId}`), 1000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit exam");
      setIsSubmitting(false);
    }
  };


  const confirmSubmit = () => {
    setShowSubmitConfirm(false);
    handleSubmitLastQuestion();
  };

  // Question palette button styles
  const getQuestionButtonClass = (answer: AnswerState, index: number) => {
    const baseClasses = "w-10 h-10 rounded-lg font-semibold transition-all duration-200 border relative flex items-center justify-center cursor-default";
    const isCurrent = currentIndex === index;

    if (isCurrent) {
      return `${baseClasses} bg-blue-600 text-white border-blue-700 ring-2 ring-blue-400`;
    }
    if (answer.selectedOptionId !== null) {
      return `${baseClasses} bg-green-500 text-white border-green-600`;
    }
    if (answer.visited && answer.selectedOptionId === null) {
      return `${baseClasses} bg-yellow-400 text-gray-900 border-yellow-500`;
    }

    return `${baseClasses} ${isDark
      ? "bg-red-900/40 text-red-400 border-red-800"
      : "bg-red-100 text-red-600 border-red-200"
      }`;
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4 mx-auto" />
          <p className={isDark ? "text-gray-300" : "text-gray-600"}>Loading exam...</p>
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

  if (!currentQuestion) return null;

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} p-4`}>
      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-2xl p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mx-auto mb-4">
              <FaFlag className="text-yellow-600 text-xl" />
            </div>
            <h3 className={`text-xl font-bold text-center mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
              Submit Exam?
            </h3>
            <p className={`text-center mb-6 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              You have answered {counts.answered} out of {questions.length} questions.
              Are you sure you want to submit?
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
                disabled={isSubmitting}
                className={`flex-1 py-3 rounded-lg font-semibold text-white ${isDark
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gradient-to-r from-[#1487d6] to-[#0b4a75] hover:opacity-90"
                  } disabled:opacity-50`}
              >
                {isSubmitting ? "Submitting..." : "Submit Anyway"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 1-MINUTE WARNING POPUP ─────────────────────────────── */}
      {show1MinPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" role="alertdialog" aria-modal="true">
          <div className="max-w-sm w-full rounded-2xl overflow-hidden shadow-2xl">
            {/* Red header bar */}
            <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg leading-tight">⚠️ Last 1 Minute!</h3>
            </div>
            {/* Body */}
            <div className="bg-red-50 px-6 py-5">
              <p className="text-red-800 font-semibold text-sm leading-relaxed">
                Only <span className="font-extrabold text-red-600">1 minute</span> remaining!
              </p>
              <p className="text-red-700 text-sm mt-2">
                Your exam will be <span className="font-bold">automatically saved &amp; submitted</span> when the timer reaches zero. Please review your answers quickly.
              </p>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShow1MinPopup(false)}
                  className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <PageShell
            title={examInfo?.exam_name || "Exam"}
            breadcrumb={["Home", "Exam", "Attempt"]}
          />
        </div>

        {/* ── 5-MINUTE WARNING BANNER ──────────────────────────────── */}
        {show5MinAlert && !submitted && (
          <div className="mb-4 flex items-start gap-3 bg-red-600 text-white px-5 py-4 rounded-xl shadow-lg">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-bold text-sm">⚠️ Last 5 Minutes Remaining!</p>
              <p className="text-red-100 text-xs mt-0.5">
                Please review your answers. The exam will auto-submit when time expires.
              </p>
            </div>
            <button
              onClick={() => setShow5MinAlert(false)}
              className="text-red-200 hover:text-white transition-colors flex-shrink-0 ml-2"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Main Layout - Top Split, Bottom Full Width */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* LEFT SIDE - Questions & Options */}
            <div className={`lg:w-2/3 rounded-2xl p-4 sm:p-6 ${isDark ? "bg-gray-800" : "bg-white"
              }`} style={{ boxShadow: "0px 0px 24px 0px #00000014" }}>

              {/* Question Header */}
              <div className={`flex flex-col md:flex-row items-start md:items-center justify-between mb-6 p-4 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-50"
                }`}>
                <div>
                  <div className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                    {currentQuestion?.title || `Question ${currentIndex + 1}`}
                  </div>
                  <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Question {currentIndex + 1} to {questions.length}
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 md:mt-0">


                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"
                    }`}>
                    <FaClock className={isDark ? "text-gray-400" : "text-gray-600"} />
                    <span className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {formatTime(secondsLeft)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Question Text */}
              {currentQuestion && (
                <>
                  <div
                    className={`text-lg mb-8 p-4 rounded-lg ${isDark ? "bg-gray-700 text-gray-100" : "bg-blue-50 text-gray-900"}`}
                    dangerouslySetInnerHTML={{ __html: currentQuestion.text }}
                  />

                  {/* Options */}
                  <div className="space-y-4 mb-8">
                    {currentQuestion.options && currentQuestion.options.length > 0 ? currentQuestion.options.map((opt, optIdx) => {
                      const isSelected = currentAnswer?.selectedOptionId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectOption(opt.id, opt.text)}
                          disabled={submitted}
                          className={`w-full text-left rounded-xl px-6 py-4 border-2 flex items-center gap-4 transition-all duration-200
                          ${isSelected
                              ? isDark
                                ? "bg-blue-900 border-blue-600 text-white"
                                : "bg-blue-100 border-blue-500 text-blue-900"
                              : isDark
                                ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                                : "bg-white border-gray-300 text-gray-800 hover:bg-gray-50"
                            }
                          ${submitted && "opacity-70 cursor-not-allowed"}`}
                        >
                          <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2
                          ${isSelected
                              ? isDark
                                ? "bg-blue-600 border-blue-300"
                                : "bg-blue-500 border-blue-300 text-white"
                              : isDark
                                ? "bg-gray-600 border-gray-500"
                                : "bg-gray-100 border-gray-400"
                            }`}
                          >
                            <span className="font-bold">{String.fromCharCode(65 + optIdx)}</span>
                          </div>
                          <span className="flex-1 text-left" dangerouslySetInnerHTML={{ __html: opt.text }} />
                          {isSelected && (
                            <FaCircleCheck className={isDark ? "text-blue-300" : "text-blue-500"} />
                          )}
                        </button>
                      );
                    }) : (
                      <div className="text-gray-500 italic p-4">Options not available. Click Next/Previous to load question details.</div>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex gap-3">
                      <button
                        onClick={goPrev}
                        disabled={currentIndex === 0 || submitted}
                        className={`px-6 py-3 rounded-lg font-semibold flex-1 sm:flex-none ${currentIndex === 0 || submitted
                          ? isDark
                            ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : isDark
                            ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                      >
                        ← Previous
                      </button>

                      <button
                        onClick={handleClear}
                        disabled={!currentAnswer?.selectedOptionId || submitted}
                        className={`px-6 py-3 rounded-lg font-semibold flex-1 sm:flex-none ${!currentAnswer?.selectedOptionId || submitted
                          ? isDark
                            ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : isDark
                            ? "bg-red-700 text-white hover:bg-red-600"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                      >
                        Clear Answer
                      </button>
                    </div>

                    <div className="flex gap-3">
                      {currentIndex < questions.length - 1 ? (
                        <button
                          onClick={goNext}
                          disabled={submitted}
                          className={`px-8 py-3 rounded-lg font-semibold text-white flex-1 sm:flex-none ${submitted
                            ? "bg-gray-400 cursor-not-allowed"
                            : isDark
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-gradient-to-r from-[#1487d6] to-[#0b4a75] hover:opacity-90"
                            }`}
                        >
                          Next Question →
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowSubmitConfirm(true)}
                          disabled={submitted || isSubmitting}
                          className={`px-8 py-3 rounded-lg font-semibold text-white flex-1 sm:flex-none ${submitted || isSubmitting
                            ? "bg-gray-400 cursor-not-allowed"
                            : isDark
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-gradient-to-r from-green-600 to-green-700 hover:opacity-90"
                            }`}
                        >
                          Submit Exam
                        </button>
                      )}
                    </div>
                  </div>

                </>
              )}
            </div>

            {/* RIGHT SIDE - Student Info & Question Palette */}
            <div className={`lg:w-1/3 rounded-2xl p-4 sm:p-6 ${isDark ? "bg-gray-800" : "bg-white"
              }`} style={{ boxShadow: "0px 0px 24px 0px #00000014" }}>

              {/* Student Info */}
              <div className="mb-8">
                <h3 className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                  Student Information
                </h3>
                <div className={`p-4 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-50"}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-600"
                      }`}>
                      {studentInfo?.image_url ? (
                        <img
                          src={studentInfo.image_url}
                          alt={studentInfo.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <FaCircleUser size={24} />
                      )}
                    </div>
                    <div>
                      <div className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                        {studentInfo?.name || "Student Name"}
                      </div>
                      <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        Exam Candidate
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={isDark ? "text-gray-400" : "text-gray-600"}>Email:</span>
                      <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                        {studentInfo?.email || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? "text-gray-400" : "text-gray-600"}>Phone:</span>
                      <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                        {studentInfo?.phone || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timer Section */}
              <div className={`mb-8 p-4 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-50"
                }`}>
                <h3 className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                  Time Remaining
                </h3>
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${secondsLeft < 300
                    ? "text-red-500 animate-pulse"
                    : isDark
                      ? "text-green-400"
                      : "text-green-600"
                    }`}>
                    {formatTime(secondsLeft)}
                  </div>
                  <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    {secondsLeft < 300
                      ? "Hurry up! Time is running out!"
                      : "You have sufficient time left"}
                  </div>
                </div>
              </div>

              {/* Submit Block */}
              <div className="mb-4">
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  disabled={submitted || isSubmitting}
                  className={`w-full mt-6 py-3 rounded-lg font-bold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] ${submitted
                    ? "bg-gray-400 cursor-not-allowed"
                    : isDark
                      ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 shadow-lg shadow-green-900/30"
                      : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 shadow-lg shadow-green-600/30"
                    }`}
                >
                  {isSubmitting ? "Submitting..." : "Submit Exam"}
                </button>
              </div>

              {/* Color Code Legend */}
              <div className={`mt-6 space-y-3 p-4 rounded-xl border ${isDark ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded bg-green-500 border border-green-600 flex-shrink-0"></div>
                  <span className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Answered</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded bg-yellow-400 border border-yellow-500 flex-shrink-0"></div>
                  <span className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Visited</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded flex-shrink-0 ${isDark ? "bg-red-900/40 border-red-800" : "bg-red-100 border-red-200"}`}></div>
                  <span className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Not Visited</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded bg-blue-600 border border-blue-700 flex-shrink-0"></div>
                  <span className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Current</span>
                </div>
              </div>

            </div>
          </div>

          {/* BOTTOM FULL WIDTH - Question Palette */}
          {currentQuestion && (
            <div className={`w-full rounded-2xl p-4 sm:p-6 ${isDark ? "bg-gray-800" : "bg-white"
              }`} style={{ boxShadow: "0px 0px 24px 0px #00000014" }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  Question Palette
                </h3>
              </div>

              <div className="flex flex-wrap gap-3 mb-8">
                {answers.map((ans, idx) => (
                  <div
                    key={ans.questionId}
                    className={getQuestionButtonClass(ans, idx)}
                  >
                    {idx + 1}
                    {ans.flagged && (
                      <div className="absolute -top-1.5 -right-1.5 bg-red-100 rounded-full p-0.5 shadow-sm">
                        <FaFlag size={10} className="text-red-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};