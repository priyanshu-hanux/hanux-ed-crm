/** Calling window in the CLIENT's local time. Change it here only. */
export const CALLING_HOURS = {
  start: "09:00",
  end: "18:00",
  // 0 = Sun … 6 = Sat
  days: [1, 2, 3, 4, 5],
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY = 24 * 60;

/* Intl.DateTimeFormat is expensive to construct; reuse one per zone + options. */
const formatterCache = new Map<string, Intl.DateTimeFormat>();
function formatter(timeZone: string, options: Intl.DateTimeFormatOptions) {
  const key = timeZone + JSON.stringify(options);
  let f = formatterCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone, ...options });
    formatterCache.set(key, f);
  }
  return f;
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
}

/** `3:01 AM` */
export function formatTime(timeZone: string, date: Date): string {
  return formatter(timeZone, { hour: "numeric", minute: "2-digit" }).format(date);
}

/** `PST`, `GMT+8`, … (whatever the browser knows as the short name) */
export function getZoneAbbreviation(timeZone: string, date: Date): string {
  return (
    formatter(timeZone, { timeZoneName: "short" })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value ?? ""
  );
}

/** UTC offset in minutes at the given moment (DST-aware). */
export function getOffsetMinutes(timeZone: string, date: Date): number {
  const name =
    formatter(timeZone, { timeZoneName: "longOffset" })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const match = name.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

/* The browser's own zone. Looked up once: building a DateTimeFormat just to read it is slow,
   and this runs for every row with a timezone on every render. */
let localTimeZone: string | undefined;
function getLocalTimeZone(): string {
  localTimeZone ??= Intl.DateTimeFormat().resolvedOptions().timeZone;
  return localTimeZone;
}

/** `2h 30m ahead of you` / `Same time as you` */
export function describeRelativeToLocal(timeZone: string, date: Date): string {
  const local = getLocalTimeZone();
  const diff = getOffsetMinutes(timeZone, date) - getOffsetMinutes(local, date);
  if (diff === 0) return "Same time as you";
  return `${formatDuration(Math.abs(diff))} ${diff > 0 ? "ahead of" : "behind"} you`;
}

function getZonedClock(timeZone: string, date: Date) {
  const parts = formatter(timeZone, {
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = Number(get("hour")) % 24; // some engines report midnight as "24"
  return { minutes: hour * 60 + Number(get("minute")), weekday: WEEKDAYS.indexOf(get("weekday")) };
}

export interface CallWindowStatus {
  good: boolean;
  /** Full sentence for tooltips and screen readers. */
  label: string;
  /** Short form for tight spaces. */
  short: string;
}

/** Is it currently within calling hours in `timeZone`? */
export function getCallWindowStatus(
  timeZone: string,
  date: Date,
  hours = CALLING_HOURS
): CallWindowStatus {
  const { minutes, weekday } = getZonedClock(timeZone, date);
  const start = toMinutes(hours.start);
  const end = toMinutes(hours.end);

  if (hours.days.includes(weekday) && minutes >= start && minutes < end) {
    const left = formatDuration(end - minutes);
    return { good: true, label: `Good time to call, ${left} left`, short: `${left} left` };
  }

  for (let offset = 0; offset <= 7; offset++) {
    const opensAt = offset * DAY + start;
    if (hours.days.includes((weekday + offset) % 7) && opensAt > minutes) {
      const wait = formatDuration(opensAt - minutes);
      return { good: false, label: `Outside calling hours, opens in ${wait}`, short: `Opens in ${wait}` };
    }
  }

  return { good: false, label: "Outside calling hours", short: "Closed" };
}

/** `9:00 AM – 6:00 PM, Mon–Fri` */
export function describeCallingHours(hours = CALLING_HOURS): string {
  const fmt = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  };
  const days = [...hours.days].sort((a, b) => a - b);
  const contiguous = days.every((d, i) => i === 0 || d === days[i - 1] + 1);
  const dayText =
    days.length === 7
      ? "every day"
      : contiguous && days.length > 1
        ? `${WEEKDAYS[days[0]]}–${WEEKDAYS[days[days.length - 1]]}`
        : days.map((d) => WEEKDAYS[d]).join(", ");
  return `${fmt(hours.start)} – ${fmt(hours.end)}, ${dayText}`;
}
