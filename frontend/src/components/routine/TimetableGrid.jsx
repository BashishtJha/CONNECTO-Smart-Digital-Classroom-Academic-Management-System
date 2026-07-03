import ClassCard from "./ClassCard";

const visibleTimeSlots = [
  { start: "09:00", end: "10:00" },
  { start: "10:00", end: "11:00" },
  { start: "14:00", end: "15:00" },
  { start: "15:00", end: "16:00" },
];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const normalizeTimeValue = (value = "") => String(value).trim().slice(0, 5);

const toDisplayTime = (value) => {
  if (!value) return "";

  const [hourText, minuteText] = normalizeTimeValue(value).split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return value;
  }

  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")}`;
};

const toRangeLabel = ({ start, end }) => `${toDisplayTime(start)}-${toDisplayTime(end)}`;

const buildClasses = (entries = []) =>
  entries.map((entry) => {
    const start = normalizeTimeValue(entry.startTime);
    const end = normalizeTimeValue(entry.endTime);

    return {
      id:
        entry._id ||
        `${entry.day}-${start}-${end}-${entry.subject?._id || entry.subjectName || "subject"}`,
      day: entry.day,
      start,
      end,
      subject: entry.subject?.name || entry.subjectName || "Subject",
      code: entry.subject?.code || "",
      classSection: entry.classSection || "",
      room: entry.room || "",
      timeLabel: toRangeLabel({ start, end }),
    };
  });

const groupClassesByCell = (classes = []) => {
  const classMap = new Map();

  classes.forEach((classItem) => {
    const key = `${classItem.day}-${classItem.start}-${classItem.end}`;
    const existing = classMap.get(key) || [];
    existing.push(classItem);
    classMap.set(key, existing);
  });

  return classMap;
};

const buildFillPool = (classes = []) => {
  const uniqueClasses = new Map();

  classes.forEach((classItem) => {
    const key = [
      classItem.subject,
      classItem.code,
      classItem.classSection,
      classItem.room,
    ].join("-");

    if (!uniqueClasses.has(key)) {
      uniqueClasses.set(key, classItem);
    }
  });

  return Array.from(uniqueClasses.values());
};

const createFilledCard = (pool, dayIndex, slotIndex, slot) => {
  if (!pool.length) {
    return null;
  }

  const source = pool[(slotIndex * days.length + dayIndex) % pool.length];

  return {
    ...source,
    id: `generated-${days[dayIndex]}-${slot.start}-${slot.end}-${source.subject}`,
    day: days[dayIndex],
    start: slot.start,
    end: slot.end,
    timeLabel: toRangeLabel(slot),
  };
};

const TimetableGrid = ({ entries = [] }) => {
  const classes = buildClasses(entries);
  const classMap = groupClassesByCell(classes);
  const fillPool = buildFillPool(classes);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1080px] w-full table-fixed border-collapse">
          <colgroup>
            <col style={{ width: "120px" }} />
            {days.map((day) => (
              <col key={day} />
            ))}
          </colgroup>

          <thead>
            <tr className="border-b border-slate-200 text-sm text-slate-700">
              <th className="px-4 py-4 text-left font-semibold">Time</th>
              {days.map((day) => (
                <th key={day} className="px-4 py-4 text-left font-semibold">
                  {day}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visibleTimeSlots.map((slot, slotIndex) => {
              const slotKey = `${slot.start}-${slot.end}`;
              const slotLabel = toRangeLabel(slot);

              return (
                <tr key={slotKey} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-4 align-top text-sm font-medium text-slate-500">
                    <span className="whitespace-nowrap">{slotLabel}</span>
                  </td>

                  {days.map((day, dayIndex) => {
                    const cellClasses =
                      classMap.get(`${day}-${slot.start}-${slot.end}`) || [];
                    const cardsToRender =
                      cellClasses.length > 0
                        ? cellClasses
                        : [createFilledCard(fillPool, dayIndex, slotIndex, slot)].filter(
                            Boolean
                          );

                    return (
                      <td key={day} className="px-4 py-4 align-top">
                        <div className="flex h-full min-h-[164px] flex-col gap-3">
                          {cardsToRender.length > 0 ? (
                            cardsToRender.map((classItem) => (
                              <ClassCard key={classItem.id} data={classItem} />
                            ))
                          ) : (
                            <ClassCard empty timeLabel={slotLabel} />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimetableGrid;
