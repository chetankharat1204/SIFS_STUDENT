import React, { useMemo, useState, useEffect } from "react";
import PageShell from "../../components/PageShell";
import { SquareUserRound, PenIcon } from 'lucide-react';
import { useTheme } from "../../contexts/ThemeContext";
import { studentAuthAPI } from "../../services/apiService"; // Add this import
import toast from "react-hot-toast";

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  state: string;
  country: string;
};

type TabItem = { id: string; label: string; icon: React.ReactNode };

const TabButton = React.memo(function TabButton({
  id,
  label,
  icon,
  active,
  onClick,
  isDark,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: (id: string) => void;
  isDark: boolean;
}) {
  return (
    <button
      id={`${id}-tab`}
      role="tab"
      aria-selected={active}
      aria-controls={`${id}-panel`}
      onClick={() => onClick(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer
      ${active
          ? "bg-[#008DD2] text-white shadow"
          : isDark
            ? "text-gray-300 hover:bg-gray-700"
            : "text-slate-700 hover:bg-slate-50"
        }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-[16px] font-bold">{label}</span>
    </button>
  );
});

/* ------------------- SIMPLE INPUT COMPONENT ------------------- */
function Input({
  label,
  value,
  onChange,
  type = "text",
  isDark,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  isDark: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"
        }`}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full border px-3 py-3 ${isDark
          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          : "border-slate-200 text-slate-800 bg-white"
          } ${disabled ? "opacity-70 cursor-not-allowed" : ""}`}
      />
    </div>
  );
}
/* ---------------------------------------------------------------- */

export const Profile: React.FC = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState("account");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    country: "India",
  });

  const [imageUrl, setImageUrl] = useState("/profile.jpg");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | number | null>(null);


  const tabs = useMemo<TabItem[]>(
    () => [
      { id: "account", label: "Account", icon: <SquareUserRound size={20} /> },
    ],
    []
  );

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);

    const { data, error } = await studentAuthAPI.getProfile();

    if (error || !data?.success) {
      toast.error(error || "Failed to load profile");
      setIsLoading(false);
      return;
    }

    // Extract user data from the nested response structure
    let userData = (data as any)?.data?.user || (data as any)?.user || (data as any)?.data || data;

    // Handle the case where user data is wrapped in an object with index "0"
    if (userData && typeof userData === 'object' && userData["0"]) {
      userData = userData["0"];
    }

    if (userData && typeof userData === 'object') {
      // Update localStorage so other components (like Header) sync up
      localStorage.setItem("studentData", JSON.stringify(userData));
      window.dispatchEvent(new CustomEvent('profile-updated'));

      setUserId(userData.id || null);
      setForm({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        address: userData.address || "",
        state: userData.state || "",
        country: userData.country || "India",
      });

      // Prioritize image_url if it's an absolute path
      const imageField = userData.image_url || userData.image;
      const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL ? `${import.meta.env.VITE_IMAGE_BASE_URL}/uploads/student/` : "/uploads/student/";

      if (imageField && typeof imageField === 'string' && imageField.trim() !== "") {
        const timestamp = new Date().getTime();
        // If it's already a full URL, use it; otherwise, prepend the base URL
        const fullUrl = imageField.startsWith('http') ? imageField : `${baseUrl}${imageField}`;
        setImageUrl(`${fullUrl}${fullUrl.includes('?') ? '&' : '?'}t=${timestamp}`);
      } else {
        // Fallback if no image path is found
        setImageUrl("/profile-icon.png");
      }
    }

    setIsLoading(false);
  };

  const onChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const fileRef = React.useRef<HTMLInputElement | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImageUrl(URL.createObjectURL(file));
  };

  const handleSave = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData();

      // Add id if available
      if (userId) {
        formData.append('id', userId.toString());
      }

      // Add form fields
      formData.append('name', form.name);
      formData.append('phone', form.phone);
      formData.append('address', form.address);
      formData.append('state', form.state);
      formData.append('country', form.country);

      // Add image if selected
      if (selectedFile) {
        // Using 'profile_image' as explicitly requested by the user.
        // We do NOT send 'image' field here to avoid "Unexpected file field" error.
        formData.append('profile_image', selectedFile);
      }

      const { data, error } = await studentAuthAPI.updateProfile(formData);

      if (error || !data?.success) {
        toast.error(error || data?.message || "Failed to update profile");
        return;
      }

      toast.success(data.message || "Profile updated successfully");

      // Reset selected file after successful upload
      setSelectedFile(null);

      // Refresh profile data and await it
      await fetchProfile();

    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  // Logout function
  const handleLogout = async () => {
    await studentAuthAPI.logout();
    window.location.href = "/login";
  };

  return (
    <div
      className={`py-8 px-8 rounded-[10px] ${isDark ? "bg-gray-900" : "bg-white"
        }`}
      style={{ boxShadow: "rgb(0 0 0 / 2%) 0px 0px 24px 0px;" }}
    >
      <div>
        <PageShell title="My Profile" breadcrumb={["Home", "Profile"]} />

        <div className="grid grid-cols-12 gap-6">
          {/* ------------------- LEFT SIDEBAR ------------------- */}
          <aside className="col-span-4">
            <div
              className={`rounded-[10px] p-6 ${isDark ? "bg-gray-800" : "bg-white"
                }`}
              style={{ boxShadow: "0px 0px 24px 0px #00000014" }}
            >
              <div className="flex items-center gap-4">
                {isLoading ? (
                  <div className="w-14 h-14 rounded-md bg-gray-300 animate-pulse"></div>
                ) : (
                  <img
                    src={imageUrl}
                    alt="avatar"
                    className="w-14 h-14 rounded-md object-cover"
                  />
                )}
                <div>
                  {isLoading ? (
                    <>
                      <div className="h-6 w-32 bg-gray-300 rounded animate-pulse mb-2"></div>
                      <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                    </>
                  ) : (
                    <>
                      <div className={`text-[24px] font-bold ${isDark ? "text-white" : "text-gray-900"
                        }`}>
                        {form.name || "Student"}
                      </div>
                      <div className={`text-[16px] ${isDark ? "text-gray-400" : "text-gray-600"
                        }`}>
                        Student
                      </div>
                    </>
                  )}
                </div>
              </div>

              <nav className="mt-6 space-y-3" role="tablist">
                {tabs.map((t) => (
                  <TabButton
                    key={t.id}
                    id={t.id}
                    label={t.label}
                    icon={t.icon}
                    active={activeTab === t.id}
                    onClick={setActiveTab}
                    isDark={isDark}
                  />
                ))}

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${isDark
                    ? "text-red-400 hover:bg-gray-700"
                    : "text-red-600 hover:bg-slate-50"
                    }`}
                >
                  <span className="text-lg">🚪</span>
                  <span className="text-[16px] font-bold">Logout</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* ------------------- MAIN CONTENT ------------------- */}
          <section className="col-span-8">
            <div
              className={`rounded-[10px] overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"
                }`}
              style={{ boxShadow: "0px 0px 24px 0px #00000014" }}
            >
              <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-gray-700" : "border-[#E5E5E5]"
                }`}>
                <div className={`font-semibold text-lg ${isDark ? "text-white" : "text-gray-900"
                  }`}>
                  {activeTab === "account" ? "Account Setting" : "Settings"}
                </div>

                {activeTab === "account" && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving || isLoading}
                    className={`bg-[#008DD2] text-white px-10 py-2 rounded-[4px] text-lg font-semibold cursor-pointer transition-colors ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#007cbd]'
                      }`}
                  >
                    {isSaving ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : "Save"}
                  </button>
                )}
              </div>

              <div className="p-6">
                {/* ACCOUNT TAB */}
                {activeTab === "account" && (
                  <>
                    <div className="flex">
                      <div className="relative">
                        {isLoading ? (
                          <div className="w-20 h-20 rounded-full bg-gray-300 animate-pulse"></div>
                        ) : (
                          <>
                            <img
                              src={imageUrl}
                              alt="profile"
                              className="w-20 h-20 rounded-full object-cover"
                            />
                            <button
                              onClick={() => fileRef.current?.click()}
                              disabled={isLoading || isSaving}
                              className={`absolute bottom-2 -right-1 rounded-full p-1 shadow cursor-pointer ${isDark ? "bg-gray-600" : "bg-white"
                                } ${isLoading || isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <PenIcon size={12} className={isDark ? "text-white" : "text-gray-700"} />
                            </button>
                          </>
                        )}
                        <input
                          type="file"
                          ref={fileRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageChange}
                          disabled={isLoading || isSaving}
                        />
                      </div>
                    </div>

                    <form className="pt-6 space-y-6" onSubmit={handleSave}>
                      {isLoading ? (
                        // Loading skeleton
                        <div className="grid grid-cols-2 gap-4">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Name"
                            value={form.name}
                            onChange={(v) => onChange("name", v)}
                            isDark={isDark}
                            disabled={isSaving}
                          />
                          <Input
                            label="Email"
                            type="email"
                            value={form.email}
                            onChange={(v) => onChange("email", v)}
                            isDark={isDark}
                            disabled={true} // Email should not be editable
                          />
                          <Input
                            label="Phone"
                            value={form.phone}
                            onChange={(v) => onChange("phone", v)}
                            isDark={isDark}
                            disabled={isSaving}
                          />
                          <Input
                            label="Address"
                            value={form.address}
                            onChange={(v) => onChange("address", v)}
                            isDark={isDark}
                            disabled={isSaving}
                          />
                          <Input
                            label="State"
                            value={form.state}
                            onChange={(v) => onChange("state", v)}
                            isDark={isDark}
                            disabled={isSaving}
                          />

                          <Input
                            label="Country"
                            value={form.country}
                            onChange={(v) => onChange("country", v)}
                            isDark={isDark}
                            disabled={isSaving}
                          />
                        </div>
                      )}
                    </form>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};