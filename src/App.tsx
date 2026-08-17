// App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/auth/Login";
import AdminRoutes from "./routes/AdminRoutes";
import ProtectedRoute from "./routes/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";

import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <ThemeProvider>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AdminRoutes />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
}