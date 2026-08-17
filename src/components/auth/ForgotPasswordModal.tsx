import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { studentAuthAPI } from "../../services/apiService";
import toast from "react-hot-toast";

type Props = { onClose: () => void };

export default function ForgotPasswordModal({ onClose }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendReset() {
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await studentAuthAPI.forgetPassword(email);

      if (error) {
        throw new Error(error);
      }

      if (data && data.success) {
        toast.success(data.message || "Reset link sent to your email (check inbox).");
        onClose();
      } else {
        throw new Error(data?.message || "Failed to send reset link");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/*  Light gray overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "#0202028a" }}
        onClick={onClose}
      />

      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
          {/* Close icon */}
          <button
            onClick={onClose}
            className="absolute right-5 top-3 text-white bg-[#7B7C7E] rounded-2xl w-5 h-5 text-lg font-bold flex items-center justify-center cursor-pointer"
          >
            <X size={15} strokeWidth={2.5} />
          </button>

          <h3 className="text-[24px] font-bold mb-1">Forget password !</h3>
          <p className="text-[16px] text-black font-normal mb-6">
            Enter your email to receive a password reset link.
          </p>

          <label className="block text-xs text-black mb-2 font-normal text-[14px]">
            Email
          </label>
          <input
            className="w-full border border-gray-300 p-2 rounded mb-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Enter your email"
          />

          <div className="w-full">
            <button
              onClick={sendReset}
              className="px-4 py-3 bg-gradient-to-r from-[#008DD2] to-[#00467A] text-white w-full text-[16px] font-bold rounded-md cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  Sending...
                </div>
              ) : (
                "Send Mail"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
