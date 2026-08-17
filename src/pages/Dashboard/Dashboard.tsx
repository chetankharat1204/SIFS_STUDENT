import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import CoursesShowcase from "./CoursesShowcase";
import { AssignmentsTable } from "./AssignmentsTable";
import { TestsAndAnnouncements } from "./TestsAndAnnouncements";
import CompleteCoursePage from "../Moduls/CoursesModule/CompleteCoursePage";
import InstructorsPage from "../Moduls/CoursesModule/InstructorsPage";
import BookmarksPage from "../Moduls/CoursesModule/BookmarksPage";
import NotesPage from "../Moduls/CoursesModule/NotesPage";
import { ZoomMeetings } from "./ZoomMeetings";
import { CourseRecordings } from "./CourseRecordings";

import { apiService } from "../../services/apiService";
import {


  BookOpen,

  Receipt,
  PenTool,
  CheckCircle,
} from "lucide-react";

/* ---------------- TYPES ---------------- */
//

export interface DashboardData {
  student_info: {
    name: string;
    email: string;
    phone: string;
    status: number;
    image: string;
    course_id: string | null;
  };
  courses: number;
  assignments: number;
  exams: number;
  quizzes: number;
  admissionLetter: number;
  studentMarksheet: number;
  studentCertificate: number;
  studentFeeReceipt: number;
  studentIdCard: number;
  studentProject: number;
  studentCaseStudy: number;
  completedQuiz: number;
  completedExam: number;
  completedAssignment: number;
  completedProject: number;
  completedCaseStudy: number;
  upcomingQuiz: number;
  upcomingExam: number;
  upcomingAssignment: number;
  upcomingProject: number;
  upcomingCaseStudy: number;
  completedModules: number;
  recentActivities: any[];
  performanceSummary: {
    assignments: { total: number; completed: number; pending: number };
    exams: { total: number; completed: number; pending: number };
    quizzes: { total: number; completed: number; pending: number };
    projects: { total: number; completed: number; pending: number };
    caseStudies: { total: number; completed: number; pending: number };
    overallCompletion: number;
  };
  prospectus: string;
}

/* ---------------- CONSTANTS ---------------- */

const TABS = ["Complete Course", "Instructor", "Book mark", "Notes"];

/* ---------------- STAT CARD ---------------- */

type StatCardProps = {
  bg: string;
  icon: any;
  iconColor: string;
  count: string | number;
  label: string;
  link: string;
};

function StatCard({ bg, icon: Icon, iconColor, count, label, link }: StatCardProps) {
  const { isDark } = useTheme();
  const numericCount = typeof count === 'number' ? count : parseInt(String(count)) || 0;
  const isDisabled = numericCount <= 0;

  const cardClasses = `${bg} relative overflow-hidden rounded-xl p-3 flex flex-col justify-between min-h-[90px] transition-all shadow-sm`;
  const activeClasses = isDisabled
    ? "opacity-60 cursor-not-allowed"
    : "hover:scale-[1.02] cursor-pointer hover:shadow-md active:scale-95";

  const CardContent = (
    <>
      <div className="absolute -bottom-2 -right-2 opacity-[0.05] transform rotate-12">
        <Icon size={100} className={iconColor} />
      </div>

      <div className="relative z-10 flex items-start justify-between">
        <p className={`text-[11px] font-medium leading-tight ${isDark ? "text-gray-200" : "text-gray-600"}`}>
          {label}
        </p>
        <div className={`p-1 rounded-md bg-white/40 backdrop-blur-sm`}>
          <Icon size={14} className={iconColor} />
        </div>
      </div>

      <div className="relative z-10 mt-1">
        <h4 className={`text-xl font-bold ${iconColor}`}>{count}</h4>
      </div>
    </>
  );

  if (isDisabled) {
    return (
      <div className={`${cardClasses} ${activeClasses}`} title="No items available">
        {CardContent}
      </div>
    );
  }

  return (
    <Link to={link} className={`${cardClasses} ${activeClasses}`}>
      {CardContent}
    </Link>
  );
}

/* ---------------- DASHBOARD ---------------- */

export default function Dashboard() {
  const { isDark } = useTheme();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(() => {
    try {
      const cached = localStorage.getItem("dashboard_cached_data");
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(!dashboardData);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const isFetchingRef = React.useRef<boolean>(false);
  const dataExistsRef = React.useRef<boolean>(!!dashboardData);

  // Update ref when data changes
  useEffect(() => {
    dataExistsRef.current = !!dashboardData;
  }, [dashboardData]);

  const [activeIndex, setActiveIndex] = useState<number | null>(() => {
    const saved = localStorage.getItem("dashboard-active-tab");
    return saved !== null ? parseInt(saved) : null;
  });

  const fetchDashboardData = useCallback(async (force: boolean = false) => {
    if (isFetchingRef.current) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    isFetchingRef.current = true;

    try {
      // Throttle: Don't fetch if last fetch was less than 30 seconds ago
      // But skip throttle if 'force' is true
      const lastFetch = localStorage.getItem("dashboard_last_fetch_time");
      const now = Date.now();
      if (!force && lastFetch && now - parseInt(lastFetch) < 30000 && dashboardData) {
        setLoading(false);
        isFetchingRef.current = false;
        return;
      }

      // Only show loading if we have no data at all
      if (!dashboardData) {
        setLoading(true);
      }
      setError(null);

      const response = await apiService.get<any>('/EducationAndInternship/Student/dashboard', {
        signal: abortControllerRef.current.signal
      });

      if (response.data) {
        let rawData = response.data?.data || response.data;

        if (rawData && rawData.success && rawData.data) {
          rawData = rawData.data;
        }

        if (Array.isArray(rawData) && rawData.length > 0) {
          rawData = rawData[0];
        }

        if (rawData && (rawData.student_info || rawData.courses !== undefined)) {
          if (rawData.student_info && (rawData.student_info as any)["0"]) {
            rawData = {
              ...rawData,
              student_info: (rawData.student_info as any)["0"]
            };
          }
          setDashboardData(rawData);
          localStorage.setItem("dashboard_cached_data", JSON.stringify(rawData));
          localStorage.setItem("dashboard_last_fetch_time", Date.now().toString());
          dataExistsRef.current = true;
        }
      } else {
        // Use ref here to avoid dependency
        if (dataExistsRef.current) {
          console.warn("API failed, using cached data:", response.error);
        } else {
          setError(response.error || "Failed to load dashboard data");
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message === 'canceled') return;

      console.error('Failed to load dashboard data', err);
      if (!dataExistsRef.current) {
        setError("Unable to connect to server. Please check your connection.");
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  /* ---------------- HEADER TEXT ---------------- */

  const getHeaderData = () => {
    if (activeIndex === null) {
      const hour = new Date().getHours();
      let greeting = "Good Evening";

      if (hour >= 5 && hour < 12) {
        greeting = "Good Morning";
      } else if (hour >= 12 && hour < 17) {
        greeting = "Good Afternoon";
      }

      let name = "Student";
      const savedUserStr = localStorage.getItem("studentData");
      if (savedUserStr) {
        try {
          const user = JSON.parse(savedUserStr);
          name = user.name?.split(' ')[0] || "Student";
        } catch (e) {
          // ignore
        }
      }

      if (dashboardData?.student_info?.name) {
        name = dashboardData.student_info.name.split(' ')[0];
      }

      return {
        title: `${greeting}, ${name} 👋`,
        subtitle: "Sherlock Institute of Forensic Science India",
      };
    }

    if (activeIndex === 0) {
      return {
        title: "Complete Course",
        subtitle: "Home / Complete Course",
      };
    }

    return {
      title: TABS[activeIndex],
      subtitle: `Home / ${TABS[activeIndex]}`,
    };
  };

  const { title, subtitle } = getHeaderData();

  /* ---------------- TAB EVENTS ---------------- */

  const emitSelection = useCallback((index: number | null) => {
    window.dispatchEvent(
      new CustomEvent("dashboard:tab-change", {
        detail: { index, name: index !== null ? TABS[index] : null },
      })
    );
  }, []);

  useEffect(() => {
    if (activeIndex !== null) {
      localStorage.setItem("dashboard-active-tab", activeIndex.toString());
    } else {
      localStorage.removeItem("dashboard-active-tab");
    }
    emitSelection(activeIndex);
  }, [activeIndex, emitSelection]);

  useEffect(() => {
    if (dashboardData && dashboardData.courses === 0 && activeIndex !== null) {
      setActiveIndex(null);
    }
  }, [dashboardData, activeIndex]);

  useEffect(() => {
    const handleReset = () => {
      setActiveIndex(null);
      localStorage.removeItem("dashboard-active-tab");
      fetchDashboardData(true); // Force re-fetch on manual reset
    };
    window.addEventListener("dashboard:reset", handleReset);
    return () => window.removeEventListener("dashboard:reset", handleReset);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (activeIndex === null) return;

    if (e.key === "ArrowRight") {
      setActiveIndex((i) => ((i ?? 0) + 1) % TABS.length);
      e.preventDefault();
    }
    if (e.key === "ArrowLeft") {
      setActiveIndex((i) => ((i ?? 0) - 1 + TABS.length) % TABS.length);
      e.preventDefault();
    }
  };

  /* ---------------- DASHBOARD CARDS ---------------- */

  const renderDashboardCards = () => {
    if (activeIndex !== null) return null;

    if (loading) {
      return (
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-24 rounded-xl animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-100"}`}></div>
          ))}
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 text-center">
          <p className="text-orange-600 dark:text-orange-400 text-sm font-medium mb-3">
            {error}
          </p>
          <button
            onClick={() => {
              setError(null);
              fetchDashboardData(true); // Force bypass on retry
            }}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all shadow-md font-bold text-xs transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[13px] font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            Dashboard
          </span>
          <Link
            to="/dashboard/all-stats"
            className="text-[14px] font-bold text-[#3E80F9] underline transition-colors hover:text-[#2a14b8] dark:text-[#93c5fd]"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            bg={isDark ? "bg-pink-900/10 border border-pink-900/20" : "bg-pink-50 border border-pink-100"}
            icon={BookOpen}
            iconColor="text-pink-500"
            count={dashboardData?.prospectus ? 1 : 0}
            label="Course Prospectus"
            link={dashboardData?.prospectus || "#"}
          />

          <StatCard
            bg={isDark ? "bg-teal-900/10 border border-teal-900/20" : "bg-teal-50 border border-teal-100"}
            icon={Receipt}
            iconColor="text-teal-500"
            count={dashboardData?.studentFeeReceipt || 0}
            label="Fee Receipt"
            link="/feereceipt"
          />

          <StatCard
            bg={isDark ? "bg-rose-900/10 border border-rose-900/20" : "bg-rose-50 border border-rose-100"}
            icon={PenTool}
            iconColor="text-rose-500"
            count={dashboardData?.exams || 0}
            label="Exams"
            link="/exams"
          />

          <StatCard
            bg={isDark ? "bg-cyan-900/10 border border-cyan-900/20" : "bg-cyan-50 border border-cyan-100"}
            icon={CheckCircle}
            iconColor="text-cyan-500"
            count={dashboardData?.completedExam || 0}
            label="Completed Exams"
            link="/completedexams"
          />
        </div>
      </div>
    );
  };

  /* ---------------- CONTENT ---------------- */

  const renderContent = () => {
    if (activeIndex === null) {
      return (
        <div className="grid grid-cols-1 gap-6">
          <ZoomMeetings />
          <CourseRecordings />
          <CoursesShowcase />
          <AssignmentsTable />
          <TestsAndAnnouncements />
        </div>
      );
    }

    switch (activeIndex) {
      case 0:
        return <CompleteCoursePage />;
      case 1:
        return <InstructorsPage />;
      case 2:
        return <BookmarksPage />;
      case 3:
        return <NotesPage />;
      default:
        return null;
    }
  };

  /* ---------------- JSX ---------------- */

  return (
    <div className={`w-full py-8 px-4 sm:px-10 shadow-sm rounded-[10px] ${isDark ? "bg-gray-800" : "bg-white"}`}>
      {/* TOP GREETING AND CARDS */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10">
        <div className="xl:max-w-xs">
          <h1 className={`text-xl sm:text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
            {title}
          </h1>
          <p className={`text-xs sm:text-sm mt-1 whitespace-nowrap ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {subtitle}
          </p>
        </div>

        {renderDashboardCards()}
      </div>

      {/* 🔹 Tab Filter (Pills) */}
      {dashboardData && dashboardData.courses > 0 && (
        <div
          className="flex items-center space-x-3 mb-10 overflow-x-auto pb-2 scrollbar-none"
          onKeyDown={onKeyDown}
        >
          {TABS.map((tab, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={tab}
                onClick={() => setActiveIndex(idx)}
                className={`px-8 py-2.5 rounded-full text-[14px] font-medium border transition-all duration-300 whitespace-nowrap ${isActive
                  ? "bg-[#ECF2FE] text-[#3E80F9] border-[#3E80F9]/20 shadow-sm"
                  : "bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-slate-50"
                  }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      )}

      {/* MAIN LISTS CONTENT */}
      {renderContent()}
    </div>
  );
}
