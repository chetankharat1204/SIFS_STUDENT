// Header.tsx
import { useState, useRef, useEffect } from "react";
import {
  FaMoon,
  FaSun,
  FaChevronDown,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { studentAuthAPI } from "../../services/apiService";
import NotificationBell from "./NotificationBell";

export default function Header() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { isDark, toggleTheme } = useTheme();
  const [refreshKey, setRefreshKey] = useState(0);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    // Listen for custom profile updates
    const handleProfileUpdate = () => {
      // Force a re-render by incrementing a key
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener('profile-updated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('profile-updated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, []);

  const navigate = useNavigate();

  const handleLogout = async () => {
    await studentAuthAPI.logout();
    navigate("/login");
  };

  return (
    <header className="w-full bg-white shadow-sm h-16 flex items-center card">
      <div className="max-w-7xl mx-auto w-full px-4 flex items-center justify-between">

        {/* LEFT: Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/sifs-logo.svg"
            alt="Logo"
            className="h-10 md:h-12 object-contain"
          />
        </div>



        {/* RIGHT: Icons + Avatar */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`hidden sm:inline-flex items-center p-2 rounded-md hover:bg-gray-100 ${isDark ? "hover:bg-gray-700" : ""
              }`}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <FaSun className="text-[18px] cursor-pointer text-yellow-500 hover:text-yellow-400" />
            ) : (
              <FaMoon className="text-[18px] cursor-pointer text-gray-600 hover:text-gray-800" />
            )}
          </button>

          {/* Notification Bell with popup */}
          <NotificationBell />

          {/* AVATAR + DROPDOWN */}
          <div className="relative" ref={dropdownRef} key={refreshKey}>
            <div
              className={`flex items-center space-x-2 cursor-pointer p-1 rounded-md hover:bg-gray-100 ${isDark ? "hover:bg-gray-700" : ""
                }`}
              onClick={() => setOpen(!open)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen(!open); }}
            >
              {(() => {
                const savedData = localStorage.getItem("studentData");
                const student = savedData ? JSON.parse(savedData) : null;
                const imageField = student?.image_url || student?.image;
                const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL;

                // Use a timestamp to bust the browser cache for the updated image
                const timestamp = new Date().getTime();
                const rawUrl = imageField
                  ? (imageField.startsWith('http') ? imageField : `${baseUrl}${imageField}`)
                  : "/profile-icon.png";

                const imageUrl = rawUrl.includes('?') ? `${rawUrl}&t=${timestamp}` : `${rawUrl}?t=${timestamp}`;

                return (
                  <>
                    <img
                      src={imageUrl}
                      alt="Avatar"
                      className={`h-9 w-9 rounded-full object-cover border ${isDark ? "border-gray-600" : "border-gray-200"
                        }`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/profile-icon.png";
                      }}
                    />
                  </>
                );
              })()}
              <FaChevronDown
                className={`text-[14px] transition-transform ${isDark ? "text-gray-300" : "text-gray-700"
                  } ${open ? "rotate-180" : ""}`}
              />
            </div>

            {/* DROPDOWN MENU */}
            {open && (
              <div
                className={`absolute right-0 mt-2 w-40 shadow-md rounded-md border py-2 z-50 card ${isDark ? "border-gray-700" : "border-gray-100"
                  }`}
              >
                <Link to="/profile" onClick={() => setOpen(false)}>
                  <button className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${isDark
                    ? "text-gray-300 hover:bg-gray-700"
                    : "text-gray-700 hover:bg-gray-100"
                    }`}>
                    Profile
                  </button>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-red-50 ${isDark
                    ? "text-red-400 hover:bg-red-900/20"
                    : "text-red-600 hover:bg-red-50"
                    }`}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}