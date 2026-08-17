import React, { useMemo, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext"; // Adjust path as needed

type CompletedTest = {
  id: string;
  courseName: string;
  testName: string;
  date: string;
  status: "Complete" | "Pending";
};

const SAMPLE_COMPLETED_TESTS: CompletedTest[] = [
  { id: "1", courseName: "FSP 104: Forensic Science Fundamentals", testName: "Final Test", date: "30/05/25 - 28/06/25", status: "Complete" },
  { id: "2", courseName: "FSP 105: Criminalistics", testName: "Mid Term Test", date: "25/05/25 - 23/06/25", status: "Complete" },
  { id: "3", courseName: "FSP 104: Forensic Science Fundamentals", testName: "Practical Test", date: "20/04/25 - 18/05/25", status: "Complete" },
  { id: "4", courseName: "FSP 105: Criminalistics", testName: "Final Test", date: "15/04/25 - 13/05/25", status: "Complete" },
  { id: "5", courseName: "FSP 106: Digital Forensics", testName: "Quiz 1", date: "10/04/25 - 08/05/25", status: "Pending" },
  { id: "6", courseName: "FSP 107: Evidence Handling", testName: "Mid Term Test", date: "05/04/25 - 03/05/25", status: "Complete" },
  { id: "7", courseName: "FSP 108: Toxicology", testName: "Final Test", date: "01/04/25 - 29/04/25", status: "Complete" },
  { id: "8", courseName: "FSP 109: Ballistics", testName: "Practical Test", date: "25/03/25 - 23/04/25", status: "Pending" },
  { id: "9", courseName: "FSP 110: Serology", testName: "Final Test", date: "20/03/25 - 18/04/25", status: "Complete" },
];

const ITEMS_PER_PAGE = 8;

/* Helper to create pagination list with ellipsis */
function getPageList(current: number, total: number, maxButtons = 7) {
  if (total <= maxButtons) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  pages.add(current);
  for (let i = 1; i <= 2; i++) {
    if (current - i > 1) pages.add(current - i);
    if (current + i < total) pages.add(current + i);
  }
  const arr = Array.from(pages).sort((a, b) => a - b);
  const output: (number | "...")[] = [];
  for (let i = 0; i < arr.length; i++) {
    output.push(arr[i]);
    if (i + 1 < arr.length && arr[i + 1] - arr[i] > 1) output.push("...");
  }
  return output;
}

/* Status Badge - Adjusted for mobile responsiveness (text-xs) */
function StatusBadge({ status }: { status: CompletedTest["status"] }) {
  const base = "inline-flex items-center text-xs md:text-sm font-semibold px-3 md:px-4 py-1 rounded-full border whitespace-nowrap";
  if (status === "Complete")
    return (
      <span className={`${base} bg-[#36CA0029] text-[#248600] border-[#36CA00]`}>
        Complete
      </span>
    );
  return (
    <span className={`${base} bg-[#E28F1D33] text-[#E28F1D] border-[#E28F1D]`}>
      Pending
    </span>
  );
}

export const CompletedTestsPage: React.FC = () => {
  const [page, setPage] = useState<number>(1);
  const { isDark } = useTheme();
  const data = SAMPLE_COMPLETED_TESTS;

  const totalPages = Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));

  const paged = useMemo(() => {
    return data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  }, [data, page]);

  // Placeholder function for action
  const handleShowResult = (id: string) => console.log(`Showing result for test ${id}`);

  return (
    <div className="w-full p-2 sm:p-4 lg:p-0">
      <div 
        className="rounded-2xl p-4 sm:p-6 card"
        style={{ boxShadow: "0px 0px 24px 0px #00000014" }}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className={`text-xl md:text-2xl font-semibold ${
              isDark ? "text-white" : "text-gray-900"
            }`}>
              All Tests
            </h1>
            <div className={`text-sm mt-1 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}>
              Home &gt; All Tests
            </div>
          </div>
        </div>

        {/* Desktop Table (md and up) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className={`text-left text-[14px] lg:text-[16px] font-semibold ${
                isDark ? "bg-gray-800" : "bg-[#F8F8F8]"
              }`}>
                <th className={`py-3 px-4 ${
                  isDark ? "text-gray-300" : "text-gray-900"
                }`}>
                  Course Name
                </th>
                <th className={`py-3 px-4 ${
                  isDark ? "text-gray-300" : "text-gray-900"
                }`}>
                  Test name
                </th>
                <th className={`py-3 px-4 ${
                  isDark ? "text-gray-300" : "text-gray-900"
                }`}>
                  Date
                </th>
                <th className={`py-3 px-4 ${
                  isDark ? "text-gray-300" : "text-gray-900"
                }`}>
                  Status
                </th>
                <th className={`py-3 px-4 ${
                  isDark ? "text-gray-300" : "text-gray-900"
                }`}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {paged.map((r) => (
                <tr 
                  key={r.id} 
                  className={`border-b last:border-b hover:bg-gray-50 ${
                    isDark 
                      ? "border-gray-700 hover:bg-gray-800" 
                      : "border-[#D9D9D9] hover:bg-gray-50"
                  }`}
                >
                  <td className={`py-4 px-4 text-sm font-semibold whitespace-nowrap ${
                    isDark ? "text-gray-300" : "text-gray-900"
                  }`}>
                    {r.courseName}
                  </td>
                  <td className={`py-4 px-4 text-sm font-semibold whitespace-nowrap ${
                    isDark ? "text-gray-300" : "text-gray-900"
                  }`}>
                    {r.testName}
                  </td>
                  <td className={`py-4 px-4 text-sm font-semibold whitespace-nowrap ${
                    isDark ? "text-gray-300" : "text-gray-900"
                  }`}>
                    {r.date}
                  </td>
                  
                  <td className="py-4 px-4 whitespace-nowrap">
                    <StatusBadge status={r.status} />
                  </td>
                  
                  <td className="py-4 px-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleShowResult(r.id)}
                      className="inline-flex items-center px-4 py-1 rounded-full bg-[#008DD2] text-white font-semibold text-[12px] border border-[#008DD2] hover:bg-white hover:text-[#008DD2] cursor-pointer transition-all"
                    >
                      Show Result
                    </button>
                  </td>
                </tr>
              ))}

              {paged.length === 0 && (
                <tr>
                  <td 
                    colSpan={5} 
                    className={`py-8 text-center ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    No completed tests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Cards) */}
        <div className="md:hidden space-y-4">
          {paged.map((r) => (
            <div
              key={r.id}
              className={`border rounded-xl p-4 shadow-sm card ${
                isDark ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="flex flex-col gap-3 text-sm">
                <p className={isDark ? "text-gray-300" : "text-gray-900"}>
                  <span className="font-semibold">Course Name:</span> {r.courseName}
                </p>
                <p className={isDark ? "text-gray-300" : "text-gray-900"}>
                  <span className="font-semibold">Test Name:</span> {r.testName}
                </p>
                <p className={isDark ? "text-gray-300" : "text-gray-900"}>
                  <span className="font-semibold">Date:</span> {r.date}
                </p>
                
                <div className="flex justify-between items-center pt-2">
                    <StatusBadge status={r.status} />
                    <button 
                      onClick={() => handleShowResult(r.id)}
                      className="px-4 py-2 text-xs rounded-full bg-[#008DD2] text-white font-semibold border border-[#008DD2] hover:bg-white hover:text-[#008DD2] flex-shrink-0 transition-all"
                    >
                      Show Result
                    </button>
                </div>
              </div>
            </div>
          ))}

          {paged.length === 0 && (
             <div className={`py-8 text-center ${
               isDark ? "text-gray-400" : "text-gray-500"
             }`}>
                No completed tests found.
             </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-center">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Previous button */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`px-3 py-1 text-sm rounded-md border ${
                page === 1 
                  ? isDark 
                    ? "text-gray-600 border-gray-700 cursor-not-allowed" 
                    : "text-gray-400 border-gray-300 cursor-not-allowed"
                  : isDark
                    ? "text-gray-300 border-gray-600 hover:bg-gray-700"
                    : "text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
              disabled={page === 1}
            >
              Prev
            </button>
            
            {/* Page buttons */}
            {getPageList(page, totalPages, 7).map((p, idx) =>
              p === "..." ? (
                <span 
                  key={`dot-${idx}`} 
                  className={`px-3 py-1 ${
                    isDark ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`px-3 py-1 rounded-md text-sm border font-semibold ${
                    p === page
                      ? isDark
                        ? "bg-gray-700 text-white border-gray-600"
                        : "bg-white text-[#00467A] border-[#00467A]"
                      : isDark
                        ? "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                        : "bg-white text-[#B1B1B1] border-[#EBEBEB] hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            {/* Next button */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={`px-3 py-1 text-sm rounded-md border ${
                page === totalPages 
                  ? isDark 
                    ? "text-gray-600 border-gray-700 cursor-not-allowed" 
                    : "text-gray-400 border-gray-300 cursor-not-allowed"
                  : isDark
                    ? "text-gray-300 border-gray-600 hover:bg-gray-700"
                    : "text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}