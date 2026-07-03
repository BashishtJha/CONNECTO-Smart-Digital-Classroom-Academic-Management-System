import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CalendarDaysIcon,
  Cog6ToothIcon,
  ClipboardDocumentCheckIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  PaperAirplaneIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [teacherName, setTeacherName] = useState("Kailash kumar");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.name) {
          setTeacherName(res.data.name);
        }
      } catch (err) {
        console.error("Failed to fetch teacher profile", err);
      }
    };

    fetchUser();
  }, [token]);

  const cards = useMemo(
    () => [
      {
        title: "View Schedule",
        subtitle: "Click to open",
        icon: CalendarDaysIcon,
        iconBg: "bg-blue-500",
        to: "/teacher/schedule",
        span: "lg:col-span-3",
      },
      {
        title: "Manage Routine",
        subtitle: "Click to open",
        icon: Cog6ToothIcon,
        iconBg: "bg-emerald-500",
        to: "/teacher/manage-routine",
        span: "lg:col-span-3",
      },
      {
        title: "Take Attendance",
        subtitle: "Click to open",
        icon: ClipboardDocumentCheckIcon,
        iconBg: "bg-blue-500",
        to: "/teacher/rooms",
        span: "lg:col-span-2",
      },
      {
        title: "Syllabus Progress",
        subtitle: "Click to open",
        icon: BookOpenIcon,
        iconBg: "bg-emerald-500",
        to: "/teacher/resources",
        span: "lg:col-span-2",
      },
      {
        title: "Assignment Status",
        subtitle: "Click to open",
        icon: ClipboardDocumentListIcon,
        iconBg: "bg-violet-500",
        to: "/teacher/assignments",
        span: "lg:col-span-2",
        topRightIcon: ArrowTopRightOnSquareIcon,
      },
      {
        title: "Pending Reviews",
        subtitle: "Click to open",
        icon: ClockIcon,
        iconBg: "bg-amber-500",
        to: "/teacher/assignments",
        span: "lg:col-span-2",
        badge: "12",
      },
      {
        title: "Send Announcement",
        subtitle: "Click to open",
        icon: PaperAirplaneIcon,
        iconBg: "bg-indigo-500",
        to: "/teacher/rooms",
        span: "lg:col-span-2",
      },
      {
        title: "Attendance PDF Export",
        subtitle: "Click to open",
        icon: ArrowDownTrayIcon,
        iconBg: "bg-slate-600",
        to: "/teacher/rooms",
        span: "lg:col-span-2",
      },
    ],
    []
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-slate-900">{teacherName}</h1>
        <p className="text-slate-500 mt-1 text-2xl">Manage your classroom effectively.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          const TopRightIcon = card.topRightIcon;

          return (
            <button
              key={card.title}
              onClick={() => navigate(card.to)}
              className={`relative text-left bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition p-6 min-h-[210px] ${card.span}`}
            >
              {TopRightIcon && <TopRightIcon className="absolute top-5 right-5 h-6 w-6 text-slate-300" />}
              {card.badge && (
                <span className="absolute top-5 right-5 px-2.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold">
                  {card.badge}
                </span>
              )}

              <div className={`w-12 h-12 rounded-xl ${card.iconBg} text-white flex items-center justify-center shadow-sm`}>
                <Icon className="h-6 w-6" />
              </div>

              <h3 className="mt-6 text-4xl leading-tight font-semibold text-slate-900">{card.title}</h3>
              <p className="text-slate-400 mt-1 text-xl">{card.subtitle}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherDashboard;
