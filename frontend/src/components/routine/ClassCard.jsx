import {
  BellIcon,
  ClockIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

const subjectThemes = [
  {
    card: "border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-100",
    accent: "bg-sky-500",
    badge: "border-sky-200 bg-white/85 text-sky-700",
    icon: "text-sky-600",
  },
  {
    card: "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-100",
    accent: "bg-emerald-500",
    badge: "border-emerald-200 bg-white/85 text-emerald-700",
    icon: "text-emerald-600",
  },
  {
    card: "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-100",
    accent: "bg-amber-500",
    badge: "border-amber-200 bg-white/85 text-amber-700",
    icon: "text-amber-600",
  },
  {
    card: "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-pink-100",
    accent: "bg-rose-500",
    badge: "border-rose-200 bg-white/85 text-rose-700",
    icon: "text-rose-600",
  },
  {
    card: "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-100",
    accent: "bg-violet-500",
    badge: "border-violet-200 bg-white/85 text-violet-700",
    icon: "text-violet-600",
  },
  {
    card: "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-100",
    accent: "bg-blue-500",
    badge: "border-blue-200 bg-white/85 text-blue-700",
    icon: "text-blue-600",
  },
];

const getTheme = (subject = "") => {
  const normalized = String(subject).trim().toLowerCase();
  const hash = Array.from(normalized).reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );

  return subjectThemes[hash % subjectThemes.length];
};

const ClassCard = ({ data, empty = false, timeLabel = "" }) => {
  if (empty) {
    return (
      <div className="flex h-full min-h-[164px] flex-col justify-between rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-slate-400">
        <div>
          <h4 className="text-base font-semibold text-slate-500">No class scheduled</h4>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            No subject data is available for this time.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 text-sm text-slate-300">
          <ClockIcon className="h-4 w-4" />
          <span>{timeLabel || "Time slot"}</span>
        </div>
      </div>
    );
  }

  const theme = getTheme(data?.subject);
  const cardTimeLabel = data?.timeLabel || timeLabel || "Time slot";
  const cardRoom = data?.room || "Room pending";

  return (
    <div
      className={`relative flex h-full min-h-[164px] cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border p-4 shadow-sm shadow-slate-200/80 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-300/80 ${theme.card}`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${theme.accent}`} />

      {data?.notify ? (
        <span
          className={`absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white/85 shadow-sm ${theme.badge}`}
          aria-label="Notification enabled"
          title="Notification enabled"
        >
          <BellIcon className={`h-4 w-4 ${theme.icon}`} />
        </span>
      ) : null}

      <div className="min-w-0 space-y-3">
        <div className="min-w-0">
          <h4 className="break-words pr-12 text-[1.08rem] font-semibold leading-7 text-slate-900">
            {data?.subject || "Scheduled class"}
          </h4>
        </div>

        <div className="flex flex-wrap gap-2">
          {data?.classSection ? (
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
            >
              {data.classSection}
            </span>
          ) : null}

          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}>
            {data?.code || "Scheduled class"}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-700">
        <div className="flex items-start gap-2">
          <ClockIcon className={`mt-0.5 h-4 w-4 shrink-0 ${theme.icon}`} />
          <span className="break-words">{cardTimeLabel}</span>
        </div>

        <div className="flex items-start gap-2">
          <MapPinIcon className={`mt-0.5 h-4 w-4 shrink-0 ${theme.icon}`} />
          <span className="break-words">{cardRoom}</span>
        </div>
      </div>
    </div>
  );
};

export default ClassCard;
