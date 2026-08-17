import { useState } from "react";
import { useTheme } from "../../../contexts/ThemeContext"; // Adjust path as needed

// Instructor data with actual working placeholder images
const instructors = [
  {
    id: 1,
    name: "Dr. Shifa Cyclewala",
    position: "Director, Hedstify Cyber Security",
    image: "/instructors/1.png"
  },
  {
    id: 2,
    name: "Dr. Rakshit Tandon",
    position: "Cyber Security Evangelist - Risk Advisory",
    image: "/instructors/2.png"
  },
  {
    id: 3,
    name: "Dr. Rohit Gautam",
    position: "Director, Hedstify Cyber Security",
    image: "/instructors/3.png"
  },
  {
    id: 4,
    name: "Dr. Nitin Pandey",
    position: "Technical Trainer, CyberPekee Foundation",
    image: "/instructors/4.png"
  },
  {
    id: 5,
    name: "Prof. Triveni Singh (IPS)",
    position: "Cyber Crime, Ulter Pradesh Police",
    image: "/instructors/5.png"
  },
  {
    id: 6,
    name: "Samir Datt",
    position: "CEO",
    image: "/instructors/6.png"
  },
  {
    id: 7,
    name: "Santosh Khodsare",
    position: "VP-Digital Forensics and Incident response",
    image: "/instructors/7.png"
  }
];

// Get initials from name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
};

// Pagination helper function
const getPageList = (currentPage: number, totalPages: number, maxVisible: number) => {
  const pages: (number | string)[] = [];
  const half = Math.floor(maxVisible / 2);
  
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("...");
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }
  
  return pages;
};

export default function InstructorsPage() {
  const [page, setPage] = useState(1);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const { isDark } = useTheme();
  
  const itemsPerPage = 6;
  
  const totalItems = instructors.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const startIndex = (page - 1) * itemsPerPage;
  const pagedInstructors = instructors.slice(startIndex, startIndex + itemsPerPage);

  const handleImageLoad = (instructorId: number) => {
    setLoadedImages(prev => new Set(prev).add(instructorId));
  };

  const handleImageError = (instructorId: number) => {
    setFailedImages(prev => new Set(prev).add(instructorId));
  };

  return (
    <div className="mx-auto rounded-lg">
      {/* Course Title */}
      <div className="mb-8">
        <h1 className={`text-[18px] font-semibold font-mulish leading-none tracking-normal ${
          isDark ? "text-white" : "text-gray-900"
        }`}>
          FCC 2: Cyber Security and OSINT
        </h1>
      </div>

      {/* Instructor Cards Grid - Full image cards with overlay text */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {pagedInstructors.map((instructor) => {
          const hasImageLoaded = loadedImages.has(instructor.id);
          const hasImageFailed = failedImages.has(instructor.id);
          const showFallback = hasImageFailed || !hasImageLoaded;

          return (
            <div
              key={instructor.id}
              className={`cursor-pointer relative rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105 group ${
                isDark ? "bg-gray-800" : "bg-gray-200"
              }`}
              style={{ height: '300px' }}
            >
              {/* Background Image Container */}
              <div className="absolute inset-0">
                {/* Fallback gradient background */}
                <div 
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                    showFallback ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ 
                    background: isDark 
                      ? 'linear-gradient(135deg, #4B5563 0%, #374151 100%)' 
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  <span className={`text-4xl font-bold ${
                    isDark ? "text-gray-300 opacity-60" : "text-white opacity-60"
                  }`}>
                    {getInitials(instructor.name)}
                  </span>
                </div>
                
                {/* Actual Image */}
                <img
                  src={instructor.image}
                  alt={instructor.name}
                  className={`w-full h-full object-cover group-hover:scale-110 transition-all duration-500 ${
                    hasImageLoaded && !hasImageFailed ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => handleImageLoad(instructor.id)}
                  onError={() => handleImageError(instructor.id)}
                />
              </div>
              
              {/* Dark Overlay for text readability */}
              <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-70 group-hover:opacity-60 transition-all duration-300 ${
                isDark ? "mix-blend-multiply" : ""
              }`}></div>
              
              {/* Text Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
                <h3 className="text-[18px] font-bold text-white font-mulish leading-none tracking-normal mb-2">
                  {instructor.name}
                </h3>
                <p className="text-[12px] font-medium text-white font-mulish leading-none tracking-normal">
                  {instructor.position}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show message if no instructors */}
      {pagedInstructors.length === 0 && (
        <div className={`text-center py-8 ${
          isDark ? "text-gray-400" : "text-gray-500"
        }`}>
          No instructors found.
        </div>
      )}

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-center">
        <div className="flex flex-wrap items-center gap-2">
          {/* Previous button */}
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`px-3 py-1 text-sm rounded-md border ${
              page === 1 
                ? isDark 
                  ? "text-gray-600 border-gray-700 cursor-not-allowed" 
                  : "text-gray-400 border-gray-300 cursor-not-allowed"
                : isDark
                  ? "text-gray-300 border-gray-600 hover:bg-gray-700"
                  : "text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
            disabled={page === 1}
          >
            Prev
          </button>

          {/* Page buttons */}
          {getPageList(page, totalPages, 7).map((p, idx) =>
            p === "..." ? (
              <span 
                key={`dot-${idx}`} 
                className={`px-3 py-1 ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p as number)}
                className={`px-3 py-1 rounded-md text-sm border font-semibold ${
                  p === page
                    ? isDark
                      ? "bg-gray-700 text-white border-gray-600"
                      : "bg-white text-[#00467A] border-[#00467A]"
                    : isDark
                      ? "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                      : "bg-white text-[#B1B1B1] border-[#EBEBEB] hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            )
          )}

          {/* Next button */}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={`px-3 py-1 text-sm rounded-md border ${
              page === totalPages 
                ? isDark 
                  ? "text-gray-600 border-gray-700 cursor-not-allowed" 
                  : "text-gray-400 border-gray-300 cursor-not-allowed"
                : isDark
                  ? "text-gray-300 border-gray-600 hover:bg-gray-700"
                  : "text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}