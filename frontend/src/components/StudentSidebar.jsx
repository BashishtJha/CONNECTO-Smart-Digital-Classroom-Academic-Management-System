import { NavLink, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

const StudentSidebar = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition
     ${
       isActive
         ? "bg-indigo-600 text-white"
         : "text-gray-600 hover:bg-indigo-50"
     }`;

  return (
    <aside className="w-64 min-h-screen bg-white border-r px-6 py-8 flex flex-col">
      {/* Logo */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-indigo-600">
          CONNECTO
        </h1>
        <p className="text-sm text-gray-400">Student Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        <NavLink to="/student/home" className={linkClass}>
          <HomeIcon className="h-5 w-5" />
          Home
        </NavLink>

        <NavLink to="/student/subjects" className={linkClass}>
          <BookOpenIcon className="h-5 w-5" />
          Subjects
        </NavLink>

        <NavLink to="/student/chat" className={linkClass}>
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
          Chat Rooms
        </NavLink>

        <NavLink to="/student/routine" className={linkClass}>
          <CalendarDaysIcon className="h-5 w-5" />
          Routine
        </NavLink>

        <NavLink to="/student/profile" className={linkClass}>
          <UserCircleIcon className="h-5 w-5" />
          Profile
        </NavLink>
      </nav>

      {/* Exit */}
      <button
        onClick={logout}
        className="flex items-center gap-3 text-red-500 hover:bg-red-50 px-4 py-3 rounded-lg"
      >
        <ArrowRightOnRectangleIcon className="h-5 w-5" />
        Exit
      </button>
    </aside>
  );
};

export default StudentSidebar;
