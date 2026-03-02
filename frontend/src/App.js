import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SelectRole from "./pages/SelectRole";

import StudentLayout from "./layouts/StudentLayout";
import TeacherLayout from "./layouts/TeacherLayout";

import Home from "./pages/student/Home";
import Subjects from "./pages/student/Subjects";
import ChatRooms from "./pages/student/ChatRooms";
import Routine from "./pages/student/Routine";
import Profile from "./pages/student/Profile";

import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import Rooms from "./pages/teacher/Rooms";
import MySchedule from "./pages/teacher/MySchedule";
import ManageRoutine from "./pages/teacher/ManageRoutine";
import TeacherProfile from "./pages/teacher/Profile";
import TeacherUploadNotes from "./pages/teacher/TeacherUploadNotes";
import TeacherAssignments from "./pages/teacher/Assignments";
import TeacherResources from "./pages/teacher/Resources";
import TeacherVideoLectures from "./pages/teacher/VideoLectures";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/select-role" element={<SelectRole />} />
        <Route path="/register/:role" element={<Register />} />

        {/* STUDENT */}
        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route path="home" element={<Home />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="chat" element={<ChatRooms />} />
          <Route path="routine" element={<Routine />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* TEACHER */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute role="teacher">
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route path="home" element={<TeacherDashboard />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="schedule" element={<MySchedule />} />
          <Route path="manage-routine" element={<ManageRoutine />} />
          <Route path="assignments" element={<TeacherAssignments />} />
          <Route path="resources" element={<TeacherResources />} />
          <Route path="video-lectures" element={<TeacherVideoLectures />} />
          <Route path="profile" element={<TeacherProfile />} />
          <Route path="upload-notes" element={<TeacherUploadNotes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
