import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/ui/Layout";
import Dashboard from "../pages/Dashboard/Dashboard";
import { Profile } from "../pages/Profile/Profile";
import { Courses } from "../pages/Courses/Courses";
import { AssignmentPage } from "../pages/Assignment/AssignmentPage";
import { AssignmentAttemptPage } from "../pages/Assignment/AssignmentAttemptPage";
import AssignmentsGuidelinesPage from "../pages/Assignment/AssignmentsGuidelinesPage";
import AssignmentResultPage from "../pages/Assignment/AssignmentResultPage";
import { ExamPage } from "../pages/Exam/ExamPage";
import { ExamGuidelinesPage } from "../pages/Exam/ExamGuidelinesPage";
import { ExamAttemptPage } from "../pages/Exam/ExamAttemptPage";

import { TestPage } from "../pages/Tests/TestPage";
import { TestAttemptPage } from "../pages/Tests/TestAttemptPage";
import { TestGuidelinesPage } from "../pages/Tests/TestGuidelinesPage";
import TestResultPage from "../pages/Tests/TestResultPage";
import { ProjectPage } from "../pages/Projects/ProjectPage";
import { ProjectSubmitPage } from "../pages/Projects/ProjectSubmitPage";
import { ProjectGuidelinesPage } from "../pages/Projects/ProjectGuidelinesPage";
import ProjectResultPage from "../pages/Projects/ProjectResultPage";
import { CaseStudyPage } from "../pages/CaseStudy/CaseStudyPage";
import { CaseStudySubmitPage } from "../pages/CaseStudy/CaseStudySubmitPage";
import { CaseStudyGuidelinesPage } from "../pages/CaseStudy/CaseStudyGuidelinesPage";
import CaseStudyResultPage from "../pages/CaseStudy/CaseStudyResultPage";
import Announcements from "../pages/Announcements/Announcements";
import Supports from "../pages/Supports/Supports";
import ExamResultPage from "../pages/Exam/ExamResultPage";
import { FeeReceiptPage } from "../pages/FeeReceipt/FeeReceiptPage";
import { CompletedAssignmentPage } from "../pages/CompletedAssignment/CompletedAssignmentPage";
// import { CompletedTestsPage } from "../pages/CompletedTests/CompletedTestsPage";
import { IdCardsPage } from "../pages/IdCards/IdCardsPage";
import { AllCertificatesPage } from "../pages/AllCertificates/AllCertificatesPage";
import { AllMarksheetPage } from "../pages/AllMarksheet/AllMarksheetPage";
import { AdmissionLettersPage } from "../pages/AdmissionLetters/AdmissionLettersPage";
import AllStats from "../pages/Dashboard/AllStats";
// import CoursePage from "../pages/Courses/CoursesReadMore/CoursePage";
import ReadMore from "../pages/Courses/CoursesReadMore/ReadMore";
import CompleteCoursePage from "../pages/Courses/CoursesReadMore/CompleteCoursePage";
import NotificationsPage from "../pages/Notifications/NotificationsPage";
import { ZoomMeetingsPage } from "../pages/ZoomMeetings/ZoomMeetingsPage";
import { Trainings } from "../pages/Training/Training";
import TrainingReadMore from "../pages/Training/TrainingReadMore/ReadMore";
import CompleteTrainingPage from "../pages/Training/TrainingReadMore/CompleteTrainingPage";


export default function AdminRoutes() {
  return (
    <Layout>
      <Routes>
        {/* ✅ All routes at root level now */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard/all-stats" element={<AllStats />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<ReadMore />} />
        <Route path="/completedmodules" element={<CompleteCoursePage />} />
        <Route path="/training" element={<Trainings />} />
        <Route path="/training/:id" element={<TrainingReadMore />} />
        <Route path="/completedtraining" element={<CompleteTrainingPage />} />
        <Route path="/assignments" element={<AssignmentPage />} />
        <Route
          path="/assignment/attempt/:id"
          element={<AssignmentAttemptPage />}
        />
        <Route
          path="/assignment/guideline"
          element={<AssignmentsGuidelinesPage />}
        />
        <Route path="/assignments/:id" element={<AssignmentResultPage />} />

        <Route path="/exams" element={<ExamPage />} />
        <Route path="/completedexams" element={<ExamPage />} />
        <Route path="/exams/attempt/:studentExamId" element={<ExamAttemptPage />} />
        <Route path="/exams/:examname/result/:id" element={<ExamResultPage />} />
        <Route path="/exam/guideline" element={<ExamGuidelinesPage />} />

        <Route path="/tests" element={<TestPage />} />
        <Route path="/test-take/:studentExamId" element={<TestAttemptPage />} />
        <Route
          path="/quiz/guideline"
          element={<TestGuidelinesPage />}
        />
        <Route path="/tests/:id" element={<TestResultPage />} />
        <Route path="/projects" element={<ProjectPage />} />
        <Route path="/completedprojects" element={<ProjectPage />} />
        <Route
          path="/project/guideline"
          element={<ProjectGuidelinesPage />}
        />
        <Route path="/projects/:id" element={<ProjectResultPage />} />
        <Route path="/projects/submit/:id" element={<ProjectSubmitPage />} />
        <Route path="/casestudy" element={<CaseStudyPage />} />
        <Route
          path="/case-study/guideline"
          element={<CaseStudyGuidelinesPage />}
        />
        <Route path="/casestudy/submit/:id" element={<CaseStudySubmitPage />} />
        <Route path="/casestudy/:id" element={<CaseStudyResultPage />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/supports" element={<Supports />} />
        <Route path="/feereceipt" element={<FeeReceiptPage />} />
        <Route path="/completedassignment" element={<CompletedAssignmentPage />} />
        <Route path="/completedtests" element={<TestPage />} />
        <Route path="/idcards" element={<IdCardsPage />} />
        <Route path="/allcertificates" element={<AllCertificatesPage />} />
        <Route path="/allmarksheet" element={<AllMarksheetPage />} />
        <Route path="/admissionletters" element={<AdmissionLettersPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/live-sessions" element={<ZoomMeetingsPage />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}