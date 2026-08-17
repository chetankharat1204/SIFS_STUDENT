import { NavLink, useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBook,
  FaClipboardList,
  FaPencilAlt,
  FaCheckCircle,
  FaProjectDiagram,
  FaBriefcase,
  FaBullhorn,
  FaHeadset,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import { apiService } from "../../services/apiService";

const allLinks = [
  { to: "/", label: "Dashboard", icon: FaTachometerAlt, key: "always" },
  { to: "/courses", label: "Courses", icon: FaBook, key: "always" },
  { to: "/assignments", label: "Assignments", icon: FaClipboardList, key: "assignments" },
  { to: "/exams", label: "Exams", icon: FaPencilAlt, key: "exams" },
  { to: "/tests", label: "Tests", icon: FaCheckCircle, key: "quizzes" },
  { to: "/projects", label: "Projects", icon: FaProjectDiagram, key: "studentProject" },
  { to: "/casestudy", label: "CaseStudy", icon: FaBriefcase, key: "studentCaseStudy" },
  { to: "/announcements", label: "Announcements", icon: FaBullhorn, key: "always" },
  { to: "/supports", label: "Supports", icon: FaHeadset, key: "always" },
];

export default function Navbar() {
  const location = useLocation();
  const [firstLoad, setFirstLoad] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isTabActive, setIsTabActive] = useState(false);
  const [visibleLinks, setVisibleLinks] = useState(() => {
    const cached = localStorage.getItem("dashboard_cached_data");
    if (cached) {
      try {
        const counts = JSON.parse(cached);
        return allLinks.filter(link => {
          if (link.key === "always") return true;
          const countValue = counts[link.key];
          return typeof countValue === 'number' && countValue > 0;
        });
      } catch (e) { /* ignore */ }
    }
    return allLinks.filter(l => l.key === "always");
  });

  // Fetch dashboard data to determine menu visibility
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Throttle: Don't fetch if last fetch was less than 30 seconds ago
        const lastFetch = localStorage.getItem("dashboard_last_fetch_time");
        const now = Date.now();
        if (lastFetch && now - parseInt(lastFetch) < 30000) {
          return;
        }

        const { data } = await apiService.get<any>('/EducationAndInternship/Student/dashboard');
        if (data) {
          let counts = data.data || data;

          if (counts && counts.success && counts.data) {
            counts = counts.data;
          }

          if (Array.isArray(counts) && counts.length > 0) {
            counts = counts[0];
          }

          if (counts) {
            const filtered = allLinks.filter(link => {
              if (link.key === "always") return true;

              // Allow if count exists and is > 0
              const countValue = counts[link.key];
              return typeof countValue === 'number' && countValue > 0;
            });

            setVisibleLinks(filtered);
          }
        }
      } catch (err) {
        console.error("Failed to load nav counts", err);
        // Fallback: show all or just always? 
        // Showing just always is safer to avoid showing empty sections, 
        // but if API fails, maybe we should show all to let user try?
        // User requested strict "greater than 0" logic, so we stick to that.
        // If fetch fails, we stay with initial state (only always visible).
      }
    };

    fetchCounts();
  }, []);

  // Listen for tab changes and check if any tab is active
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      const { index } = event.detail;
      setIsTabActive(index !== null);
    };

    window.addEventListener('dashboard:tab-change', handleTabChange as EventListener);

    // Check initial state from localStorage
    const savedTab = localStorage.getItem("dashboard-active-tab");
    setIsTabActive(savedTab !== null);

    return () => {
      window.removeEventListener('dashboard:tab-change', handleTabChange as EventListener);
    };
  }, []);

  // Once route changes from "/", disable firstLoad
  useEffect(() => {
    if (location.pathname !== "/") {
      setFirstLoad(false);
    }
    // close mobile menu on navigation change
    setMobileOpen(false);
  }, [location.pathname]);

  // Reset dashboard tabs when Dashboard link is clicked
  const handleDashboardClick = (e: React.MouseEvent) => {
    // Clear tab state
    localStorage.removeItem("dashboard-active-tab");
    setIsTabActive(false);

    // Dispatch event to notify Dashboard component
    window.dispatchEvent(new CustomEvent("dashboard:reset"));

    // If we're already on dashboard, prevent default navigation
    if (location.pathname === "/") {
      e.preventDefault();
      // Force re-render of dashboard by triggering state change
      window.dispatchEvent(new CustomEvent("dashboard:tab-change", {
        detail: { index: null, name: null }
      }));
    }
  };

  // Determine if Dashboard should be active
  const isDashboardActive = () => {
    if (location.pathname !== "/") return false;

    // Dashboard is active only when no tab is selected AND it's either first load or explicit navigation
    return !isTabActive && (firstLoad || location.pathname === "/");
  };

  return (
    <nav className="bg-[#00467A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0">
        <div className="flex items-center justify-between md:justify-start md:gap-8 py-2">
          {/* Left side: Brand or Logo placeholder */}
          <div className="flex items-center">
            {/* optional small logo area */}
          </div>

          {/* Desktop menu (md+) */}
          <ul className="hidden md:flex gap-1 lg:gap-2 text-white items-center w-full justify-between whitespace-nowrap">
            {visibleLinks.map((l) => {
              const Icon = l.icon;
              const isDashboardLink = l.to === "/";

              return (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    end={l.to === "/"}
                    onClick={isDashboardLink ? handleDashboardClick : undefined}
                    className={({ isActive }) => {
                      // Special handling for Dashboard link
                      if (isDashboardLink) {
                        const active = isDashboardActive() ? "menu-border font-semibold" : "hover:bg-white/10 rounded-md";
                        return `px-1.5 lg:px-2 py-2 flex text-[12px] lg:text-[14px] items-center gap-1 transition ${active}`;
                      }

                      // Normal handling for other links
                      const active = isActive ? "menu-border font-semibold" : "hover:bg-white/10 rounded-md";
                      return `px-1.5 lg:px-2 py-2 flex text-[12px] lg:text-[14px] items-center gap-1 transition ${active}`;
                    }}
                  >
                    <Icon className="text-[14px] lg:text-[16px]" />
                    {l.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen((s) => !s)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              {mobileOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        <div
          className={`md:hidden transition-max-h duration-300 overflow-hidden ${mobileOpen ? "max-h-[600px]" : "max-h-0"
            }`}
        >
          <ul className="flex flex-col gap-1 text-white text-sm py-2">
            {visibleLinks.map((l) => {
              const Icon = l.icon;
              const isDashboardLink = l.to === "/";

              return (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    end={l.to === "/"}
                    onClick={(e) => {
                      setMobileOpen(false);
                      if (isDashboardLink) {
                        handleDashboardClick(e);
                      }
                    }}
                    className={({ isActive }) => {
                      // Special handling for Dashboard link
                      if (isDashboardLink) {
                        const active = isDashboardActive()
                          ? "menu-border font-semibold bg-white/10"
                          : "hover:bg-white/5";
                        return `w-full block px-3 py-2 flex text-[16px] items-center gap-2 transition ${active}`;
                      }

                      // Normal handling for other links
                      const active = isActive
                        ? "menu-border font-semibold bg-white/10"
                        : "hover:bg-white/5";
                      return `w-full block px-3 py-2 flex text-[16px] items-center gap-2 transition ${active}`;
                    }}
                  >
                    <Icon size={18} />
                    {l.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}