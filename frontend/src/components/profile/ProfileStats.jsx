const ProfileStats = ({
  completedAssignments = 0,
  pendingAssignments = 0,
  notSubmittedAssignments = 0,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600 font-bold">
          C
        </div>
        <div>
          <p className="text-gray-500 text-sm">Completed Assignments</p>
          <h3 className="text-2xl font-semibold">{completedAssignments}</h3>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold">
          P
        </div>
        <div>
          <p className="text-gray-500 text-sm">Pending Assignments</p>
          <h3 className="text-2xl font-semibold">{pendingAssignments}</h3>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-red-600 font-bold">
          N
        </div>
        <div>
          <p className="text-gray-500 text-sm">Not Submitted</p>
          <h3 className="text-2xl font-semibold">{notSubmittedAssignments}</h3>
        </div>
      </div>
    </div>
  );
};

export default ProfileStats;
