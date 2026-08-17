import React from "react";
import Header from "./Header";
import Navbar from "./Navbar";
import { useTheme } from "../../contexts/ThemeContext"; // Adjust path as needed

type Props = { children: React.ReactNode };

export default function Layout({ children }: Props) {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <Header />
      <Navbar />
      <main className="flex-1">
        {/* Responsive padding and centered max width */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-0 lg:px-0 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}