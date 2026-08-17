import { useState, useEffect, type JSX } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { apiService } from "../../services/apiService"; // Adjust path as needed

type SupportMethod = {
  platform: string;
  contact: string;
  icon: JSX.Element;
  iconColor: string;
  bgColor: string;
  darkBgColor: string;
  type?: string;
};

const Support = () => {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [supportMethods, setSupportMethods] = useState<SupportMethod[]>([]);

  // Icon components
  const whatsappIcon = (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.176-1.24-6.165-3.495-8.411" />
    </svg>
  );

  const callIcon = (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 10.999h2C22 5.869 18.127 2 12.99 2v2C17.052 4 20 6.943 20 10.999z" />
      <path d="M13 8c2.103 0 3 .897 3 3h2c0-3.225-1.775-5-5-5v2zm3.422 5.443a1.001 1.001 0 00-1.391.043l-2.393 2.461c-.576-.11-1.734-.471-2.926-1.66-1.192-1.193-1.553-2.354-1.66-2.926l2.459-2.394a1 1 0 00.043-1.391L6.859 3.513a1 1 0 00-1.391-.087l-2.17 1.861a1 1 0 00-.29.649c-.015.25-.301 6.172 4.291 10.766C11.305 20.707 16.323 21 17.705 21c.202 0 .326-.006.359-.008a.992.992 0 00.648-.291l1.86-2.171a1 1 0 00-.086-1.391l-4.064-3.696z" />
    </svg>
  );

  const emailIcon = (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  );

  // Function to get icon based on platform type
  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'whatsapp':
      case 'whatsapp_support':
        return whatsappIcon;
      case 'call':
      case 'phone':
      case 'phone_support':
        return callIcon;
      case 'email':
      case 'e-mail':
      case 'email_support':
      default:
        return emailIcon;
    }
  };

  // Function to get styles based on platform type
  const getStylesForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'whatsapp':
      case 'whatsapp_support':
        return {
          iconColor: 'text-green-500',
          bgColor: 'bg-green-100',
          darkBgColor: 'bg-green-900/20'
        };
      case 'call':
      case 'phone':
      case 'phone_support':
        return {
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-100',
          darkBgColor: 'bg-blue-900/20'
        };
      case 'email':
      case 'e-mail':
      case 'email_support':
      default:
        return {
          iconColor: 'text-red-500',
          bgColor: 'bg-red-100',
          darkBgColor: 'bg-red-900/20'
        };
    }
  };

  // Function to format platform name for display
  const formatPlatformName = (type: string, name: string) => {
    if (name) return name;

    switch (type.toLowerCase()) {
      case 'whatsapp':
      case 'whatsapp_support':
        return 'WhatsApp';
      case 'call':
      case 'phone':
      case 'phone_support':
        return 'Call';
      case 'email':
      case 'email_support':
        return 'E-mail';
      default:
        return type;
    }
  };

  // Fetch support data from API
  const fetchSupportData = async () => {
    try {
      setIsLoading(true);
      setError("");

      const { data, error } = await apiService.get<any>(
        "/EducationAndInternship/Student/supports"
      );

      if (error) {
        setError(error);
        // Fallback to default data if API fails
        setSupportMethods(getDefaultSupportMethods());
        return;
      }

      if (data?.success && data.data) {
        // Handle different possible response structures
        const supportData = data.data.data || data.data.supports || data.data || [];

        if (Array.isArray(supportData) && supportData.length > 0) {
          const formattedMethods = supportData.map((item: any) => {
            const type = item.type || item.platform || 'email';
            const styles = getStylesForType(type);

            return {
              platform: formatPlatformName(type, item.name || item.title),
              contact: item.contact || item.value || item.details || item.support_info || 'N/A',
              icon: getIconForType(type),
              iconColor: styles.iconColor,
              bgColor: styles.bgColor,
              darkBgColor: styles.darkBgColor,
              type: type
            };
          });

          setSupportMethods(formattedMethods);
        } else {
          // If no data or empty array, use defaults
          setSupportMethods(getDefaultSupportMethods());
        }
      } else {
        // If response structure is unexpected, use defaults
        setSupportMethods(getDefaultSupportMethods());
      }
    } catch (err: any) {
      setError(err.message || "Failed to load support information");
      // Fallback to default data
      setSupportMethods(getDefaultSupportMethods());
    } finally {
      setIsLoading(false);
    }
  };

  // Default support methods (fallback)
  const getDefaultSupportMethods = (): SupportMethod[] => [
    {
      platform: 'WhatsApp',
      contact: '+91 730-391-3002',
      icon: whatsappIcon,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-100',
      darkBgColor: 'bg-green-900/20',
      type: 'whatsapp'
    },
    {
      platform: 'Call',
      contact: '+91 730-391-3002',
      icon: callIcon,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-100',
      darkBgColor: 'bg-blue-900/20',
      type: 'call'
    },
    {
      platform: 'E-mail',
      contact: 'education@sifs.in',
      icon: emailIcon,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-100',
      darkBgColor: 'bg-red-900/20',
      type: 'email'
    }
  ];

  useEffect(() => {
    fetchSupportData();
  }, []);

  return (
    <div className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 ${isDark ? "bg-gray-900" : "bg-white"
      }`}>
      {/* Breadcrumb */}
      <nav className="mb-8">
        <div className="mb-0">
          <h1 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"
            }`}>
            Support
          </h1>
        </div>
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <a
              href="/"
              className={`hover:underline transition-colors ${isDark ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
                }`}
            >
              Home
            </a>
          </li>
          <li className="flex items-center">
            <span className={`mx-1 ${isDark ? "text-gray-500" : "text-gray-400"
              }`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
            <span className={`font-medium ${isDark ? "text-gray-400" : "text-gray-500"
              }`}>
              Support
            </span>
          </li>
        </ol>
      </nav>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="max-w-7xl mx-auto mb-8 p-4 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400">
          <p>{error}</p>
          <p className="text-sm mt-1">Showing default support information</p>
        </div>
      )}

      {/* Support Methods Grid */}
      <div className="max-w-7xl mx-auto">
        {!isLoading && (
          <>
            {supportMethods.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {supportMethods.map((method, index) => (
                  <div
                    key={index}
                    className={`rounded-lg border p-8 text-center transition-all duration-200 ${isDark
                      ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    {/* Icon Container */}
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? method.darkBgColor : method.bgColor
                      }`}>
                      <div className={method.iconColor}>
                        {method.icon}
                      </div>
                    </div>

                    {/* Platform Name */}
                    <h3 className={`text-xl font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"
                      }`}>
                      {method.platform}
                    </h3>

                    {/* Contact Info */}
                    <div className="mb-2">
                      <p className="mt-2">
                        <a
                          href={getHref(method.type || method.platform || '', method.contact)}
                          target={(method.type || method.platform || '').toLowerCase().includes('whatsapp') ? "_blank" : undefined}
                          rel={(method.type || method.platform || '').toLowerCase().includes('whatsapp') ? "noopener noreferrer" : undefined}
                          className={`inline-block px-4 py-2 rounded-md text-[16px] font-medium transition-all duration-200 border ${isDark
                            ? "bg-gray-700/50 border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700"
                            : "bg-[#F3F4F6] border-gray-200 text-gray-700 hover:text-black hover:bg-gray-200"
                            }`}
                        >
                          {getFormattedDisplayText(method.contact)}
                        </a>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className={`text-xl ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  No support methods available at the moment.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Helper function to generate href for different support types
const getHref = (type: string, contact: string) => {
  if (!contact || contact === 'N/A') return '#';
  const cleanedContact = contact.replace(/[- ]/g, '');

  switch (type.toLowerCase()) {
    case 'whatsapp':
    case 'whatsapp_support':
      return `https://wa.me/${cleanedContact.replace('+', '')}`;
    case 'call':
    case 'phone':
    case 'phone_support':
      return `tel:${cleanedContact}`;
    case 'email':
    case 'e-mail':
    case 'email_support':
      return `mailto:${contact.trim()}`;
    default:
      return '#';
  }
};

// Helper function to format display text (Display original contact info without protocol)
const getFormattedDisplayText = (contact: string) => {
  return contact;
};

export default Support;