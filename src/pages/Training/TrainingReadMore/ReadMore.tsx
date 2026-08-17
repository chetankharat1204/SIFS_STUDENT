// ReadMore.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../../contexts/ThemeContext";
import { apiService } from "../../../services/apiService";
import { FaSpinner } from "react-icons/fa";

import TrainingPage from "./TrainingPage";
import CompleteTrainingPage from "./CompleteTrainingPage";
import InstructorsPage from "./InstructorsPage";
import BookmarksPage from "./BookmarksPage";
import NotesPage from "./NotesPage";

const TABS = [
  "Trainings",
  "Complete Training",
  "Instructor",
  "Bookmark",
  "Notes",
];

type Training = {
  id: string; // The URL/Link ID (e.g. 5636)
  training_id: number; // The actual Training ID (e.g. 55)
  title: string;
};

export default function ReadMore() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  const tabParam = new URLSearchParams(location.search).get('tab');
  const activeIndex = tabParam ? Math.max(0, TABS.findIndex(t => t.toLowerCase() === tabParam.toLowerCase())) : 0;

  const [training, setTraining] = useState<Training | null>(null);
  const [hasOpenedTrainingTab, setHasOpenedTrainingTab] = useState(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.has('subject') || searchParams.has('los') || (activeIndex === 0 && tabParam === 'trainings');
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch training details
  const fetchTrainingDetails = async () => {
    if (!id) return;

    const runFallback = async () => {
      console.warn("Attempting fallback lookup...");
      try {
        const { data: allTrainingsData } = await apiService.get<any>("/EducationAndInternship/Student/trainings");

        if (allTrainingsData?.success && allTrainingsData.data) {
          const trainingData = allTrainingsData.data.studentTrainings || allTrainingsData.data.data || allTrainingsData.data.trainings || allTrainingsData.data;
          const trainingsList = Array.isArray(trainingData) ? trainingData : [];

          // Find the training where training_id matches the current ID or id matches current ID
          const foundTraining = trainingsList.find((c: any) =>
            String(c.training_id) === String(id) || String(c.id) === String(id)
          );

          if (foundTraining) {
            // Case 1: ID mismatch (e.g. URL has generic ID, list has Enrollment ID) -> Redirect
            if (String(foundTraining.id) !== String(id)) {
              console.log(`Redirecting from training_id ${id} to enrollment_id ${foundTraining.id}`);
              const searchParams = new URLSearchParams(location.search);
              navigate(`/training/${foundTraining.id}?${searchParams.toString()}`, {
                replace: true,
                state: location.state
              });
              return true; // Logically handled (redirecting)
            }

            // Case 2: ID match (URL is correct, but direct API failed) -> Set State manually
            const trainingDetails: Training = {
              id: String(foundTraining.id),
              training_id: foundTraining.training_id || foundTraining.id,
              title: foundTraining.title || foundTraining.training_name || "Untitled Training",
            };
            setTraining(trainingDetails);
            return true; // handled
          }
        }
      } catch (err) {
        console.error("Fallback lookup failed", err);
      }
      return false; // Not found in fallback
    };

    try {
      setLoading(true);
      setError(null);

      const { data, error: apiError } = await apiService.get<any>(
        `/EducationAndInternship/Student/trainings/training/${id}`
      );

      // If API Error or explicit success: false, try fallback
      if (apiError || data?.success === false) {
        const handled = await runFallback();
        if (!handled) {
          navigate("/training");
        }
        return;
      }

      if (data?.success && data.data) {
        const trainingData = data.data.data || data.data.studentTraining || data.data.training || data.data;

        const trainingDetails: Training = {
          id: id,
          // Try to find the real training ID in all common locations
          training_id: trainingData.training_id || trainingData.trainingID || (trainingData.training && (trainingData.training.training_id || trainingData.training.id)) || trainingData.id,
          title: trainingData.training_name || trainingData.title || (trainingData.training && (trainingData.training.training_name || trainingData.training.title)) || "Untitled Training",
        };
        setTraining(trainingDetails);
      }
    } catch (err: any) {
      // Unexpected error, try fallback
      const handled = await runFallback();
      if (!handled) {
        navigate("/training");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainingDetails();
  }, [id]);

  // Set hasOpenedTrainingTab when activeIndex becomes 0
  useEffect(() => {
    if (activeIndex === 0) {
      setHasOpenedTrainingTab(true);
    }
  }, [activeIndex]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
          <span className="ml-3 text-lg">Loading...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
          {error}
          <button
            onClick={fetchTrainingDetails}
            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      );
    }

    switch (activeIndex) {
      case 0:
        return hasOpenedTrainingTab ? (
          <TrainingPage trainingId={id} />
        ) : (
          <div className="flex flex-col items-center justify-center py-10">
            <img
              src="/trainings-links.jpg"
              alt="Training Intro"
              className="w-full max-w-4xl mb-6 rounded-lg shadow-lg"
            />
            <div className={`text-center p-6 rounded-lg max-w-2xl ${isDark ? "bg-gray-800" : "bg-gray-50"
              }`}>
              <h2 className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"
                }`}>
                {training?.title}
              </h2>
              <p className={`mb-6 ${isDark ? "text-gray-300" : "text-gray-600"
                }`}>
                Click on the "Trainings" tab to start learning. You'll find all the modules,
                lessons, and learning objectives organized for you.
              </p>
              <button
                onClick={() => {
                  const newAppParams = new URLSearchParams(location.search);
                  newAppParams.set('tab', TABS[0].toLowerCase());
                  navigate(`?${newAppParams.toString()}`, { replace: true, state: location.state });
                  setHasOpenedTrainingTab(true);
                }}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-200 ${isDark
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
              >
                Start Learning
              </button>
            </div>
          </div>
        );

      case 1:
        return <CompleteTrainingPage trainingId={training?.training_id?.toString() || id} />;
      case 2:
        return <InstructorsPage trainingId={training?.training_id?.toString() || id} />;
      case 3:
        return <BookmarksPage />;
      case 4:
        return <NotesPage />;
      default:
        return null;
    }
  };

  if (!training && !loading) return null;

  return (
    <>
      {/* Header */}
      <div
        className={`flex flex-col md:flex-row justify-between gap-4 p-4 rounded-lg shadow mb-6
        ${isDark ? "bg-gray-800" : "bg-white"}`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/training")}
            className={`px-3 py-2 rounded-lg transition-colors duration-200 ${isDark
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            ← Back
          </button>
          <h1 className={`font-semibold text-lg md:text-xl ${isDark ? "text-white" : "text-gray-900"}`}>
            {training?.title || "Loading..."}
          </h1>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {TABS.map((tab, i) => {
            const active = i === activeIndex;
            return (
              <button
                key={tab}
                onClick={() => {
                  const newSearchParams = new URLSearchParams(location.search);
                  newSearchParams.set('tab', TABS[i].toLowerCase());
                  navigate(`?${newSearchParams.toString()}`, { replace: true, state: location.state });
                  if (i === 0) {
                    setHasOpenedTrainingTab(true);
                  }
                }}
                className={`px-4 py-1.5 rounded-full text-xs border whitespace-nowrap transition-colors duration-200
                  ${active
                    ? "bg-blue-100 text-blue-700 border-blue-300 font-semibold"
                    : isDark
                      ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }
                `}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div
        className={`rounded-lg shadow p-4 md:p-6
        ${isDark ? "bg-gray-800" : "bg-white"}`}
      >
        {renderContent()}
      </div>
    </>
  );
}