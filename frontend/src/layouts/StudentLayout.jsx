import { Outlet, Navigate } from "react-router-dom";
import StudentSidebar from "../components/StudentSidebar";

const StudentLayout = () => {
  const role = localStorage.getItem("role");

  if (role !== "student") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <StudentSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default StudentLayout;
