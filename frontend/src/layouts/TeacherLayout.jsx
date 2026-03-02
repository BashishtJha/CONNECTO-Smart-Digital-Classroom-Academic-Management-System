import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  ComputerDesktopIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  LinkIcon,
  PlayCircleIcon,
  DocumentArrowUpIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

const navItems = [
  { to: "home", label: "Home", icon: HomeIcon },
  { to: "rooms", label: "Rooms", icon: ComputerDesktopIcon },
  { to: "schedule", label: "My Schedule", icon: CalendarDaysIcon },
  { to: "manage-routine", label: "Manage Routine", icon: Cog6ToothIcon },
  { to: "assignments", label: "Assignments", icon: ClipboardDocumentListIcon },
  { to: "resources", label: "Resources", icon: LinkIcon },
  { to: "video-lectures", label: "Video Lectures", icon: PlayCircleIcon },
  { to: "upload-notes", label: "Upload Notes", icon: DocumentArrowUpIcon },
  { to: "profile", label: "Profile", icon: UserCircleIcon },
];

const TeacherLayout = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col">
        <div>
          <h1 className="text-4xl font-bold text-indigo-600">CONNECTO</h1>
          <p className="text-slate-400 mt-1 text-base tracking-wide">TEACHER PORTAL</p>
        </div>

        <nav className="mt-8 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl transition text-xl ${
                    isActive
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-600 hover:bg-indigo-50"
                  }`
                }
              >
                <Icon className="h-6 w-6" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="mt-auto flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 text-xl"
        >
          <ArrowRightOnRectangleIcon className="h-6 w-6" />
          Exit
        </button>
      </aside>

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default TeacherLayout;
