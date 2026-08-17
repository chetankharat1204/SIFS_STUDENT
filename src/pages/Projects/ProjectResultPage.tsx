import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { apiService, studentAuthAPI } from "../../services/apiService";
import { formatDate as formatDateUtil } from "../../utils/dateUtils";

type Project = {
  id: string;
  student_project_id?: number;
  course: string;
  course_name?: string;
  testName: string;
  projectName: string;
  title?: string;
  date: string;
  start_date?: string;
  end_date?: string;
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
  obtained_marks: number;
  percentage: number;
  check_status: string;
  pass_status: string;
};

// StatusBadge Component
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
        ? "bg-red-900/30 text-red-400 border-red-500"
        : "bg-red-50 text-red-700 border-red-200"
        }`}>
        Not Checked
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

export default function ProjectResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [project, setProject] = useState<Project | null>(null);
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

    if (start !== "N/A" && end !== "N/A") {
      return `${start} - ${end}`;
    } else if (start !== "N/A") {
      return start;
    } else if (end !== "N/A") {
      return end;
    }
    return "N/A";
  };

  // Fetch project result
  const fetchProjectResult = async () => {
    try {
      setIsLoading(true);
      setError("");

      if (!id) {
        setError("Project ID is required");
        return;
      }

      const projectId = parseInt(id);

      // 1. Fetch project result data
      const { data: resultData, error: resultError } = await apiService.get<any>(
        `/EducationAndInternship/Student/projects/result/${projectId}`
      );

      if (resultError) {
        setError(resultError);
        return;
      }

      if (resultData?.success && resultData.data) {
        const data = resultData.data;

        // Extract result information
        let resultObj = null;

        // Handle different response structures - prioritize student_project for result details
        if (data.student_project && typeof data.student_project === 'object') {
          resultObj = data.student_project;
        } else if (data.project && typeof data.project === 'object') {
          resultObj = data.project;
        } else if (data.data && Array.isArray(data.data)) {
          resultObj = data.data[0] || data.data;
        } else if (data.data && typeof data.data === 'object' && Object.keys(data.data).length > 0) {
          resultObj = data.data;
        } else {
          resultObj = data;
        }

        // Set results
        setResults({
          total_questions: resultObj.total_questions || resultObj.no_question || 0,
          total_marks: resultObj.total_marks || resultObj.total_mark || 0,
          obtained_marks: resultObj.obtained_marks || resultObj.marks_obtained || resultObj.total_mark || 0,
          percentage: resultObj.percentage || 0,
          check_status: resultObj.is_checked === 1 ? "Checked" : "Not Checked",
          pass_status: resultObj.is_pass === 1 ? "Passed" : (resultObj.is_checked === 1 && resultObj.is_pass === 0) ? "Failed" : "NA",
        });

        // Determine status using more robust logic
        const hasAttempt = resultObj.question_attempt && (Array.isArray(resultObj.question_attempt) ? resultObj.question_attempt.length > 0 : resultObj.question_attempt.toString().length > 0);
        const isSubmitted = resultObj.is_submitted === 1 || resultObj.is_submitted === true || hasAttempt;
        const isCompleted = resultObj.is_completed === 1 || resultObj.is_completed === true || resultObj.is_checked === 1 || resultObj.status === "completed" || resultObj.status === "Complete" || resultObj.status === 1 || resultObj.status === "1";

        setProject({
          id: id || "",
          student_project_id: projectId,
          course: resultObj.course_name || resultObj.course || "NA",
          testName: resultObj.test_name || resultObj.testName || "",
          projectName: `${resultObj.test_name || resultObj.testName || ""} ${stripHtml(resultObj.project_name || resultObj.title || "")}`.trim(),
          date: formatDateRange(resultObj.start_date, resultObj.end_date),
          status: (isCompleted ? "Complete" : isSubmitted ? "Pending" : "Not Attempted") as any,
          course_image: resultObj.course_image_url || (resultObj.course_image ? (resultObj.course_image.startsWith('http') ? resultObj.course_image : `${import.meta.env.VITE_IMAGE_BASE_URL || ""}/uploads/${resultObj.course_image}`) : null),
        });
      }

      // 2. Fetch student profile
      const { data: profileData, error: profileError } = await studentAuthAPI.getProfile();

      if (!profileError && profileData?.success && profileData.data?.user) {
        const user = profileData.data.user;
        setStudent({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          address: user.address || "",
          state: user.state || "",
          country: user.country || "India", // Default to India
          avatar: user.image_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=60",
        });
      }



    } catch (err: any) {
      setError(err.message || "Failed to load project result");
      console.error("Fetch project result error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectResult();
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
      <div className={`p-4 m-4 rounded-lg ${isDark ? "bg-red-900/20 text-red-300" : "bg-red-100 text-red-700"
        }`}>
        <p>{error}</p>
        <button
          onClick={() => navigate(-1)}
          className={`mt-2 px-4 py-2 rounded ${isDark
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
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
        {/* Header and Back Button */}
        <div className="flex flex-col md:flex-row justify-between mb-5 gap-3 md:items-center">
          <div className="order-2 sm:order-1 mt-4 sm:mt-0">
            <h1 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"
              }`}>
              Project Result
            </h1>
            <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"
              }`}>
              Home &gt; Projects &gt; Result
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

        {/* Project Header */}
        <div className={`p-4 sm:p-3 rounded-xl border mt-6 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-[#EBE8E8]"
          }`}>
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            {/* LEFT */}
            <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                <img
                  src={project?.course_image || "https://dummyimage.com/90x70/dae2f8/7186ff"}
                  alt="Course Icon"
                  className="w-full h-full rounded-lg object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://dummyimage.com/90x70/dae2f8/7186ff";
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
                  {project?.course || ""}
                </h2>

                {/* Display Project Name (which now includes Test Name/Code) */}
                <div className="flex gap-2 mt-2">
                  <span className={`inline-block text-xs sm:text-sm px-3 py-1 rounded-md border ${isDark
                    ? "bg-yellow-900/30 text-yellow-400 border-yellow-500"
                    : "bg-orange-50 text-orange-700 border-orange-200"
                    }`}>
                    {project?.projectName || ""}
                  </span>
                </div>
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
                  {project?.date || ""}
                </p>
              </div>

              <div className="text-left">
                <p className={`text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"
                  }`}>
                  Status
                </p>
                <StatusBadge status={project?.status || "Not Attempted"} isDark={isDark} />
              </div>
            </div>
          </div>
        </div>

        {/* Student & Result Section */}
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

        {/* More Projects */}
        {/* <div className="mt-10">
          <div className="flex flex-row justify-between items-start mb-3 gap-3">
            <h3 className={`text-xl sm:text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"
              }`}>
              More Projects
            </h3>
            <button
              onClick={() => navigate("/projects")}
              className={`font-bold text-sm underline ${isDark ? "text-blue-400" : "text-blue-600"
                } hover:no-underline`}
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className={`w-full min-w-[900px] table-auto ${isDark ? "bg-gray-800" : "bg-white"
              } rounded-xl`}>
              <thead>
                <tr className={`text-left text-sm ${isDark ? "bg-gray-700" : "bg-[#F8F8F8]"
                  }`}>
                  <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-500"
                    }`}>
                    Course name
                  </th>
                  <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-500"
                    }`}>
                    Date
                  </th>
                  <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-500"
                    }`}>
                    Project
                  </th>
                  <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-500"
                    }`}>
                    Project Name
                  </th>
                  <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-500"
                    }`}>
                    Status
                  </th>
                  <th className={`py-3 px-4 ${isDark ? "text-gray-300" : "text-gray-500"
                    }`}>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {moreProjects.map((project) => (
                  <tr
                    key={project.id}
                    className={`border-t last:border-b hover:text-sm ${isDark
                      ? "border-gray-700 hover:bg-gray-700"
                      : "border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    <td className={`py-4 px-4 text-sm ${isDark ? "text-gray-300" : "text-gray-900"
                      }`}>
                      {project.course}
                    </td>
                    <td className={`py-4 px-4 text-sm ${isDark ? "text-gray-300" : "text-gray-900"
                      }`}>
                      {project.date}
                    </td>
                    <td className={`py-4 px-4 text-sm ${isDark ? "text-gray-300" : "text-gray-900"
                      }`}>
                      NA
                    </td>
                    <td className={`py-4 px-4 text-sm ${isDark ? "text-gray-300" : "text-gray-900"
                      }`}>
                      {project.projectName}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={project.status} isDark={isDark} />
                    </td>
                    <td className="py-4 px-4">
                      {project.status === "Complete" ? (
                        <button
                          onClick={() => navigate(`/projects/${project.student_project_id || project.id}`)}
                          className={`px-3 py-1 text-sm border rounded-full transition-colors ${isDark
                            ? "bg-blue-900/30 text-blue-400 border-blue-500 hover:bg-blue-800/30"
                            : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                            }`}
                        >
                          Show Result
                        </button>
                      ) : (
                        <button className={`px-3 py-1 text-sm border rounded-full cursor-not-allowed ${isDark
                          ? "bg-gray-700 text-gray-500 border-gray-600"
                          : "bg-gray-50 text-gray-400 border-gray-200"
                          }`}>
                          Not Attempted
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div> */}
      </div>
    </div>
  );
}