import { useNavigate } from "react-router-dom";

const SelectRole = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-indigo-600 mb-2">CONNECTO</h1>
      <p className="text-gray-500 mb-10">
        Smart Digital Classroom & Learning Hub
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Student Card */}
        <div
          onClick={() => navigate("/register/student")}
          className="cursor-pointer bg-white w-72 p-8 rounded-xl shadow hover:shadow-lg transition text-center"
        >
          <div className="mx-auto mb-4 h-20 w-20 bg-indigo-100 rounded-xl flex items-center justify-center">
            🎓
          </div>
          <h2 className="text-xl font-semibold">Student</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Access subjects, attendance, assignments, and study materials.
          </p>
        </div>

        {/* Teacher Card */}
        <div
          onClick={() => navigate("/register/teacher")}
          className="cursor-pointer bg-white w-72 p-8 rounded-xl shadow hover:shadow-lg transition text-center"
        >
          <div className="mx-auto mb-4 h-20 w-20 bg-indigo-100 rounded-xl flex items-center justify-center">
            🏫
          </div>
          <h2 className="text-xl font-semibold">Teacher</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Manage classes, attendance, syllabus, and student progress.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SelectRole;
