// PageShell.tsx
import React from "react";
import { useTheme } from "../contexts/ThemeContext";

type PageShellProps = {
  title?: string;
  subtitle?: string;
  breadcrumb?: string[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
  containerClassName?: string;
};

export default function PageShell({
  title = "",
  subtitle = "",
  breadcrumb = [],
  actions,
  children,
  containerClassName = "",
}: PageShellProps) {
  const { isDark } = useTheme();

  return (
    <div>
      <div className={`mx-auto ${containerClassName}`}>

        {/* ---------------- TOP HEADER ---------------- */}
        <div className="flex items-start justify-between gap-4 mb-6">

          <div>
            {/* ------ MAIN TITLE ------ */}
            {title && (
              <h1 className={`text-2xl font-semibold ${
                isDark ? "text-white" : "text-slate-900"
              }`}>
                {title}
              </h1>
            )}

            {/* ------ SUBTITLE ------ */}
            {subtitle && (
              <p className={`text-sm mt-1 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>
                {subtitle}
              </p>
            )}

            {/* ------ BREADCRUMB ------ */}
            {breadcrumb.length > 0 && (
              <div className={`text-sm font-semibold mt-1 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}>
                {breadcrumb.map((b, idx) => (
                  <span key={idx}>
                    {b}
                    {idx < breadcrumb.length - 1 ? " \u00A0>\u00A0 " : ""}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ------ RIGHT ACTION BUTTONS ------ */}
          {actions && <div className="mt-1">{actions}</div>}

        </div>

        {/* ---------------- PAGE CONTENT ---------------- */}
        <div>{children}</div>
      </div>
    </div>
  );
}