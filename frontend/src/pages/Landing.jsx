import { Link, useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const handleContinue = () => {
    if (!token || !role) {
      navigate("/login");
      return;
    }

    if (role === "teacher") {
      navigate("/teacher/home");
      return;
    }

    navigate("/student/home");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-indigo-600">CONNECTO</h1>
            <p className="text-xs text-slate-500 -mt-0.5">Smart Digital Classroom</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/select-role"
              className="hidden sm:inline-flex px-4 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-100 transition"
            >
              Register
            </Link>
            <button
              onClick={handleContinue}
              className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              {token ? "Go to Dashboard" : "Login"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-16">
        <section className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="inline-flex items-center rounded-full bg-indigo-100 text-indigo-700 px-3 py-1 text-sm font-medium">
              Built for Teachers & Students
            </p>
            <h2 className="mt-4 text-5xl font-extrabold leading-tight">
              One place to manage classes, notes, chat, attendance, and routine
            </h2>
            <p className="mt-5 text-lg text-slate-600 max-w-xl">
              CONNECTO keeps your daily classroom workflow simple: teachers publish and manage content,
              students access everything from one dashboard.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={handleContinue}
                className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
              >
                {token ? "Open Dashboard" : "Get Started"}
              </button>
              <Link
                to="/select-role"
                className="px-5 py-3 rounded-xl border border-slate-300 font-semibold hover:bg-white transition"
              >
                Create Account
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
              <h3 className="text-xl font-bold text-indigo-700">Teacher Tools</h3>
              <ul className="mt-3 space-y-2 text-slate-600">
                <li>Upload notes, resources, and video lectures</li>
                <li>Create routine and mark daily attendance</li>
                <li>Post announcements and manage assignments</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
              <h3 className="text-xl font-bold text-emerald-700">Student Workspace</h3>
              <ul className="mt-3 space-y-2 text-slate-600">
                <li>Access subjects, files, and lecture links instantly</li>
                <li>Track attendance and assignment status</li>
                <li>Use chat rooms and personal reminders</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;
