import ClassCard from "./ClassCard";

/* TIME + DAYS */
const timeSlots = [
  "9:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "12:00-1:00",
  "2:00-3:00",
  "3:00-4:00",
  "4:00-5:00",
];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const toDisplayTime = (value) => {
  if (!value) return "";
  const [h, m] = value.split(":").map((v) => parseInt(v, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")}`;
};

const toTimeSlot = (startTime, endTime) =>
  `${toDisplayTime(startTime)}-${toDisplayTime(endTime)}`;

const TimetableGrid = ({ entries = [] }) => {
  const classes = entries.map((entry) => ({
    day: entry.day,
    time: toTimeSlot(entry.startTime, entry.endTime),
    subject: entry.subject?.name || entry.subjectName || "Subject",
    room: entry.room || "Room TBA",
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="text-gray-500 text-sm">
            <th className="p-4 text-left">Time</th>
            {days.map((day) => (
              <th key={day} className="p-4 text-left">
                {day}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {timeSlots.map((time) => (
            <tr key={time} className="border-t">
              <td className="p-4 text-sm text-gray-500">
                {time}
              </td>

              {days.map((day) => {
                const classItem = classes.find(
                  (c) => c.day === day && c.time === time
                );

                return (
                  <td key={day} className="p-4">
                    {classItem && <ClassCard data={classItem} />}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TimetableGrid;
