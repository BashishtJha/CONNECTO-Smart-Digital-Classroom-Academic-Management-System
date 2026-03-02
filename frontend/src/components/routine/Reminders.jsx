import { BellIcon } from "@heroicons/react/24/outline";

const badgeColors = {
  Study: "bg-blue-100 text-blue-700",
  Project: "bg-purple-100 text-purple-700",
  Revision: "bg-yellow-100 text-yellow-700",
  Other: "bg-gray-100 text-gray-700",
};

const formatReminderTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Reminders = ({ reminders = [], onDelete, onEdit }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold text-lg mb-4">Personal Reminders</h3>

      {reminders.length === 0 ? (
        <p className="text-sm text-gray-500">No reminders yet.</p>
      ) : (
        <div className="space-y-3">
          {reminders.map((item) => (
            <div
              key={item._id}
              className="flex justify-between items-center bg-gray-50 p-4 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <BellIcon className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-gray-500">{formatReminderTime(item.remindAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    badgeColors[item.type] || badgeColors.Other
                  }`}
                >
                  {item.type}
                </span>
                <button
                  onClick={() => onEdit?.(item)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete?.(item._id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reminders;
