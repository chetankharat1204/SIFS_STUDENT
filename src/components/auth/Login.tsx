import React, { useState, useEffect } from "react";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { useNavigate, useSearchParams } from "react-router-dom";
import { studentAuthAPI } from "../../services/apiService"; // Updated import
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if we have an auto-login response query param
  const hasAutoLoginParam = !!searchParams.get("response");

  // ✅ Default credentials for testing
  const [email, setEmail] = useState("afreentarannum08@gmail.com");
  const [password, setPassword] = useState("Sifsindia@1");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [isLoading, setIsLoading] = useState(hasAutoLoginParam);
  const [error, setError] = useState("");

  useEffect(() => {
    const responseParam = searchParams.get("response");
    if (responseParam) {
      setIsLoading(true);
      try {
        const decoded = decodeURIComponent(responseParam);
        const data = JSON.parse(decoded);

        if (data?.success) {
          // Structure from StudentsManagement.tsx is { success: boolean, message: string, data: { user, token, ... } }
          const token = data.data?.token;
          const user = data.data?.user;

          if (token) {
            localStorage.setItem("sifsStudentAuthToken", token);

            if (user) {
              let finalUser = user;
              if (user && typeof user === 'object' && user["0"]) {
                finalUser = user["0"];
              }
              localStorage.setItem("studentData", JSON.stringify(finalUser));
            }

            // Navigate to dashboard/home with replace
            navigate("/", { replace: true });
          } else {
            throw new Error("Token missing in response");
          }
        } else {
          throw new Error(data?.message || "Auto-login failed");
        }
      } catch (err: any) {
        console.error("Auto-login error:", err);
        setError(err.message || "Invalid auto-login response");
        setIsLoading(false);
      }
    }
  }, [searchParams, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Use username field for email (as per your API)
    const { data, error } = await studentAuthAPI.login(email, password);

    if (error || !data?.success) {
      setError(error || data?.message || "Invalid credentials");
      setIsLoading(false);
      return;
    }

    // Check for token in nested response shapes
    const token = (data as any)?.data?.token || (data as any)?.token;
    const user = (data as any)?.data?.user || (data as any)?.user;

    if (token) {
      // Save token to localStorage using correct key
      localStorage.setItem("sifsStudentAuthToken", token);

      // Save user data if available
      if (user) {
        let finalUser = user;
        if (user && typeof user === 'object' && user["0"]) {
          finalUser = user["0"];
        }
        localStorage.setItem("studentData", JSON.stringify(finalUser));
      }

      // Navigate to dashboard/home with replace
      navigate("/", { replace: true });
      setIsLoading(false);
    } else {
      setError("Login failed. No token received.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-5 md:p-5">
      <div
        className="w-full max-w-7xl bg-white overflow-hidden flex flex-col md:flex-row"
        style={{ minHeight: "90vh" }}
      >
        {/* LEFT SIDE */}
        <div className="w-full md:w-1/2 flex flex-col justify-between px-6 md:px-12 py-6 md:py-10">
          {/* LOGO */}
          <div className="mb-6 md:mb-10 flex justify-center">
            <img src="/sifs-logo.svg" alt="logo" className="h-10 md:h-12" />
          </div>

          {/* FORM */}
          <div className="flex-1 flex items-center">
            <div className="w-full max-w-lg mx-auto">
              <h2 className="text-lg md:text-[24px] font-semibold text-black mb-0 text-center">
                Student Sign In
              </h2>
              <p className="text-xs md:text-sm font-normal text-black mb-6 text-center">
                Sign in to your account
              </p>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <label className="block text-[14px] text-black mb-2">E-mail</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 h-10 px-3 mb-4 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                  type="email"
                  required
                  autoComplete="email"
                  disabled={isLoading}
                  placeholder="Enter your email"
                />

                <label className="block text-[14px] text-black mb-2">Password</label>
                <div className="relative mb-2">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-200 h-10 px-3 pr-10 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="flex items-center justify-end text-sm mb-6 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    disabled={isLoading}
                    className="text-[#f9a825] hover:underline text-[14px] underline cursor-pointer disabled:opacity-50"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 bg-gradient-to-r from-[#1487d6] to-[#0b4a75] text-white rounded text-[16px] font-medium transition-shadow shadow-sm cursor-pointer ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md'
                    }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {hasAutoLoginParam ? "Logging in..." : "Signing In..."}
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-6 text-[14px] text-black text-center">
            © All Rights Reserved at SIFS INDIA. 2025
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div className="w-full md:w-1/2 relative hidden md:block">
          <div className="absolute inset-0 overflow-hidden">
            <img
              src="/login-side.png"
              alt="side"
              className="h-full w-full"
              style={{ borderRadius: "0 28px 28px 0" }}
            />
          </div>
        </div>
      </div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  );
}