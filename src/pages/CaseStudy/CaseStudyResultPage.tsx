import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { apiService, studentAuthAPI } from "../../services/apiService";
import { formatDate as formatDateUtil } from "../../utils/dateUtils";

type CaseStudy = {
  id: string;
  student_casestudy_id?: number;
  course: string;
  course_name?: string;
  caseStudyName: string;
  name?: string;
  date: string;
  start_date?: string;
  end_date?: string;
  comment?: string;
  status: "Complete" | "Pending" | "Not Attempted";
  is_completed?: boolean;
  is_submitted?: boolean;
  is_checked?: number;
  case_study_status?: string;
  no_question?: number;
  image_url?: string;
};

type StudentInfo = {
  name: string;
  email: string;
  phone: string;
  address: string;
  state: string;
  country: string;
  avatar?: string;
  image_url?: string;
};

type ResultData = {
  total_questions: number;
  total_marks: number;
  obtained_marks?: number;
  percentage: number;
  check_status: string;
  pass_status: string;
};

// StatusBadge with dark mode
const StatusBadge = ({ status, isDark = false }: { status: string; isDark?: boolean }) => {
  const base = "inline-flex items-center text-sm font-medium px-3 py-1 rounded-full border";

  if (status === "Complete" || status === "completed") {
    return (
      <span className={`${base} ${isDark
        ? "bg-green-900/30 text-green-400 border-green-500"
        : "bg-[#36CA0029] text-[#248600] border-[#36CA00]"
        }`}>
        Complete
      </span>
    );
  }
  if (status === "Pending" || status === "pending" || status === "submitted") {
    return (
      <span className={`${base} ${isDark
        ? "bg-yellow-900/30 text-yellow-400 border-yellow-500"
        : "bg-[#E28F1D33] text-[#E28F1D] border-[#E28F1D]"
        }`}>
        Pending
      </span>
    );
  }
  if (status === "Not Checked") {
    return (
      <span className={`${base} ${isDark
        ? "bg-red-900/30 text-red-400 border-red-500"
        : "bg-red-50 text-red-700 border-red-200"
        }`}>
        {status}
      </span>
    );
  }

  // Default/N/A status
  return (
    <span className={`${base} ${isDark
      ? "bg-gray-700 text-gray-300 border-gray-600"
      : "bg-gray-50 text-gray-500 border-gray-200"
      }`}>
      {status}
    </span>
  );
};

export default function CaseStudyResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [results, setResults] = useState<ResultData | null>(null);

  // Helper to strip HTML tags
  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };


  const formatDateRange = (startDate: any, endDate: any) => {
    const start = formatDateUtil(startDate);
    const end = formatDateUtil(endDate);
    if (start === "N/A" || end === "N/A") return "N/A";
    return `${start} - ${end}`;
  };

  // Fetch case study result
  const fetchCaseStudyResult = async () => {
    try {
      setIsLoading(true);
      setError("");

      if (!id) {
        setError("Case Study ID is required");
        return;
      }

      // Convert id to number for API call
      const caseStudyId = parseInt(id);

      // 1. Fetch case study details
      const { data: detailsData, error: detailsError } = await apiService.get<any>(
        `/EducationAndInternship/Student/case-studies/details/${caseStudyId}`
      );

      if (detailsError) {
        setError(detailsError);
        return;
      }

      let caseStudyObj: any = null;
      if (detailsData?.success && detailsData.data) {
        // Deep search for the case study object
        const data = detailsData.data;

        if (data.case_study && typeof data.case_study === 'object') {
          caseStudyObj = data.case_study;
        } else if (data.data && Array.isArray(data.data)) {
          caseStudyObj = data.data.find((item: any) => item.id?.toString() === id?.toString()) || data.data[0];
        } else if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
          caseStudyObj = data.data;
        } else if (Array.isArray(data)) {
          caseStudyObj = data.find((item: any) => item.id?.toString() === id?.toString()) || data[0];
        } else {
          caseStudyObj = data;
        }

        if (caseStudyObj) {
          setCaseStudy({
            id: id || "",
            student_casestudy_id: caseStudyId,
            course: caseStudyObj.course_name || caseStudyObj.course || caseStudyObj.subject_name || caseStudyObj.course_title || "N/A",
            caseStudyName: stripHtml(caseStudyObj.case_study_name || caseStudyObj.title || caseStudyObj.name || "N/A"),
            date: formatDateRange(caseStudyObj.start_date, caseStudyObj.end_date),
            status: (caseStudyObj.case_study_status === "Completed" || caseStudyObj.case_study_status === "Checked" ||
              caseStudyObj.status === "completed" || caseStudyObj.is_checked === 1 || caseStudyObj.status === 1 || caseStudyObj.status === "1" ? "Complete" : "Pending") as any,
            no_question: caseStudyObj.no_question || caseStudyObj.no_questions,
            image_url: caseStudyObj.course_image_url || caseStudyObj.course_image || caseStudyObj.image_url,
          });
        }
      }

      // 2. Fetch case study result ONLY if completed or checked
      const isCompleteOrChecked =
        caseStudyObj.case_study_status === "Completed" ||
        caseStudyObj.case_study_status === "Checked" ||
        caseStudyObj.status === "completed" ||
        caseStudyObj.is_checked === 1 ||
        caseStudyObj.status === 1 ||
        caseStudyObj.status === "1";

      if (isCompleteOrChecked) {
        const { data: resultData, error: resultError } = await apiService.get<any>(
          `/EducationAndInternship/Student/case-studies/result/${caseStudyId}`
        );

        if (!resultError && resultData?.success && resultData.data) {
          const data = resultData.data;
          let resultObj: any = null;

          // Hunt for the result object
          if (data.result && typeof data.result === 'object') {
            resultObj = data.result;
          } else if (data.case_study && typeof data.case_study === 'object') {
            resultObj = data.case_study;
          } else if (data.data && Array.isArray(data.data)) {
            resultObj = data.data.find((item: any) => item.id?.toString() === id?.toString()) || data.data[0];
          } else if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
            resultObj = data.data;
          } else if (Array.isArray(data)) {
            resultObj = data.find((item: any) => item.id?.toString() === id?.toString()) || data[0];
          } else {
            resultObj = data;
          }

          if (resultObj) {
            const stats = data.statistics || {};

            // Update caseStudy with image if available in result response
            if (data.case_study?.course_image_url) {
              setCaseStudy(prev => prev ? ({ ...prev, image_url: data.case_study.course_image_url }) : null);
            }

            const isChecked = (resultObj.is_checked && resultObj.is_checked >= 1) || resultObj.check_status === "Checked" || resultObj.case_study_status === "Checked";

            let passStatus = "NA";
            if (isChecked) {
              // Only determine pass/fail if checked
              if (stats.is_pass === true || resultObj.is_pass === 1 || resultObj.is_pass === true ||
                resultObj.pass_status === "Passed" || resultObj.pass_status === "Pass" ||
                resultObj.result_status === "Pass" || resultObj.result_status === "Passed") {
                passStatus = "Passed";
              } else {
                passStatus = "Failed";
              }
            }

            const obtained = resultObj.obtained_marks !== null && resultObj.obtained_marks !== undefined ? resultObj.obtained_marks :
              (resultObj.total_mark !== undefined ? resultObj.total_mark :
                (resultObj.mark !== undefined ? resultObj.mark : 0));

            const pct = resultObj.percentage !== undefined ? resultObj.percentage :
              (stats.percentage !== undefined ? stats.percentage : (obtained && resultObj.total_marks ?
                (obtained / resultObj.total_marks * 100).toFixed(2) : 0));

            let totalMax = resultObj.total_marks || 0;
            if (!totalMax && pct > 0) {
              totalMax = Math.round((obtained * 100) / pct);
            }

            setResults({
              total_questions: resultObj.no_question || resultObj.no_questions || caseStudyObj?.no_question || stats.total_questions || 0,
              total_marks: totalMax,
              obtained_marks: obtained,
              percentage: pct,
              check_status: isChecked ? "Checked" : "Not Checked",
              pass_status: passStatus,
            });
          }
        }
      }

      // 3. Fetch student profile
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
      setError(err.message || "Failed to load case study result");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseStudyResult();
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
        {/* ================= Header and Back Button ================= */}
        <div className="flex flex-col md:flex-row justify-between mb-5 gap-3 md:items-center">
          <div className="order-2 sm:order-1 mt-4 sm:mt-0">
            <h1 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"
              }`}>
              Case Study Result
            </h1>
            <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"
              }`}>
              Home &gt; Case Studies &gt; Result ({id})
            </p>
          </div>

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

        {/* ================= Case Study Header ================= */}
        <div className={`p-4 sm:p-3 rounded-xl border mt-6 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-[#EBE8E8]"
          }`}>
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            {/* LEFT */}
            <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                <img
                  src={caseStudy?.image_url || "https://dummyimage.com/90x70/dae2f8/7186ff"}
                  alt="Course Icon"
                  className="w-full h-full rounded-lg object-cover"
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
                  {caseStudy?.course || "N/A"}
                </h2>

                <span className={`inline-block mt-2 text-xs sm:text-sm px-3 py-1 rounded-md border ${isDark
                  ? "bg-yellow-900/30 text-yellow-400 border-yellow-500"
                  : "bg-[#E28F1D29] text-[#E28F1D] border-[#E28F1D]"
                  }`}>
                  {caseStudy?.caseStudyName || "N/A"}
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
                  {caseStudy?.date || "N/A"}
                </p>
              </div>

              <div className="text-left">
                <p className={`text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"
                  }`}>
                  Status
                </p>
                <StatusBadge status={caseStudy?.status || "Not Attempted"} isDark={isDark} />
              </div>
            </div>
          </div>
        </div>

        {/* ================= Student & Result Section ================= */}
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
                src={student?.avatar || "/profile.jpg"}
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

                <hr className={`my-3 ${isDark ? "border-gray-700" : "border-gray-200"}`} />

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
                    {results?.obtained_marks || 0}/{results?.total_marks || 0}
                  </p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Percentage
                  </p>
                  <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"
                    }`}>
                    {results?.percentage || 0}%
                  </p>
                </div>
              </div>

              <hr className={`my-4 ${isDark ? "border-gray-700" : "border-gray-200"
                }`} />

              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Check Status
                  </p>
                  <span className={`inline-block font-semibold border px-3 py-1 rounded-full text-sm mt-1 w-28 text-center ${results?.check_status === "Checked" || results?.check_status === "Complete"
                    ? isDark
                      ? "bg-green-900/30 text-green-400 border-green-500"
                      : "bg-[#36CA0029] text-[#248600] border-[#36CA00]"
                    : isDark
                      ? "bg-yellow-900/30 text-yellow-400 border-yellow-500"
                      : "bg-[#E28F1D29] text-[#E28F1D] border-[#E28F1D]"
                    }`}>
                    {results?.check_status || "Not Checked"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <p className={isDark ? "text-gray-300" : "text-gray-900"}>
                    Pass Status
                  </p>
                  <span className={`inline-block border px-3 py-1 rounded-full text-sm mt-1 w-28 text-center ${results?.pass_status === "Passed" || results?.pass_status === "Pass"
                    ? isDark
                      ? "bg-green-900/30 text-green-400 border-green-500"
                      : "bg-[#36CA0029] text-[#248600] border-[#36CA00]"
                    : results?.pass_status === "Failed" || results?.pass_status === "Fail"
                      ? isDark
                        ? "bg-red-900/30 text-red-400 border-red-500"
                        : "bg-red-100 text-red-600 border-red-300"
                      : isDark
                        ? "bg-gray-700 text-gray-300 border-gray-600"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    }`}>
                    {results?.pass_status || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}