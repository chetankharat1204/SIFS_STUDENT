// src/routes/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";

type Props = { children: React.ReactNode };

export default function ProtectedRoute({ children }: Props) {
  const token = localStorage.getItem("sifsStudentAuthToken");
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
