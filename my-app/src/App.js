import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/Login";
import Register from "./components/Register";
import HomePage from "./components/HomePage";
import AdminPage from "./components/AdminPage";
import SchoolAdmin from "./components/SchoolAdmin";
import StudentPage from "./components/StudentPage";
import PendingUsers from "./components/PendingUsers";
import ClassroomPage from "./components/ClassroomPage";
import CreateSubjectPage from "./components/CreateSubjectPage";
import AssignSubjectPage from "./components/AssignSubjectPage";
import Enrollment from "./components/Enrollment";
import Timetable from "./components/Timetable";
import Calendar from "./components/Calendar";
import Syllabus from "./components/Syllabus";
import TeachingLog from "./components/TeachingLog";
import Attendance from "./components/Attendance";
import AssignmentsPage from "./components/AssignmentsPage";
import SubmissionPage from "./components/SubmissionPage";
import ExamSchedulePage from "./components/ExamSchedulePage";
import StudentExamPage from "./components/StudentExamPage";
import MarksEntryPage from "./components/MarksEntryPage";
import TeacherExam from "./components/TeacherExam";
import TeacherDashboard from "./components/TeacherDashboard";
import StudentTimetable from "./components/StudentTimetable";
import ProfilePage from "./components/ProfilePage";
import { getDecodedToken } from "./utils/authHelper";
import StudentMarksPage from "./components/StudentMarksPage";
import StudentAssignmentsPage from "./components/StudentAssignmentsPage";
import StudentSubmissionPage from "./components/StudentSubmissionPage";
import AttendanceStudent from "./components/AttendanceStudent";
import Substitution from "./components/Substitution";
import Practice from "./components/Practice";
import PracticeHistory from "./components/PracticeHistory";

import Layout from "./components/Layout";

function PrivateRoute({ children, roles }) {
  const decoded = getDecodedToken();
  if (!decoded) return <Navigate to="/login" />;
  if (roles && !roles.includes(decoded.role)) return <Navigate to="/" />;
  return children;
}

function App() {
  const decoded = getDecodedToken();

  return (
    <Router>
      <Routes>

        {/* PUBLIC */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* HOME */}
        <Route
          path="/"
          element={
            decoded ? (
              <Layout><HomePage /></Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* ---------------- ADMIN ---------------- */}
        <Route
          path="/admin"
          element={
            <PrivateRoute roles={["ADMIN"]}>
              <Layout><AdminPage /></Layout>
            </PrivateRoute>
          }
        />

        {/* ---------------- TEACHER ---------------- */}
        <Route
          path="/teacher"
          element={
            <PrivateRoute roles={["TEACHER"]}>
              <Layout><TeacherDashboard /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/teacher/attendance"
          element={
            <PrivateRoute roles={["TEACHER"]}>
              <Layout><Attendance isTeacher={true} /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/teacher/attendance/:classId/:subjectId"
          element={
            <PrivateRoute roles={["TEACHER"]}>
              <Layout><Attendance isTeacher={true} /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/teacher/assignments"
          element={
            <PrivateRoute roles={["TEACHER"]}>
              <Layout><AssignmentsPage /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/teacher/syllabus"
          element={
            <PrivateRoute roles={["TEACHER"]}>
              <Layout><Syllabus /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/teacher/teaching-logs"
          element={
            <PrivateRoute roles={["TEACHER"]}>
              <Layout><TeachingLog /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/teacher/exams"
          element={
            <PrivateRoute roles={["TEACHER"]}>
              <Layout><TeacherExam /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/teacher/marks"
          element={
            <PrivateRoute roles={["TEACHER"]}>
              <Layout><MarksEntryPage /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/teacher/assignments/:assignmentId/submissions"
          element={
            <PrivateRoute roles={["TEACHER", "SCHOOLADMIN"]}>
              <Layout><SubmissionPage /></Layout>
            </PrivateRoute>
          }
        />

        {/* ---------------- STUDENT ---------------- */}
        <Route
          path="/student"
          element={
            <PrivateRoute roles={["STUDENT"]}>
              <Layout><StudentPage /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/student/timetable"
          element={
            <PrivateRoute roles={["STUDENT"]}>
              <Layout><StudentTimetable /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/student/exams"
          element={
            <PrivateRoute roles={["STUDENT"]}>
              <Layout><StudentExamPage /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/student/marks"
          element={
            <PrivateRoute roles={["STUDENT"]}>
              <Layout><StudentMarksPage /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/student/assignments"
          element={
            <PrivateRoute roles={["STUDENT"]}>
              <Layout><StudentAssignmentsPage /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/student/assignments/:assignmentId/submission"
          element={
            <PrivateRoute roles={["STUDENT"]}>
              <Layout><StudentSubmissionPage /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/student/attendance"
          element={
            <PrivateRoute roles={["STUDENT"]}>
              <Layout><AttendanceStudent /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/student/syllabus"
          element={
            <PrivateRoute roles={["STUDENT"]}>
              <Layout><Syllabus /></Layout>
            </PrivateRoute>
          }
        />

        {/* ---------------- SCHOOL ADMIN ---------------- */}
        <Route
          path="/schooladmin"
          element={
            <PrivateRoute roles={["SCHOOLADMIN"]}>
              <Layout><SchoolAdmin /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/schooladmin/pending-users"
          element={
            <PrivateRoute roles={["SCHOOLADMIN"]}>
              <Layout><PendingUsers /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/schooladmin/classrooms"
          element={
            <PrivateRoute roles={["SCHOOLADMIN"]}>
              <Layout><ClassroomPage /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/schooladmin/subjects"
          element={
            <PrivateRoute roles={["SCHOOLADMIN"]}>
              <Layout><CreateSubjectPage /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/schooladmin/assign-subject"
          element={
            <PrivateRoute roles={["SCHOOLADMIN"]}>
              <Layout><AssignSubjectPage /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/schooladmin/enrollments"
          element={
            <PrivateRoute roles={["SCHOOLADMIN"]}>
              <Layout><Enrollment /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/schooladmin/timetables"
          element={
            <PrivateRoute roles={["SCHOOLADMIN"]}>
              <Layout><Timetable /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/schooladmin/calendar"
          element={
            <PrivateRoute roles={["SCHOOLADMIN"]}>
              <Layout><Calendar /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/schooladmin/syllabus"
          element={
            <PrivateRoute roles={["SCHOOLADMIN"]}>
              <Layout><Syllabus /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/schooladmin/teaching-logs"
          element={
            <PrivateRoute roles={["SCHOOLADMIN"]}>
              <Layout><TeachingLog /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/schooladmin/attendance"
          element={
            <PrivateRoute roles={["SCHOOLADMIN"]}>
              <Layout><Attendance /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/schooladmin/exams"
          element={
            <PrivateRoute roles={["SCHOOLADMIN"]}>
              <Layout><ExamSchedulePage /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/schooladmin/assignments"
          element={
            <PrivateRoute roles={["SCHOOLADMIN"]}>
              <Layout><AssignmentsPage /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/schooladmin/assignments/:assignmentId/submissions"
          element={
            <PrivateRoute roles={["SCHOOLADMIN"]}>
              <Layout><SubmissionPage /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/schooladmin/marks"
          element={
            <PrivateRoute roles={["SCHOOLADMIN"]}>
              <Layout><MarksEntryPage /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/schooladmin/substitutions"
          element={
            <PrivateRoute roles={["SCHOOLADMIN"]}>
              <Layout><Substitution /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/student/substitutions"
          element={
            <PrivateRoute roles={["STUDENT"]}>
              <Layout><Substitution /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/student/practice"
          element={
            <PrivateRoute roles={["STUDENT"]}>
              <Layout><Practice /></Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/student/practice-history"
          element={
            <PrivateRoute roles={["STUDENT"]}>
              <Layout><PracticeHistory /></Layout>
            </PrivateRoute>
          }
        />

        {/* PROFILE */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Layout><ProfilePage /></Layout>
            </PrivateRoute>
          }
        />

        {/* DEFAULT */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </Router>
  );
}

export default App;
