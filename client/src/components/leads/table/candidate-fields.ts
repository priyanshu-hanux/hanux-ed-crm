import type { Candidate, CandidateField, Certification, Education, WorkExperience } from "@/types/candidate";

/**
 * Reading a candidate profile for display: the current job, experience as text, dates,
 * education and certification labels, confidence. Shared by the table and the drawer,
 * so both always show the same thing.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* ---------------------------------------------------------------------- */
/* Jobs and experience                                                     */
/* ---------------------------------------------------------------------- */

/** The job with no end date (the first one, if several are marked current) */
export function getCurrentJob(candidate: Pick<Candidate, "experience">): WorkExperience | undefined {
  return candidate.experience?.find((job) => job.endDate === null && job.company?.trim());
}

/**
 * The job to show in "Company" and "Role": the current one, or else the most recent.
 * `isCurrent` tells them apart, so the UI can mark a past job.
 */
export function getLatestJob(
  candidate: Pick<Candidate, "experience">
): { job: WorkExperience; isCurrent: boolean } | undefined {
  const current = getCurrentJob(candidate);
  if (current) return { job: current, isCurrent: true };
  const latest = candidate.experience?.find((job) => job.company?.trim());
  return latest ? { job: latest, isCurrent: false } : undefined;
}

/** Months → "5 yrs", "2 yrs 6 mos", "6 mos", "Fresher" (0); undefined when unknown */
export function formatExperience(months: number | null | undefined): string | undefined {
  if (months == null || !Number.isFinite(months) || months < 0) return undefined;
  if (months === 0) return "Fresher";
  return formatMonths(Math.round(months));
}

/** Months as years with one decimal, for sorting and the years range filter: 30 → 2.5 */
export function experienceYears(months: number | null | undefined): number | undefined {
  if (months == null || !Number.isFinite(months) || months < 0) return undefined;
  return Math.round((months / 12) * 10) / 10;
}

function formatMonths(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const y = years ? `${years} yr${years === 1 ? "" : "s"}` : "";
  const m = rest ? `${rest} mo${rest === 1 ? "" : "s"}` : "";
  return [y, m].filter(Boolean).join(" ") || "0 mos";
}

/** "2023-06" → "Jun 2023", "2023" → "2023"; undefined for anything unreadable */
export function formatYearMonth(value: string | null | undefined): string | undefined {
  const match = value?.trim().match(/^(\d{4})(?:-(\d{1,2}))?/);
  if (!match) return undefined;
  const month = match[2] ? Number(match[2]) : undefined;
  return month && month >= 1 && month <= 12 ? `${MONTHS[month - 1]} ${match[1]}` : match[1];
}

/** "2023-06" → a comparable number (year * 12 + month); undefined when unreadable */
function monthIndex(value: string | null | undefined): number | undefined {
  const match = value?.trim().match(/^(\d{4})(?:-(\d{1,2}))?/);
  if (!match) return undefined;
  return Number(match[1]) * 12 + (match[2] ? Number(match[2]) - 1 : 0);
}

/**
 * A job's dates as text: "Jun 2023 – Present · 3 yrs 4 mos", "Jan 2021 – May 2023 · 2 yrs 5 mos".
 * Parts that aren't known are left out; undefined when nothing is known.
 */
export function formatJobDates(job: Pick<WorkExperience, "startDate" | "endDate">, now = new Date()): string | undefined {
  const start = formatYearMonth(job.startDate);
  const end = job.endDate === null ? "Present" : formatYearMonth(job.endDate);
  if (!start && !end) return undefined;
  const range = start && end ? `${start} – ${end}` : start ? `From ${start}` : `Until ${end}`;

  const from = monthIndex(job.startDate);
  const to = job.endDate === null ? now.getFullYear() * 12 + now.getMonth() : monthIndex(job.endDate);
  // Inclusive of both months: Jan–Dec is 12 months
  const length = from !== undefined && to !== undefined && to >= from ? formatMonths(to - from + 1) : undefined;
  return length ? `${range} · ${length}` : range;
}

/* ---------------------------------------------------------------------- */
/* Skills, education, certifications, location                             */
/* ---------------------------------------------------------------------- */

/** Trimmed, no blanks, no repeats (ignoring capitals; the first spelling wins), so each is a safe React key */
export function cleanSkills(skills: readonly string[] | null | undefined): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of skills ?? []) {
    const skill = typeof raw === "string" ? raw.trim() : "";
    const key = skill.toLowerCase();
    if (!skill || seen.has(key)) continue;
    seen.add(key);
    result.push(skill);
  }
  return result;
}

/** "B.Tech in Computer Science", or whatever part is known; undefined when the entry is empty */
export function educationTitle(education: Education): string | undefined {
  const degree = education.degree?.trim();
  const field = education.fieldOfStudy?.trim();
  if (degree && field) return `${degree} in ${field}`;
  return degree || field || education.institution?.trim() || undefined;
}

/** "IIT Bombay · 2016 – 2020" (the institution is left out when it's already the title) */
export function educationMeta(education: Education): string | undefined {
  const title = educationTitle(education);
  const institution = education.institution?.trim();
  const years =
    education.startYear && education.endYear
      ? `${education.startYear} – ${education.endYear}`
      : education.endYear
        ? `${education.endYear}`
        : education.startYear
          ? `From ${education.startYear}`
          : undefined;
  return [institution !== title ? institution : undefined, years].filter(Boolean).join(" · ") || undefined;
}

/** Education entries that have something to show */
export function cleanEducation(education: readonly Education[] | null | undefined): Education[] {
  return (education ?? []).filter((entry) => educationTitle(entry));
}

/** Certifications with a name, newest first (undated ones last) */
export function cleanCertifications(certifications: readonly Certification[] | null | undefined): Certification[] {
  return (certifications ?? [])
    .filter((cert) => cert.name?.trim())
    .map((cert, index) => ({ cert, index, at: monthIndex(cert.issueDate) ?? -Infinity }))
    .sort((a, b) => b.at - a.at || a.index - b.index)
    .map(({ cert }) => cert);
}

/** "expired" once the expiry date has passed, "recent" when issued in the last 12 months */
export function certificationStatus(cert: Certification, now = new Date()): "expired" | "recent" | undefined {
  const today = now.getFullYear() * 12 + now.getMonth();
  const expiry = monthIndex(cert.expiryDate);
  if (expiry !== undefined && expiry < today) return "expired";
  const issued = monthIndex(cert.issueDate);
  if (issued !== undefined && today - issued <= 12) return "recent";
  return undefined;
}

/** "Amazon Web Services · Feb 2024" */
export function certificationMeta(cert: Certification): string | undefined {
  return [cert.provider?.trim(), formatYearMonth(cert.issueDate)].filter(Boolean).join(" · ") || undefined;
}

/** "Jaipur, India", or the city/region/country parts that are known */
export function locationLabel(candidate: Pick<Candidate, "location">): string | undefined {
  const location = candidate.location;
  if (!location) return undefined;
  return location.display?.trim() || [location.city, location.region].filter(Boolean).join(", ") || undefined;
}

/* ---------------------------------------------------------------------- */
/* Confidence                                                              */
/* ---------------------------------------------------------------------- */

/** The fields a resume parser scores, with labels, in display order */
export const CONFIDENCE_FIELDS: { key: CandidateField; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "emails", label: "Email" },
  { key: "phones", label: "Phone" },
  { key: "socials", label: "Profiles" },
  { key: "experience", label: "Work history" },
  { key: "totalExperienceMonths", label: "Total experience" },
  { key: "education", label: "Education" },
  { key: "skills", label: "Skills" },
  { key: "certifications", label: "Certifications" },
  { key: "location", label: "Location" },
  { key: "timezone", label: "Timezone" },
];

/** True when the profile came from a resume and has confidence scores */
export function hasExtractionScores(candidate: Pick<Candidate, "source" | "confidence">): boolean {
  return candidate.source?.type !== "manual" && Object.keys(candidate.confidence ?? {}).length > 0;
}

/** Average of the scores that exist, clamped to 0–1; undefined when there are none (e.g. a manual profile) */
export function averageConfidence(candidate: Pick<Candidate, "source" | "confidence">): number | undefined {
  if (!hasExtractionScores(candidate)) return undefined;
  const values = Object.values(candidate.confidence ?? {}).filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value)
  );
  if (values.length === 0) return undefined;
  const clamped = values.map((value) => Math.max(0, Math.min(1, value)));
  return clamped.reduce((sum, value) => sum + value, 0) / clamped.length;
}
