import { useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { apiService } from "../../services/apiService";
import { Link } from "react-router-dom";
import {
    BookOpen,
    Receipt,
    FileText,
    CheckCircle,
    GraduationCap,
    Briefcase,
    Award,
    Layers,
    FileCheck,
    CreditCard,
    File,
    ClipboardList,
    PenTool,
    Timer,
    ArrowLeft
} from "lucide-react";
import type { DashboardData } from "./Dashboard";

export default function AllStats() {
    const { isDark } = useTheme();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await apiService.get<{ data: DashboardData }>('/EducationAndInternship/Student/dashboard');
                if (response.data) {
                    let rawData = response.data?.data || response.data as any;

                    if (rawData && rawData.student_info && (rawData.student_info as any)["0"]) {
                        rawData = {
                            ...rawData,
                            student_info: (rawData.student_info as any)["0"]
                        };
                    }

                    setDashboardData(rawData);
                } else {
                    setError(response.error);
                }
            } catch (err) {
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const StatCard = ({
        title,
        value,
        icon: Icon,
        bgLight,
        bgDark,
        textLight,
        textDark,
        link
    }: {
        title: string;
        value: string | number;
        icon: any;
        bgLight: string;
        bgDark: string;
        textLight: string;
        textDark: string;
        link: string;
    }) => {
        const numericValue = typeof value === 'number' ? value : parseInt(String(value)) || 0;
        const isDisabled = numericValue <= 0;
        const isExternal = link.startsWith('http');

        const CardContent = (
            <>
                <div className="z-10">
                    <p className={`text-sm font-medium mb-1 ${isDark ? "text-gray-200" : "text-gray-600"}`}>
                        {title}
                    </p>
                    <h3 className={`text-3xl font-bold ${isDark ? textDark : textLight}`}>
                        {value}
                    </h3>
                </div>

                <div className={`absolute -right-4 -bottom-4 opacity-10 transform rotate-12`}>
                    <Icon size={120} className={isDark ? textDark : textLight} />
                </div>

                <div className={`absolute right-4 top-4 p-2 rounded-xl bg-white/20 backdrop-blur-sm`}>
                    <Icon size={24} className={isDark ? textDark : textLight} />
                </div>
            </>
        );

        const baseClasses = `p-6 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden transition-all duration-300 shadow-sm ${isDark ? bgDark : bgLight}`;
        const activeClasses = isDisabled
            ? "opacity-60 cursor-not-allowed filter saturate-[0.8]"
            : "hover:scale-[1.02] cursor-pointer hover:shadow-md active:scale-95";

        if (isDisabled) {
            return (
                <div className={`${baseClasses} ${activeClasses}`} title="No data available">
                    {CardContent}
                </div>
            );
        }

        if (isExternal) {
            return (
                <a href={link} target="_blank" rel="noopener noreferrer" className={`${baseClasses} ${activeClasses}`}>
                    {CardContent}
                </a>
            );
        }

        return (
            <Link to={link || "#"} className={`${baseClasses} ${activeClasses}`}>
                {CardContent}
            </Link>
        );
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center p-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-[#3E80F9] border-t-transparent rounded-full animate-spin"></div>
                    <p className={isDark ? "text-gray-400" : "text-gray-500"}>Loading stats...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="p-10 text-center flex flex-col items-center">
                    <div className="text-red-500 mb-4 bg-red-50 p-4 rounded-lg border border-red-100 italic">
                        {error}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-[#3E80F9] text-white rounded-lg hover:bg-[#346ad3] transition-colors"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        if (!dashboardData) return null;

        const cards = [
            {
                title: "Course Prospectus",
                value: dashboardData.prospectus ? 1 : 0,
                icon: BookOpen,
                bgLight: "bg-pink-50",
                bgDark: "bg-pink-900/20",
                textLight: "text-pink-500",
                textDark: "text-pink-400",
                link: dashboardData.prospectus || "#"
            },
            {
                title: "Fee Receipt",
                value: dashboardData.studentFeeReceipt,
                icon: Receipt,
                bgLight: "bg-teal-50",
                bgDark: "bg-teal-900/20",
                textLight: "text-teal-500",
                textDark: "text-teal-400",
                link: "/feereceipt"
            },
            {
                title: "Exams",
                value: dashboardData.exams,
                icon: PenTool,
                bgLight: "bg-red-50",
                bgDark: "bg-red-900/20",
                textLight: "text-red-500",
                textDark: "text-red-400",
                link: "/exams"
            },
            {
                title: "Completed Exams",
                value: dashboardData.completedExam,
                icon: CheckCircle,
                bgLight: "bg-cyan-50",
                bgDark: "bg-cyan-900/20",
                textLight: "text-cyan-500",
                textDark: "text-cyan-400",
                link: "/completedexams"
            },
            {
                title: "Courses",
                value: dashboardData.courses,
                icon: GraduationCap,
                bgLight: "bg-purple-50",
                bgDark: "bg-purple-900/20",
                textLight: "text-purple-500",
                textDark: "text-purple-400",
                link: "/courses"
            },
            {
                title: "Tests",
                value: dashboardData.quizzes,
                icon: Timer,
                bgLight: "bg-orange-50",
                bgDark: "bg-orange-900/20",
                textLight: "text-orange-500",
                textDark: "text-orange-400",
                link: "/tests"
            },
            {
                title: "Completed Tests",
                value: dashboardData.completedQuiz,
                icon: ClipboardList,
                bgLight: "bg-indigo-50",
                bgDark: "bg-indigo-900/20",
                textLight: "text-indigo-500",
                textDark: "text-indigo-400",
                link: "/completedtests"
            },
            {
                title: "Assignments",
                value: dashboardData.assignments,
                icon: FileText,
                bgLight: "bg-blue-50",
                bgDark: "bg-blue-900/20",
                textLight: "text-blue-500",
                textDark: "text-blue-400",
                link: "/assignments"
            },
            {
                title: "Completed Assignments",
                value: dashboardData.completedAssignment,
                icon: CheckCircle,
                bgLight: "bg-violet-50",
                bgDark: "bg-violet-900/20",
                textLight: "text-violet-500",
                textDark: "text-violet-400",
                link: "/completedassignment"
            },
            {
                title: "Projects",
                value: dashboardData.studentProject,
                icon: Briefcase,
                bgLight: "bg-sky-50",
                bgDark: "bg-sky-900/20",
                textLight: "text-sky-500",
                textDark: "text-sky-400",
                link: "/projects"
            },
            {
                title: "Completed Projects",
                value: dashboardData.completedProject,
                icon: CheckCircle,
                bgLight: "bg-indigo-50",
                bgDark: "bg-indigo-900/20",
                textLight: "text-indigo-500",
                textDark: "text-indigo-400",
                link: "/completedprojects"
            },
            {
                title: "Case Studies",
                value: dashboardData.studentCaseStudy,
                icon: File,
                bgLight: "bg-rose-50",
                bgDark: "bg-rose-900/20",
                textLight: "text-rose-500",
                textDark: "text-rose-400",
                link: "/casestudy"
            },
            {
                title: "Completed Case Studies",
                value: dashboardData.completedCaseStudy,
                icon: FileCheck,
                bgLight: "bg-cyan-50",
                bgDark: "bg-cyan-900/20",
                textLight: "text-cyan-500",
                textDark: "text-cyan-400",
                link: "/casestudy"
            },
            {
                title: "ID Card",
                value: dashboardData.studentIdCard,
                icon: CreditCard,
                bgLight: "bg-pink-50",
                bgDark: "bg-pink-900/20",
                textLight: "text-pink-500",
                textDark: "text-pink-400",
                link: "/idcards"
            },
            {
                title: "Completed Modules",
                value: dashboardData.completedModules,
                icon: Layers,
                bgLight: "bg-purple-50",
                bgDark: "bg-purple-900/20",
                textLight: "text-purple-500",
                textDark: "text-purple-400",
                link: "/completedmodules"
            },
            {
                title: "Certificate",
                value: dashboardData.studentCertificate,
                icon: Award,
                bgLight: "bg-teal-50",
                bgDark: "bg-teal-900/20",
                textLight: "text-teal-500",
                textDark: "text-teal-400",
                link: "/allcertificates"
            },
            {
                title: "Admission Letter",
                value: dashboardData.admissionLetter,
                icon: FileText,
                bgLight: "bg-orange-50",
                bgDark: "bg-orange-900/20",
                textLight: "text-orange-500",
                textDark: "text-orange-400",
                link: "/admissionletters"
            },
            {
                title: "Marksheet",
                value: dashboardData.studentMarksheet,
                icon: File,
                bgLight: "bg-green-50",
                bgDark: "bg-green-900/20",
                textLight: "text-green-500",
                textDark: "text-green-400",
                link: "/allmarksheet"
            },
        ];

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <StatCard key={idx} {...card} />
                ))}
            </div>
        );
    };

    return (
        <>
            <div className={`w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-6 px-4 sm:px-6 shadow-sm rounded-[10px] transition ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <div className="flex flex-col">
                    <div className="flex items-center gap-4">
                        <Link to="/" className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition`}>
                            <ArrowLeft size={20} className={isDark ? "text-white" : "text-gray-900"} />
                        </Link>
                        <h1 className={`text-xl sm:text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                            All Statistics
                        </h1>
                    </div>
                    <p className={`text-xs sm:text-sm mt-1 ml-12 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        Sherlock Institute of Forensic Science India
                    </p>
                </div>
            </div>

            <div className={`w-full py-6 mt-4 px-4 sm:px-10 shadow-sm rounded-[10px] transition min-h-[500px] ${isDark ? "bg-gray-800" : "bg-white"}`}>
                {renderContent()}
            </div>
        </>
    );
}
