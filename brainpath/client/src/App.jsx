import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import StudentLayout from "./layouts/StudentLayout.jsx";
import InstructorLayout from "./layouts/InstructorLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import InstructorRequestPage from "./pages/InstructorRequestPage.jsx";

// Student pages
import StudentDashboard from "./pages/student/Dashboard.jsx";
import StudentCourses from "./pages/student/Courses.jsx";
import StudentProgress from "./pages/student/Progress.jsx";
import StudentOffline from "./pages/student/Offline.jsx";
import StudentProfile from "./pages/student/Profile.jsx";
import StudentLive from "./pages/student/Live.jsx";
import LessonPlayer from "./pages/student/LessonPlayer.jsx"
import QuizPage from "./pages/student/Quiz.jsx";
import StudentJitsiRoom from "./pages/student/JitsiRoom.jsx"

// Instructor pages
import InstructorDashboard from "./pages/instructor/Dashboard.jsx";
import InstructorCourses from "./pages/instructor/Courses.jsx";
import InstructorBuilder from "./pages/instructor/Builder.jsx";
import InstructorSessions from "./pages/instructor/Sessions.jsx";
import InstructorAnalytics from "./pages/instructor/Analytics.jsx";
import InstructorNewCourse from "./pages/instructor/NewCourse.jsx";
import InstructorCourseDetail from "./pages/instructor/CourseDetail.jsx";
import InstructorNewLesson from "./pages/instructor/NewLesson.jsx";
import QuizBuilder from "./pages/instructor/QuizBuilder.jsx";
import InstructorJitsiRoom from "./pages/instructor/JitsiRoom.jsx";


// Admin pages
import AdminDashboard from "./pages/admin/Dashboard.jsx";

// sync
import { useSyncOnReconnect } from "./hooks/useSyncOnReconnect.js";


function AppContent() {
  useSyncOnReconnect(({ synced }) => {
    console.log(`Auto-synced ${synced} items(s) on reconnect`);
  });
  return (
    <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/instructor-request" element={<InstructorRequestPage />} />

          {/* Student */}
          <Route
            element={
              <ProtectedRoute role="student">
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/courses"   element={<StudentCourses />} />
            <Route path="/progress"  element={<StudentProgress />} />
            <Route path="/offline"   element={<StudentOffline />} />
            <Route path="/profile"   element={<StudentProfile />} />
            <Route path="/live"      element={<StudentLive />} />
            <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonPlayer />} />
            <Route path="/courses/:courseId" element={<LessonPlayer />} />
            <Route path="/courses/:courseId/modules/:moduleId/quiz" element={<QuizPage />} />
          </Route>
          {/* Full screen — outside layout wrapper */}
          <Route
            path="/live/:sessionId"
            element={
              <ProtectedRoute role="student">
                <StudentJitsiRoom />
              </ProtectedRoute>
            }
          />

          {/* Instructor */}
          <Route
            element={
              <ProtectedRoute role="instructor">
                <InstructorLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/instructor"            element={<InstructorDashboard />} />
            <Route path="/instructor/courses"    element={<InstructorCourses />} />
            <Route path="/instructor/builder"    element={<InstructorBuilder />} />
            <Route path="/instructor/sessions"   element={<InstructorSessions />} />
            <Route path="/instructor/analytics"  element={<InstructorAnalytics />} />
            <Route path="/instructor/courses/new"    element={<InstructorNewCourse />} />
            <Route path="/instructor/courses/:id" element={<InstructorCourseDetail />} />
            <Route path="/instructor/courses/:courseId/modules/:moduleId/lessons/new"  element={<InstructorNewLesson />} />
            <Route path="/instructor/courses/:courseId/modules/:moduleId/quiz" element={<QuizBuilder />}  />
          </Route>
          <Route
            path="/instructor/sessions/:sessionId/room"
            element={
              <ProtectedRoute role="instructor">
                <InstructorJitsiRoom />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
  )
}


export default function App() {
  useEffect(() => {
    const registerSW = async () => {
      if (!("serviceWorker" in navigator)) return;
      const { getSerwist } = await import("virtual:serwist");
      const serwist = await getSerwist();
      serwist?.addEventListener("installed", () =>
        console.log("Serwist installed.")
      );
      void serwist?.register();
    };
    registerSW();
  }, []);

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}