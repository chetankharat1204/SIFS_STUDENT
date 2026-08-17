import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageShell from "../../components/PageShell";
import { ChevronLeft } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { apiService, studentAuthAPI } from "../../services/apiService";
import { formatDate as formatDateUtil } from "../../utils/dateUtils";

type Assignment = {
  id: string;
  student_assignment_id?: number;
  course: string;
  course_name?: string;
  name: string;
  assignment_name?: string;
  date: string;
  due_date?: string;
  comment?: string;
  status: "Complete" | "Pending" | "Not Attempted";
  course_image?: string;
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
};

export default function AssignmentResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [results, setResults] = useState<ResultData | null>(null);


  // Helper to strip HTML tags
  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };


  const StatusBadge = ({ status }: { status: string }) => {
    const base = "inline-flex items-center text-xs sm:text-sm font-medium px-3 py-1 rounded-full border";

    if (status === "Complete" || status === "completed")
      return (
        <span className={`${base} bg-[#36CA0029] text-[#248600] border-[#36CA00] ${isDark ? "bg-green-900/30 border-green-500 text-green-400" : ""
          }`}>
          Complete
        </span>
      );

    if (status === "Pending" || status === "pending" || status === "submitted")
      return (
        <span className={`${base} bg-[#E28F1D33] text-[#E28F1D] border-[#E28F1D] ${isDark ? "bg-yellow-900/30 border-yellow-500 text-yellow-400" : ""
          }`}>
          Pending
        </span>
      );

    return (
      <span className={`${base} ${isDark
        ? "bg-gray-700 text-gray-300 border-gray-600"
        : "bg-gray-50 text-gray-500 border-gray-200"
        }`}>
        {status === "Not Attempted" ? "Not Attempted" : status}
      </span>
    );
  };

  // Fetch assignment result
  const fetchAssignmentResult = async () => {
    try {
      setIsLoading(true);
      setError("");

      if (!id) {
        setError("Assignment ID is required");
        return;
      }

      // Convert id to number for API call
      const assignmentId = parseInt(id);

      // Fetch result data
      const { data: resultData, error: resultError } = await apiService.get<any>(
        `/EducationAndInternship/Student/assignments/result/${assignmentId}`
      );

      if (resultError) {
        setError(resultError);
        return;
      }

      if (resultData?.success && resultData.data) {
        // Deep search for the assignment object and pagination info
        const data = resultData.data;
        let resultObj: any = null;
        let totalCount = 0;

        // Try to find total from pagination in various likely places
        totalCount = data.pagination?.total || data.total || 0;

        // Hunt for the assignment object
        if (data.assignment && typeof data.assignment === 'object') {
          // Direct assignment object (as per user's provided JSON)
          resultObj = data.assignment;
        } else if (data.data && Array.isArray(data.data)) {
          // It's in a 'data' array
          resultObj = data.data.find((item: any) => item.id?.toString() === id?.toString()) || data.data[0];
          if (data.pagination?.total) totalCount = data.pagination.total;
        } else if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
          // Nested in 'data' object
          resultObj = data.data;
          if (data.pagination?.total) totalCount = data.pagination.total;
        } else if (Array.isArray(data)) {
          // Data itself is the array
          resultObj = data.find((item: any) => item.id?.toString() === id?.toString()) || data[0];
        } else {
          // Flat structure
          resultObj = data;
        }

        if (resultObj) {
          // If we still don't have a totalCount, check resultObj itself
          if (!totalCount) totalCount = resultObj.no_question || resultObj.total_questions || 0;

          const stats = data.statistics || {};

          const isChecked = resultObj.is_checked === 1 || resultObj.is_checked === true || resultObj.check_status === "Checked" || resultObj.assignment_status === "Checked";
          let passStatus = "N/A";

          if (isChecked) {
            if (stats.is_pass === true || resultObj.is_pass === 1 || resultObj.is_pass === true || resultObj.pass_status === "Passed" || resultObj.pass_status === "Pass") {
              passStatus = "Passed";
            } else {
              passStatus = "Failed";
            }
          }

          setResults({
            total_questions: stats.total_questions || totalCount,
            total_marks: stats.total_possible_marks || resultObj.total_mark || resultObj.total_marks || 0,
            obtained_marks: resultObj.obtained_marks !== undefined ? resultObj.obtained_marks : (resultObj.total_mark || 0),
            percentage: stats.percentage !== undefined ? stats.percentage : (resultObj.percentage || 0),
            check_status: isChecked ? "Checked" : "Not Checked",
            pass_status: passStatus,
          });

          setAssignment({
            id: id || "",
            student_assignment_id: parseInt(id || "0"),
            course: resultObj.course_name || resultObj.course || resultObj.subject_name || resultObj.course_title || "N/A",
            name: stripHtml(resultObj.assignment_name || resultObj.title || resultObj.assignment_title || resultObj.name || "N/A"),
            date: formatDateUtil(data.submitted_at || resultObj.updated_at || resultObj.end_date || resultObj.due_date || resultObj.date || resultObj.created_at),
            status: (resultObj.assignment_status === "Completed" || resultObj.assignment_status === "Checked" || resultObj.status === "completed" || resultObj.status === 1 || resultObj.is_checked === 1 ? "Complete" :
              resultObj.status === "submitted" || resultObj.status === "Pending" ? "Pending" : "Not Attempted") as any,
            course_image: resultObj.course_image_url,
          });
        }
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
          avatar: user.image_url || "/profile.jpg",
        });
      }



    } catch (err: any) {
      setError(err.message || "Failed to load assignment result");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentResult();
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

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between mb-5 gap-3 md:items-center">
        <PageShell
          title="Assignments"
          breadcrumb={["Home", "All Assignments"]}
        />

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

      {/* TOP CARD */}
      <div className={`p-4 sm:p-3 rounded-xl border mt-6 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-[#EBE8E8]"
        }`}>
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">

          {/* LEFT */}
          <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
              <img
                src={assignment?.course_image || "/1754650703 1.png"}
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
                Courses
              </p>
              <h2 className={`text-lg sm:text-xl font-bold ${isDark ? "text-white" : "text-gray-900"
                }`}>
                {assignment?.course || "N/A"}
              </h2>

              <span className={`inline-block mt-2 text-xs sm:text-sm px-3 py-1 rounded-md border ${isDark
                ? "bg-yellow-900/30 text-yellow-400 border-yellow-500"
                : "bg-[#E28F1D29] text-[#E28F1D] border-[#E28F1D]"
                }`}>
                {assignment?.name || "N/A"}
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
                {assignment?.date || "N/A"}
              </p>
            </div>

            <div className="text-left">
              <p className={`text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"
                }`}>
                Status
              </p>
              <StatusBadge status={assignment?.status || "Not Attempted"} />
            </div>
          </div>
        </div>
      </div>

      {/* STUDENT + RESULTS GRID */}
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
  );
}