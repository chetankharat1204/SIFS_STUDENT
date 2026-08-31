// CoursePage.tsx (Detailed Course View)
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Calendar,
  User,
  Users,
  Scan,
  Fingerprint,
  Scale,
  ChevronRight,
  ChevronLeft,
  BookOpenText,
  Bookmark,
  PlusCircle,
  CheckCircle,
  Edit,
  Save,
  X
} from 'lucide-react';
import { FaSpinner } from "react-icons/fa";
import { useTheme } from "../../../contexts/ThemeContext";
import { apiService } from "../../../services/apiService";
import type { Subject, LOS } from "../../../types/courseTypes";

export type Topic = {
  id: string;
  title: string;
  note: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: {
    year: string;
    description: string;
  }[];
};

type Module = {
  id: string;
  title: string;
  contentTitle: string;
  icon: React.ReactNode;
  topics: Topic[];
};

// Icon components for each module
const moduleIcons = {
  1: <BookOpenText size={25} className="text-white" />,
  2: <Fingerprint size={25} className="text-white" />,
  3: <Calendar size={25} className="text-white" />,
  4: <User size={25} className="text-white" />,
  5: <Users size={25} className="text-white" />,
  6: <Scan size={25} className="text-white" />,
  7: <Fingerprint size={25} className="text-white" />,
  8: <Scale size={25} className="text-white" />,
  9: <Scale size={25} className="text-white" />,
};

// Custom hook for fetching course data
const useCourseData = (courseId: string, subjectId?: number, losId?: number, locationState?: any) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [losList, setLosList] = useState<LOS[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLOS, setCurrentLOS] = useState<LOS | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [internalCourseId, setInternalCourseId] = useState(courseId);

  // Fetch course details (Item 2)
  const fetchCourseDetails = async (): Promise<{ success: boolean; id?: string }> => {
    try {
      const { data, error: apiError } = await apiService.get<any>(
        `/EducationAndInternship/Student/courses/course/${courseId}`
      );

      if (apiError) {
        console.error("Error fetching course details:", apiError);
        setError(apiError);
        return { success: false };
      }

      if (data?.success === false) {
        setError(data.message || "Course not found");
        return { success: false };
      }

      if (data?.success && data.data) {
        setCourseDetails(data.data);
        // If we are on a student course page, prioritize using the studentCourse.id
        // which corresponds to the enrollment ID (e.g. 6188) rather than the generic course_id (e.g. 106)

        const newId = data.data.studentCourse?.id?.toString();
        if (newId) {
          setInternalCourseId(newId);
          return { success: true, id: newId };
        }
        return { success: true };
      }
      return { success: false };
    } catch (err: any) {
      console.error("Error loading course details:", err);
      setError(err.message || "Failed to load course details");
      return { success: false };
    }
  };

  // Fetch subjects for the course
  const fetchSubjects = async (overrideId?: string) => {
    const targetId = overrideId || internalCourseId;
    try {
      const { data, error: apiError } = await apiService.get<any>(
        `/EducationAndInternship/Student/courses/course/${targetId}/subjects`
      );

      if (apiError) {
        setError(apiError);
        return [];
      }

      if (data?.success && data.data) {
        // Try to find the subjects array in common locations
        const subjectsData =
          (Array.isArray(data.data) ? data.data : null) ||
          data.data.subjects ||
          data.data.data ||
          data.data.subject_list ||
          [];

        const transformedSubjects: Subject[] = subjectsData.map((subject: any) => ({
          id: subject.id || subject.subject_id,
          course_id: subject.course_id || subject.courseID || parseInt(courseId),
          subject_id: subject.subject_id || subject.id,
          subject_name: subject.subject_name || subject.title || "Untitled Module",
          subject_description: subject.subject_description,
          sequence: subject.sequence || subject.order,
          status: subject.status,
        }));

        setSubjects(transformedSubjects);
        return transformedSubjects;
      }
      return [];
    } catch (err: any) {
      setError(err.message || "Failed to load subjects");
      return [];
    }
  };

  // Fetch LOS for a specific subject
  const fetchLOS = async (subjectId: number) => {
    try {
      const { data, error: apiError } = await apiService.get<any>(
        `/EducationAndInternship/Student/courses/course/${internalCourseId}/subject/${subjectId}/los`
      );

      if (apiError) {
        setError(apiError);
        return [];
      }

      if (data?.success && data.data) {
        // Try to find the LOS array in common locations
        const losData =
          (Array.isArray(data.data) ? data.data : null) ||
          data.data.los_list ||
          data.data.los ||
          data.data.data ||
          [];

        const transformedLOS: LOS[] = losData.map((los: any) => ({
          id: los.id || los.los_id,
          los_id: los.los_id || los.id,
          los_title: los.los_title || los.los_name || los.title || "Untitled LOS",
          los_description: los.los_description || los.description,
          subject_id: los.subject_id || los.subjectID || subjectId,
          subject_name: los.subject_name,
          course_id: los.course_id || los.courseID || parseInt(courseId),
          course_name: los.course_name,
          content: los.content || los.description,
          sequence: los.sequence || los.los_no,
          is_completed: los.is_completed || los.completed || los.status === 1 || !!los.completed_at || false,
          is_bookmarked: los.is_bookmarked || los.bookmarked || false,
          bookmark_id: los.bookmark_id || los.bookmarkID,
          has_note: los.has_note || false,
          note_content: los.note_content,
          created_at: los.created_at,
          updated_at: los.updated_at,
        }));

        setLosList(transformedLOS);
        return transformedLOS;
      }
      return [];
    } catch (err: any) {
      setError(err.message || "Failed to load learning objectives");
      return [];
    }
  };

  // Fetch specific LOS content
  const fetchLOSContent = async (subjectId: number, losId: number, cachedLosList?: LOS[]) => {
    try {
      const { data, error: apiError } = await apiService.get<any>(
        `/EducationAndInternship/Student/courses/course-view/${internalCourseId}/${subjectId}/${losId}`
      );

      if (apiError) {
        setError(apiError);
        return null;
      }

      if (data?.success && data.data) {
        const losContent = data.data.data || data.data.los || data.data;
        // Try to find status in existing list if missing in detail
        const listToSearch = cachedLosList || losList;
        const existingLos = listToSearch.find(l => l.los_id === (losContent.los_id || losContent.id));

        const transformedLOS: LOS = {
          id: losContent.id || losContent.los_id,
          los_id: losContent.los_id || losContent.id,
          los_title: losContent.los_title || losContent.los_name || losContent.title || "Untitled LOS",
          los_description: losContent.los_description || losContent.description,
          subject_id: losContent.subject_id || losContent.subjectID || subjectId,
          subject_name: losContent.subject_name,
          course_id: losContent.course_id || losContent.courseID || parseInt(courseId),
          course_name: losContent.course_name,
          content: losContent.content || losContent.description,
          sequence: losContent.sequence || losContent.los_no,
          is_completed: losContent.is_completed || losContent.completed || (losContent.status === 1) || !!losContent.completed_at || existingLos?.is_completed || (locationState?.markAsCompleted && String(locationState?.targetLosId) === String(losContent.los_id || losContent.id)) || false,
          is_bookmarked: losContent.is_bookmarked || existingLos?.is_bookmarked || (locationState?.markAsBookmarked && String(locationState?.targetLosId) === String(losContent.los_id || losContent.id)) || false,
          bookmark_id: losContent.bookmark_id || losContent.bookmarkID || existingLos?.bookmark_id,
          has_note: losContent.has_note || false,
          note_content: losContent.note_content || losContent.note,
          created_at: losContent.created_at,
          updated_at: losContent.updated_at,
        };

        // If we have note content passed from navigation (e.g. from Notes page), prefer that if it's the correct LOS
        if (locationState?.hasNote && String(locationState?.targetLosId) === String(transformedLOS.los_id)) {
          transformedLOS.note_content = locationState.noteContent;
          transformedLOS.has_note = true;
        }

        setCurrentLOS(transformedLOS);
        setIsBookmarked(transformedLOS.is_bookmarked || false);
        setIsCompleted(transformedLOS.is_completed || false);
        setNoteContent(transformedLOS.note_content || "");

        // Parse content for display
        const paragraphs = transformedLOS.content ? transformedLOS.content.split('\n\n') : [];
        const topic: Topic = {
          id: `los-${transformedLOS.los_id}`,
          title: transformedLOS.los_title,
          note: transformedLOS.note_content || "",
          paragraphs: paragraphs,
        };

        return topic;
      }
      return null;
    } catch (err: any) {
      setError(err.message || "Failed to load LOS content");
      return null;
    }
  };

  // Handle bookmark toggle
  const toggleBookmark = async () => {
    if (!currentLOS) return;

    try {
      const payload = {
        courseID: parseInt(courseId),
        subjectID: currentLOS.subject_id,
        losID: currentLOS.los_id,
      };

      if (isBookmarked) {
        // Remove bookmark (item 12). Use bookmark_id if available, otherwise try los_id as fallback
        const idToDelete = currentLOS.bookmark_id || currentLOS.los_id;
        const { error: apiError } = await apiService.delete(
          `/EducationAndInternship/Student/bookmarks/bookmark-delete/${idToDelete}`
        );

        if (!apiError) {
          setIsBookmarked(false);
          // Update currentLOS locally to reflect removal
          setCurrentLOS(prev => prev ? { ...prev, is_bookmarked: false, bookmark_id: undefined } : null);
        }
      } else {
        // Add bookmark (item 4)
        const { data, error: apiError } = await apiService.post<{ success: boolean; message: string }>(
          "/EducationAndInternship/Student/courses/course-bookmark",
          payload
        );

        // Check for success or "already bookmarked" message (case-insensitive)
        const isAlreadyBookmarked = data?.message?.toLowerCase().includes("already bookmarked");

        if (!apiError && (data?.success || isAlreadyBookmarked)) {
          setIsBookmarked(true);
          // Update local state without re-fetching to avoid race conditions with backend
          setCurrentLOS(prev => prev ? { ...prev, is_bookmarked: true } : null);
        }
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    }
  };

  // Handle mark as complete (item 6)
  const markAsComplete = async () => {
    if (!currentLOS || isCompleted) return;

    try {
      const payload = {
        courseID: parseInt(courseId),
        subjectID: currentLOS.subject_id,
        losID: currentLOS.los_id,
      };

      const { data, error: apiError } = await apiService.post<any>(
        "/EducationAndInternship/Student/courses/course-complete",
        payload
      );

      // The response is the ID object, not necessarily { success: true }
      if (!apiError && (data?.losID || data?.success)) {
        setIsCompleted(true);
        // Persist locally
        setCurrentLOS(prev => prev ? { ...prev, is_completed: true } : null);
      }
    } catch (err) {
      console.error("Error marking as complete:", err);
    }
  };

  // Handle save note
  const saveNote = async () => {
    if (!currentLOS) return;

    try {
      const payload = {
        courseID: parseInt(courseId),
        subjectID: currentLOS.subject_id,
        losID: currentLOS.los_id,
        note: noteContent,
      };

      const { data, error: apiError } = await apiService.post<{ success: boolean }>(
        "/EducationAndInternship/Student/courses/course-note",
        payload
      );

      if (!apiError && data?.success) {
        setIsEditingNote(false);
        setCurrentLOS(prev => prev ? { ...prev, note_content: noteContent, has_note: true } : null);
      }
    } catch (err) {
      console.error("Error saving note:", err);
    }
  };

  // Initialize data - Only on Course ID change
  useEffect(() => {
    const initData = async () => {
      // If we already have subjects and it's just a param change, 
      // let the individual fetchers (like fetchModuleData) handle it
      if (subjects.length > 0) return;

      setLoading(true);
      try {
        const detailsResult = await fetchCourseDetails();
        if (!detailsResult.success) return;

        const effectiveId = detailsResult.id || courseId;
        const subjectsData = await fetchSubjects(effectiveId);

        if (subjectsData && subjectsData.length > 0) {
          // Determine initial subject: prefer URL param, then first subject
          const targetSubId = (subjectId && !isNaN(subjectId)) ? subjectId : subjectsData[0].subject_id;

          // Only fetch LOS if we have a valid subject
          if (targetSubId) {
            const losData = await fetchLOS(targetSubId);
            if (losData && losData.length > 0) {
              const targetLosId = (losId && !isNaN(losId)) ? losId : losData[0].los_id;
              await fetchLOSContent(targetSubId, targetLosId, losData);
            }
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to initialize course data");
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [courseId]); // Removed subjectId/losId dependencies to prevent full reload

  // Convert subjects to modules for UI - Memoize to prevent unnecessary refreshes
  const modules: Module[] = useMemo(() => subjects.map((subject, index) => {
    const cleanContentTitle = subject.subject_name;

    return {
      id: `module-${subject.id}`,
      title: `Module ${index + 1}`,
      contentTitle: cleanContentTitle,
      icon: moduleIcons[(index % 9) + 1 as keyof typeof moduleIcons],
      topics: losList
        .filter(los => los.subject_id === subject.subject_id)
        .map(los => ({
          id: `los-${los.los_id}`,
          title: los.los_title,
          note: los.note_content || "",
          paragraphs: los.content ? los.content.split('\n\n') : [],
        })),
    };
  }), [subjects, losList]);

  return {
    courseDetails, // Export courseDetails
    subjects,
    modules,
    losList,
    currentLOS,
    loading,
    error,
    noteContent,
    setNoteContent,
    isEditingNote,
    setIsEditingNote,
    isBookmarked,
    isCompleted,
    toggleBookmark,
    markAsComplete,
    saveNote,
    fetchLOS,
    fetchLOSContent,
  };
};

export default function CoursePage({ courseId: propCourseId }: { courseId?: string }) {
  const location = useLocation();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // Parse URL parameters reactively
  const query = new URLSearchParams(location.search);
  const subjectParam = query.get('subject');
  const losParam = query.get('los');
  const subjectId: number | undefined = (subjectParam && !isNaN(parseInt(subjectParam))) ? parseInt(subjectParam) : undefined;
  const losId: number | undefined = (losParam && !isNaN(parseInt(losParam))) ? parseInt(losParam) : undefined;
  const urlCourseId = location.pathname.split('/').pop() || '';

  // Use prop if provided (from ReadMore), otherwise parse from URL
  const effectiveCourseId = propCourseId || urlCourseId; // Renamed for clarity

  const [activeSubjectId, setActiveSubjectId] = useState<number | null>(
    subjectId && !isNaN(subjectId) ? subjectId : null
  );
  const [selectedTopicMap, setSelectedTopicMap] = useState<Record<string, string>>({});
  const [isModuleLoading, setIsModuleLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const modulesRef = useRef<HTMLDivElement | null>(null);
  const scrollRestoredRef = useRef(false);

  // Extract YouTube ID from URL
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const [videoModal, setVideoModal] = useState<{ isOpen: boolean; videoId: string | null }>({
    isOpen: false,
    videoId: null
  });

  const renderContentWithVideos = (html: string, idx: number) => {
    let processedHtml = html;

    // Pattern to match <a> tags with youtube links
    const aTagRegex = /<a[^>]+href=["']([^"']*(?:youtube\.com|youtu\.be)[^"']*)["'][^>]*>(.*?)<\/a>/gi;

    if (aTagRegex.test(html)) {
      processedHtml = html.replace(aTagRegex, (match, url) => {
        const videoId = getYouTubeId(url);
        if (videoId) {
          return `<button 
            type="button"
            onclick="window.openVideo('${videoId}')" 
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play-circle flex-shrink-0"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
            <span>Watch Recording</span>
          </button>`;
        }
        return match;
      });
    }

    // Clean up unwanted <hr>, <br>, <p> borders and wrap buttons in flex container inside table cells
    if (processedHtml.includes('<td')) {
      processedHtml = processedHtml.replace(/<td([^>]*)>([\s\S]*?)<\/td>/gi, (_match, attrs, content) => {
        if (content.includes('Watch Recording') || content.includes('openVideo')) {
          const cleanedContent = content
            .replace(/<hr\s*\/?>/gi, '')
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/<\/?p[^>]*>/gi, ' ')
            .trim();
          return `<td${attrs}><div class="recording-btn-group flex flex-wrap items-center gap-2.5">${cleanedContent}</div></td>`;
        }
        return `<td${attrs}>${content}</td>`;
      });
    }

    // Wrap bare tables in responsive container if not already wrapped
    if (processedHtml.includes('<table') && !processedHtml.includes('table-container')) {
      processedHtml = processedHtml.replace(/<table/gi, '<div class="table-container"><table');
      processedHtml = processedHtml.replace(/<\/table>/gi, '</table></div>');
    }

    return (
      <div
        key={idx}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
        className="leading-relaxed text-sm youtube-enhanced-content w-full"
      />
    );
  };

  useEffect(() => {
    // Expose openVideo to window so our injected HTML buttons can call it
    (window as any).openVideo = (videoId: string) => {
      setVideoModal({ isOpen: true, videoId });
    };
    return () => {
      delete (window as any).openVideo;
    };
  }, []);

  const {
    subjects,
    modules,
    currentLOS,
    loading,
    error,
    noteContent,
    setNoteContent,
    isEditingNote,
    setIsEditingNote,
    isBookmarked,
    isCompleted,
    toggleBookmark,
    markAsComplete,
    saveNote,
    fetchLOS,
    fetchLOSContent,
  } = useCourseData(effectiveCourseId, subjectId as number | undefined, losId as number | undefined, location.state);

  // Memoize module tabs to prevent refresh and follow Rule of Hooks
  const moduleTabs = useMemo(() => subjects.map((s) => {
    const cleanContentTitle = s.subject_name;
    const isActive = s.subject_id === activeSubjectId;

    return (
      <button
        key={`module-tab-${s.subject_id}`}
        type="button"
        data-subject-id={s.subject_id}
        onClick={() => {
          const targetSubjectId = s.subject_id;
          // Read search directly to avoid re-rendering all tabs on every click
          const newParams = new URLSearchParams(window.location.search);
          newParams.set('subject', targetSubjectId.toString());
          newParams.delete('los');
          navigate(`?${newParams.toString()}`, { replace: true });
          setActiveSubjectId(targetSubjectId);
        }}
        className={`flex items-center justify-center px-4 md:px-5 py-2 flex-shrink-0 rounded-lg border cursor-pointer transition-all duration-200 ${isActive
          ? "bg-sky-600 text-white border-sky-600 shadow-sm font-bold"
          : isDark
            ? "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700 font-semibold"
            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-900 font-semibold"
          }`}
      >
        <span className="text-[13px] md:text-sm whitespace-nowrap truncate max-w-[200px] md:max-w-[250px]">
          {cleanContentTitle}
        </span>
      </button>
    );
  }), [subjects, activeSubjectId, isDark, navigate]);


  // Redirect to courses if error occurs (course not found)
  useEffect(() => {
    if ((error && error.includes("Course not found")) || (error && error.toLowerCase().includes("not found"))) {
      // Optional: You could show a toaster here before redirecting
      navigate("/courses");
    }
  }, [error, navigate]);

  // Fetch LOS when switching modules or when URL params change
  useEffect(() => {
    const fetchModuleData = async () => {
      const currentSubject = subjects.find(s => s.subject_id === activeSubjectId);
      if (currentSubject) {
        setIsModuleLoading(true);
        const targetSubjectId = currentSubject.subject_id;

        const losData = await fetchLOS(targetSubjectId);
        if (losData && losData.length > 0) {
          // Default to first LOS
          let targetLosId = losData[0].los_id;
          let shouldUpdateSnippet = !selectedTopicMap[`module-${currentSubject.id}`];

          // Check if URL targets a specific LOS in this module
          if (subjectId && String(targetSubjectId) === String(subjectId) && losId) {
            const found = losData.find(l => String(l.los_id) === String(losId));
            if (found) {
              targetLosId = found.los_id;
              shouldUpdateSnippet = true;
            }
          }

          if (shouldUpdateSnippet) {
            const moduleId = `module-${currentSubject.id}`;
            setSelectedTopicMap(prev => ({
              ...prev,
              [moduleId]: `los-${targetLosId}`
            }));

            await fetchLOSContent(targetSubjectId, targetLosId, losData);
          } else {
            const currentSelectedIdString = selectedTopicMap[`module-${currentSubject.id}`] || `los-${targetLosId}`;
            const currentSelectedId = parseInt(currentSelectedIdString.replace('los-', ''));

            if (currentSelectedId) {
              await fetchLOSContent(targetSubjectId, currentSelectedId, losData);
            }
          }
        }
        setIsModuleLoading(false);
      }
    };

    fetchModuleData();
  }, [activeSubjectId, subjects, effectiveCourseId, subjectId, losId]);

  // Sync activeSubjectId with URL on load and subject changes
  useEffect(() => {
    if (subjects.length > 0) {
      if (subjectId && !isNaN(subjectId)) {
        // If URL has a subject, always prioritize it
        if (activeSubjectId !== subjectId) {
          setActiveSubjectId(subjectId);
        }
      } else if (activeSubjectId === null) {
        // Only default to first subject if we don't have one set and URL doesn't have one
        setActiveSubjectId(subjects[0].subject_id);
      }
    }
  }, [subjects, subjectId]);

  const activeIndex = subjects.findIndex(s => activeSubjectId !== null && s.subject_id === activeSubjectId);
  const currentModule = activeIndex !== -1 ? modules[activeIndex] : (activeSubjectId === null ? modules[0] : null);

  useEffect(() => {
    if (!currentModule) return;

    const moduleId = currentModule.id;
    if (moduleId && !selectedTopicMap[moduleId] && currentModule.topics.length > 0) {
      setSelectedTopicMap((prev) => ({
        ...prev,
        [moduleId]: currentModule.topics[0].id,
      }));
    }
  }, [activeSubjectId, modules, subjectId, losId, subjects, currentModule, selectedTopicMap]);

  useEffect(() => {
    const container = modulesRef.current;
    if (!container || activeSubjectId === null || subjects.length === 0) return;

    // Snappier centering timeout
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        // Guard: Only skip centering if we're on the default first module AND have a saved scroll position
        const hasSavedScroll = !!sessionStorage.getItem(`course-scroll-${effectiveCourseId}`);
        const isDefaultModule = !subjectParam && activeSubjectId === subjects[0].subject_id;

        if (isDefaultModule && hasSavedScroll && !scrollRestoredRef.current) {
          return;
        }

        // Handle restoration flag
        if (scrollRestoredRef.current) {
          scrollRestoredRef.current = false;
          if (isDefaultModule) return;
        }

        const btn = container.querySelector<HTMLButtonElement>(`button[data-subject-id="${activeSubjectId}"]`);
        if (btn) {
          const targetScroll = btn.offsetLeft - (container.clientWidth / 2) + (btn.clientWidth / 2);
          container.scrollTo({ left: targetScroll, behavior: 'smooth' });
        }
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [activeSubjectId, subjects.length, subjectParam, effectiveCourseId]);

  const checkScroll = useCallback(() => {
    if (modulesRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = modulesRef.current;
      setCanScrollLeft(scrollLeft > 1);
      setCanScrollRight(Math.round(scrollLeft) < (scrollWidth - clientWidth - 5)); // Added buffer for zoom/rounding
    }
  }, []);

  const handleScroll = useCallback(() => {
    checkScroll();
    if (modulesRef.current) {
      sessionStorage.setItem(`course-scroll-${effectiveCourseId}`, modulesRef.current.scrollLeft.toString());
    }
  }, [effectiveCourseId]);

  useEffect(() => {
    // Initial check
    setTimeout(checkScroll, 100);
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [modules.length]);

  // Check scroll whenever active tab changes
  useEffect(() => {
    checkScroll();
  }, [activeSubjectId, subjects.length]);

  // Persistent scroll position restoration
  useEffect(() => {
    if (!loading && modulesRef.current) {
      const savedScroll = sessionStorage.getItem(`course-scroll-${effectiveCourseId}`);
      if (savedScroll !== null) {
        // Use a small timeout to ensure DOM layout is complete and styles are applied
        const timer = setTimeout(() => {
          if (modulesRef.current) {
            modulesRef.current.scrollLeft = parseInt(savedScroll);
            scrollRestoredRef.current = true; // Block initial auto-centering
            checkScroll();
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, effectiveCourseId]);

  function handleNext() {
    if (modulesRef.current) {
      modulesRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  }

  function handlePrev() {
    if (modulesRef.current) {
      modulesRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  }

  const selectedTopicId = currentModule ? (selectedTopicMap[currentModule.id] ?? currentModule.topics[0]?.id) : null;
  const currentTopic = currentModule?.topics.find((t) => t.id === selectedTopicId) || currentModule?.topics[0];

  function onTopicChange(topicId: string) {
    const nextLosId = parseInt(topicId.replace('los-', ''));
    if (!isNaN(nextLosId)) {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('los', nextLosId.toString());
      navigate(`?${searchParams.toString()}`, { replace: true });
    }

    if (currentModule) {
      setSelectedTopicMap((s) => ({ ...s, [currentModule.id]: topicId }));

      if (nextLosId) {
        const currentSubject = subjects.find(s => s.subject_id === activeSubjectId);
        if (currentSubject) {
          setIsModuleLoading(true);
          fetchLOSContent(currentSubject.subject_id, nextLosId).finally(() => {
            setIsModuleLoading(false);
          });
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
        <span className="ml-3 text-lg font-medium text-blue-700/80">Loading course curriculum...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 flex flex-col items-center justify-center h-72 bg-red-50/30 rounded-xl border border-red-100">
        <h2 className="text-xl font-bold text-red-400 mb-4 uppercase tracking-wide">{error}</h2>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm text-sm font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Only show "NO COURSE AVAILABLE" if we are definitively NOT loading and have no content
  if (!loading && !isModuleLoading && subjects.length > 0 && (!currentModule || !currentTopic)) {
    return (
      <div className="text-center py-10 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <BookOpenText className="text-gray-400" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-400 mb-2 uppercase">Module Content Unavailable</h2>
        <p className="text-gray-500 mb-6 max-w-md">We couldn't find any learning objectives for this module. Please try another module or reload the page.</p>
        <div className="flex gap-4">
          <button
            onClick={() => subjects[0] && setActiveSubjectId(subjects[0].subject_id)}
            className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm text-sm font-semibold"
          >
            Go to first module
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto rounded-lg">
      {/* Video Modal */}
      {videoModal.isOpen && videoModal.videoId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setVideoModal({ isOpen: false, videoId: null })}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
              <X size={24} />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${videoModal.videoId}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      )}
      {/* Module buttons with scroll */}
      <div className="flex items-center gap-3 mb-4">
        <button
          aria-label="previous module"
          onClick={handlePrev}
          className="w-9 h-9 flex-shrink-0 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canScrollLeft}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 overflow-hidden relative">
          <div
            ref={modulesRef}
            onScroll={handleScroll}
            className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2"
          >
            {moduleTabs}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-label="next module"
            onClick={handleNext}
            className="w-9 h-9 flex-shrink-0 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canScrollRight}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Bar: Topic Selection and Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 pt-2">
        {/* Topic dropdown for current module */}
        <div className="w-full md:max-w-xs">
          <label htmlFor="topic-select" className="sr-only">Select topic</label>
          <select
            id="topic-select"
            value={selectedTopicId || ''}
            onChange={(e) => onTopicChange(e.target.value)}
            className={`w-full px-4 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-200 ${isDark
              ? "bg-gray-800 border-gray-600 text-white focus:border-sky-500 shadow-sm"
              : "bg-white border-gray-300 text-gray-700 shadow-sm focus:border-sky-500"
              }`}
          >
            {currentModule?.topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
          <button
            onClick={toggleBookmark}
            className={`flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-semibold transition-all duration-200 ${isBookmarked
              ? isDark
                ? "bg-amber-900/30 text-amber-400 border-amber-500"
                : "bg-amber-50 text-amber-600 border-amber-300 shadow-sm"
              : isDark
                ? "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm"
              }`}
          >
            <Bookmark size={15} fill={isBookmarked ? "currentColor" : "none"} />
            {isBookmarked ? "Bookmarked" : "Bookmark"}
          </button>

          <button
            onClick={markAsComplete}
            className={`flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-semibold transition-all duration-200 ${isCompleted
              ? isDark
                ? "bg-green-900/30 text-green-400 border-green-500"
                : "bg-green-50 text-green-600 border-green-300 shadow-sm"
              : isDark
                ? "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm"
              }`}
          >
            <CheckCircle size={15} />
            {isCompleted ? "Completed" : "Mark as Complete"}
          </button>
        </div>
      </div>

      {/* Module content */}
      <div className="pt-6 relative min-h-[300px]">
        {isModuleLoading && (
          <div className="absolute inset-x-0 top-16 z-10 flex items-center justify-center transition-opacity duration-300">
            <FaSpinner className="animate-spin text-4xl text-sky-500" />
          </div>
        )}
        <article className={`rounded-md transition-opacity duration-300 ${isModuleLoading ? "opacity-50" : "opacity-100"} ${isDark ? "bg-gray-800" : "bg-white"
          }`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#E28F1D] flex items-center justify-center flex-shrink-0">
              {currentModule?.icon}
            </div>

            <div className="flex-1 min-w-0">
              {currentTopic ? (
                <>
                  <h4 className={`font-semibold mb-4 text-lg ${isDark ? "text-white" : "text-slate-800"
                    }`}>
                    {currentTopic.title}
                  </h4>

                  {/* Content */}
                  <div className={`space-y-4 ${isDark ? "text-gray-300" : "text-slate-600"} course-content`}>
                    {currentTopic.paragraphs && currentTopic.paragraphs.length > 0 ? (
                      currentTopic.paragraphs.map((p, idx) => {
                        const isCurriculum = currentTopic.title?.toLowerCase() === 'curriculum' || currentModule?.contentTitle?.toLowerCase() === 'curriculum';

                        if (isCurriculum) {
                          // Clean up HTML explicitly and preserve logical breaks
                          let textContent = p.replace(/<br\s*\/?>/gi, '\n')
                            .replace(/<\/p>|<\/div>|<\/li>/gi, '\n')
                            .replace(/<[^>]+>/g, ' ')
                            .replace(/&nbsp;/g, ' ')
                            .replace(/&ndash;/g, '-')
                            .replace(/&mdash;/g, '-');

                          // Force newlines before 'Module X' and 'X.X ' pattern, even if smushed with previous text
                          textContent = textContent
                            .replace(/(Module\s+\d+\s*[-–—:])/gi, '\n$1')
                            .replace(/(\d+\.\d+\s+[A-Za-z])/g, '\n$1');

                          const lines = textContent.split('\n').map(l => l.trim()).filter(l => l !== '');

                          if (lines.some(l => /^Module\s+\d+\s*[-–—:]/i.test(l))) {
                            return (
                              <div key={idx} className="curriculum-formatted-block">
                                {lines.map((line, lIdx) => {
                                  if (/^Module\s+\d+\s*[-–—:]/i.test(line)) {
                                    return (
                                      <h5 key={lIdx} className={`font-bold text-base pb-2 border-b mt-8 mb-3 ${isDark ? 'text-sky-400 border-gray-700' : 'text-sky-700 border-sky-100'}`}>
                                        {line}
                                      </h5>
                                    );
                                  }
                                  if (/^\d+\.\d+\s*/.test(line)) {
                                    return (
                                      <div key={lIdx} className={`flex items-start gap-3 py-1.5 pl-3 group transition-colors duration-200 hover:bg-sky-50 dark:hover:bg-gray-700/50 rounded-md`}>
                                        <div className="flex-shrink-0 w-[6px] h-[6px] mt-2 rounded-full bg-sky-500/70 group-hover:bg-sky-500 group-hover:scale-110 transition-all duration-200"></div>
                                        <span className={`text-[14.5px] leading-relaxed ${isDark ? 'text-gray-300 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-900'}`}>{line}</span>
                                      </div>
                                    );
                                  }
                                  return <p key={lIdx} className={`text-sm py-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{line}</p>;
                                })}
                              </div>
                            );
                          }
                        }

                        // Default rendering for other rich text
                        return renderContentWithVideos(p, idx);
                      })
                    ) : (
                      <p className="text-gray-500 italic">No content available for this topic.</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-gray-400 italic">
                  Select a topic to view its content or wait for it to load.
                </div>
              )}

              {/* Note Section */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <h5 className={`font-semibold ${isDark ? "text-white" : "text-gray-900"
                    }`}>
                    Your Notes
                  </h5>
                  {!isEditingNote ? (
                    <button
                      onClick={() => setIsEditingNote(true)}
                      className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600"
                    >
                      {noteContent && noteContent.trim().length > 0 ? (
                        <>
                          <Edit size={14} /> Edit Note
                        </>
                      ) : (
                        <>
                          <PlusCircle size={14} /> Add Note
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={saveNote}
                        className="flex items-center gap-2 text-sm text-green-500 hover:text-green-600"
                      >
                        <Save size={14} /> Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingNote(false);
                          setNoteContent(currentLOS?.note_content || "");
                        }}
                        className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600"
                      >
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  )}
                </div>

                {isEditingNote ? (
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className={`w-full h-32 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                      }`}
                    placeholder="Add your notes here..."
                  />
                ) : (
                  <div className={`p-3 border rounded-md min-h-20 ${isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-50 border-gray-300 text-gray-900"
                    }`}>
                    {noteContent || "No notes added yet."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </article>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { 
          display: none; 
        }
        .no-scrollbar { 
          -ms-overflow-style: none; 
          scrollbar-width: none; 
        }
        .course-content img {
          display: block;
          margin-left: auto;
          margin-right: auto;
          max-width: 100%;
          height: auto;
        }
        /* Modern Table Styles for Rich Text Content */
        .course-content table {
          width: 100% !important;
          min-width: 100% !important;
          border-collapse: collapse !important;
          margin: 0 !important;
          font-size: 0.9rem;
          text-align: left;
        }
        .course-content .table-container,
        .course-content figure.table {
          width: 100% !important;
          max-width: 100% !important;
          overflow-x: auto;
          margin: 1.5rem 0;
          border: 1px solid #e2e8f0;
          border-radius: 0.625rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02);
          background-color: #ffffff;
        }
        .course-content th, .course-content td {
          border: 1px solid #e2e8f0;
          padding: 0.85rem 1.25rem;
          text-align: left;
          vertical-align: middle;
        }
        .course-content th {
          background-color: #f8fafc;
          font-weight: 600;
          color: #1e293b;
          letter-spacing: 0.02em;
          border-bottom: 2px solid #e2e8f0;
        }
        .course-content tbody tr:nth-child(even) td {
          background-color: #fbfcfe;
        }
        .course-content tbody tr:hover td {
          background-color: #f1f5f9;
        }
        .course-content td hr {
          display: none !important;
        }
        .course-content td .recording-btn-group {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.625rem;
        }
        .course-content td button,
        .course-content td a {
          display: inline-flex;
          align-items: center;
          margin: 0 !important;
        }
        /* Dark mode overrides */
        .dark .course-content .table-container,
        .dark .course-content figure.table {
          border-color: #374151;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.25);
          background-color: #1f2937;
        }
        .dark .course-content th, .dark .course-content td {
          border-color: #374151;
        }
        .dark .course-content th {
          background-color: #111827;
          color: #f3f4f6;
          border-bottom: 2px solid #4b5563;
        }
        .dark .course-content tbody tr:nth-child(even) td {
          background-color: rgba(17, 24, 39, 0.4);
        }
        .dark .course-content tbody tr:hover td {
          background-color: #374151;
        }
      `}</style>
    </div>
  );
}