const AttendanceOverview = ({ overall = 0, rows = [], onDownload }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-lg">Attendance Overview</h3>
        <button onClick={onDownload} className="text-indigo-600 text-sm">
          Download Report
        </button>
      </div>

      <h2 className="text-4xl font-bold mb-6">
        {overall}% <span className="text-gray-400 text-lg">Overall Attendance</span>
      </h2>

      <div className="space-y-4">
        {rows.length === 0 && (
          <p className="text-sm text-gray-500">No attendance data yet.</p>
        )}

        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex justify-between text-sm mb-1">
              <span>{row.label}</span>
              <span>{row.value}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${row.value >= 80 ? "bg-green-500" : "bg-yellow-400"}`}
                style={{ width: `${row.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceOverview;
