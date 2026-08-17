import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { apiService } from "../../services/apiService";
import { formatDate } from "../../utils/dateUtils";

// --- Type Definitions ---
type AssignmentItem = {
  id: number;
  student_assignment_id?: number;
  course_name: string;
  assignment_name: string;
  start_date: string;
  end_date: string;
  assignment_status: string;
  status: "Complete" | "Pending" | "Not Attempted";
  comment: string | null;
  isExpired?: boolean;
  isUpcoming?: boolean;
};

/* ---------------- HELPERS ---------------- */

const formatDateRange = (start: string, end: string) => {
  const s = formatDate(start);
  const e = formatDate(end);
  if (s === "N/A" && e === "N/A") return "NA";
  if (s !== "N/A" && e !== "N/A") return `${s} - ${e}`;
  return s !== "N/A" ? s : e;
};

/* ---------------- MAIN COMPONENT ---------------- */

export const AssignmentsTable: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const getStatus = (status: any, isCompleted: boolean, isSubmitted: boolean): AssignmentItem["status"] => {
      const statusStr = status !== undefined && status !== null ? String(status).toLowerCase() : "";
      if (isCompleted || statusStr === "completed" || statusStr === "complete") {
        return "Complete";
      }
      if (isSubmitted || statusStr === "submitted" || statusStr === "pending") {
        return "Pending";
      }
      return "Not Attempted";
    };

    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const response = await apiService.get<any>("/EducationAndInternship/Student/assignments");
        if (response.data?.data) {
          const assignmentList = response.data.data.data || response.data.data.assignments || [];

          const transformed = assignmentList.map((item: any) => {
            const hasAttempt = item.question_attempt && item.question_attempt.length > 0;
            const statusCalc = getStatus(
              item.assignment_status || item.status,
              item.is_completed || item.is_checked === 1,
              item.is_submitted || hasAttempt
            );

            return {
              id: item.assignment_id || item.id,
              student_assignment_id: item.id,
              course_name: item.course_name || item.course || item.subject_name || item.course_title || "N/A",
              assignment_name: item.assignment_name || item.title || item.assignment_title || item.name || "N/A",
              start_date: item.start_date || item.date || item.created_at,
              end_date: item.end_date || item.due_date,
              assignment_status: item.assignment_status || item.status || "Not Attempted",
              status: statusCalc,
              comment: item.comment || "NA",
              isExpired: (item.end_date || item.due_date) ? new Date(item.end_date || item.due_date) < new Date() : false,
              isUpcoming: (item.start_date || item.date) ? new Date(item.start_date || item.date) > new Date() : false
            };
          });

          setAssignments(transformed.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to fetch assignments", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  if (!loading && assignments.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-10">
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
          Assignments
        </h3>
        <Link
          to="/assignments"
          className="text-sm font-bold text-[#3E80F9] underline hover:text-[#2a14b8] dark:text-[#93c5fd] dark:hover:text-[#bfdbfe]"
        >
          View All
        </Link>
      </div>

      <div className={`w-full overflow-x-auto rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} shadow-sm`}>
        <table className="w-full min-w-[900px] text-left border-collapse">
          <thead>
            <tr className={isDark ? "bg-gray-700/50" : "bg-[#F8FAFC]"}>
              <th className={`p-4 text-[13px] font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>#</th>
              <th className={`p-4 text-[13px] font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>Course name</th>
              <th className={`p-4 text-[13px] font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>Assignment name</th>
              <th className={`p-4 text-[13px] font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>Date</th>
              <th className={`p-4 text-[13px] font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>Comment</th>
              <th className={`p-4 text-[13px] font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>Status</th>
              <th className={`p-4 text-[13px] font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i} className={`border-t ${isDark ? "border-gray-700" : "border-gray-50"}`}>
                  <td colSpan={7} className="p-4">
                    <div className={`h-10 rounded-lg animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-100"}`}></div>
                  </td>
                </tr>
              ))
            ) : (
              assignments.map((a, index) => (
                <tr
                  key={a.id}
                  className={`border-t transition-colors hover:bg-gray-50/50 ${isDark ? "border-gray-700 hover:bg-gray-700/30" : "border-gray-100"}`}
                >
                  <td className={`p-4 text-[13px] ${isDark ? "text-gray-300" : "text-gray-600"}`}>{index + 1}</td>
                  <td className={`p-4 text-[13px] font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}>{a.course_name}</td>
                  <td className={`p-4 text-[13px] font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}>{a.assignment_name}</td>
                  <td className={`p-4 text-[13px] font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                    {formatDateRange(a.start_date, a.end_date)}
                  </td>
                  <td className={`p-4 text-[13px] ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    {(!a.comment || a.comment === "N/A") ? "NA" : a.comment}
                  </td>
                  <td className="p-4">
                    <span className={`px-4 py-1.5 text-[12px] font-bold rounded-full border inline-block min-w-[90px] text-center ${a.status === "Complete"
                      ? "bg-[#36CA0029] border-[#36CA00] text-[#248600]"
                      : a.status === "Pending"
                         ? "bg-[#E28F1D33] border-[#E28F1D] text-[#E28F1D]"
                        : "bg-gray-200 border-gray-300 text-gray-500"
                      }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {a.status === "Complete" ? (
                      <button
                        onClick={() => navigate(`/assignments/${a.student_assignment_id || a.id}`)}
                        className="bg-[#008DD2] text-white text-[12px] font-bold py-2 px-6 rounded-full hover:bg-[#007bb8] transition-colors whitespace-nowrap cursor-pointer shadow-sm"
                      >
                        Show Result
                      </button>
                    ) : a.isUpcoming ? (
                      <button
                        disabled
                        className="border-yellow-500 text-yellow-500 text-[12px] font-bold py-2 px-6 rounded-full border bg-white whitespace-nowrap cursor-not-allowed opacity-80"
                      >
                        Coming Soon
                      </button>
                    ) : a.isExpired ? (
                      <button
                        disabled
                        className="border-[#7B7C7E] text-[#7B7C7E] text-[12px] font-bold py-2 px-6 rounded-full border bg-white whitespace-nowrap cursor-not-allowed"
                      >
                        Not Attempted
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/assignment/attempt/${a.student_assignment_id || a.id}`)}
                        className="bg-green-600 text-white text-[12px] font-bold py-2 px-6 rounded-full hover:bg-green-700 transition-colors whitespace-nowrap cursor-pointer shadow-sm"
                      >
                        Start Assignment
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};