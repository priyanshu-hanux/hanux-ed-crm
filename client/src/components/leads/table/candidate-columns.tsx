import {
  Award,
  Briefcase,
  CircleDashed,
  UserCheck,
  CircleOff,
  Link2Off,
  MailX,
  PenLine,
  PhoneOff,
  Sprout,
  BriefcaseBusiness,
  Building2,
  Clock,
  Gauge,
  GraduationCap,
  Link2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  UserRound,
} from "lucide-react";

import {
  customColumn,
  listColumn,
  numberColumn,
  tagsColumn,
  textColumn,
  type ColumnDef,
  type DataTableCardFields,
  type DataTableSelectionPreset,
} from "@/components/table";
import { CandidateTimezoneCell } from "@/components/sidebar/timezone/candidate-timezone-cell";
import { getOffsetMinutes, isValidTimeZone } from "@/lib/utils";
import type { Candidate, ContactPoint } from "@/types/candidate";
import type { CandidateRow } from "./candidate-row";
import { StatusBadge } from "./details/shared/status-badge";
import type { LeadStatus } from "./details/types";
import { LEAD_STATUS_CONFIG } from "./details/utils";
import {
  averageConfidence,
  certificationMeta,
  cleanCertifications,
  cleanEducation,
  cleanSkills,
  educationTitle,
  experienceYears,
  formatExperience,
  getLatestJob,
  locationLabel,
} from "./candidate-fields";
import { CandidateNameCell, ConfidenceCell, JobText, LocationText, OwnerCell } from "./candidate-cells";
import { CertificationsCell } from "./certifications-cell";
import { cleanContacts, cleanSocials, CONTACT_TYPE_LABEL, contactValues, mailtoHref, phoneDigits, primaryValue, telHref } from "./contact";
import { EducationCell } from "./education-cell";
import { SocialsCell } from "./social-links";

/**
 * How a candidate is shown in <DataTable />: the one place that knows the candidate's shape.
 * If the profile format changes, update the `value` lines here (and candidate-fields.ts);
 * the table itself doesn't change.
 */

/** "Work", "Personal"… for a contact value, shown in the "+N" card */
function contactTypeLabel(points: ContactPoint[], value: string) {
  const type = points.find((point) => point.value === value)?.type;
  return type ? CONTACT_TYPE_LABEL[type] : undefined;
}

/** "Senior Frontend Developer · Infosys", for the drawer header and mobile cards */
export function candidateSummary(candidate: Candidate) {
  const latest = getLatestJob(candidate);
  return [latest?.job.title, latest?.job.company].filter(Boolean).join(" · ") || undefined;
}

/** Statuses in pipeline order: New → … → Hired, Rejected */
const STATUS_ORDER = Object.keys(LEAD_STATUS_CONFIG) as LeadStatus[];
const STATUS_FILTER_OPTIONS = STATUS_ORDER.map((status) => ({ value: status, label: LEAD_STATUS_CONFIG[status].label }));

/** Average extraction confidence as a whole percent (87), for the range filter */
function confidencePercent(candidate: Candidate) {
  const average = averageConfidence(candidate);
  return average === undefined ? undefined : Math.round(average * 100);
}

export const candidateColumns: ColumnDef<CandidateRow>[] = [
  textColumn<CandidateRow>({
    id: "name",
    title: "Name",
    icon: UserRound,
    value: (c) => c.name,
    sticky: "left",
    skeleton: "avatar",
    filter: { type: "text", placeholder: "e.g. Rakesh" },
    size: 210,
    minSize: 190,
    render: (name, c) => <CandidateNameCell name={name} role={getLatestJob(c)?.job.title?.trim() || undefined} />,
  }),

  customColumn<CandidateRow>({
    id: "status",
    title: "Status",
    icon: CircleDashed,
    // Sorted in pipeline order (New → Hired), filtered by status; the CSV gets the label
    value: (c) => STATUS_ORDER.indexOf(c.status),
    sortable: true,
    filterValue: (c) => c.status,
    filter: { type: "select", multiple: true, options: STATUS_FILTER_OPTIONS },
    exportValue: (c) => LEAD_STATUS_CONFIG[c.status]?.label ?? "",
    skeleton: "badge",
    size: 150,
    minSize: 130,
    render: (c) => <StatusBadge status={c.status} />,
  }),

  textColumn<CandidateRow>({
    id: "owner",
    title: "Owner",
    icon: UserCheck,
    value: (c) => c.owner ?? undefined,
    // "Unassigned" is a filter option too, so you can find leads nobody is working
    filterValue: (c) => c.owner ?? "Unassigned",
    filter: { type: "select", multiple: true },
    exportValue: (c) => c.owner ?? "Unassigned",
    size: 180,
    minSize: 150,
    render: (owner) => <OwnerCell name={owner} />,
    empty: "Unassigned",
  }),

  customColumn<CandidateRow>({
    id: "timezone",
    title: "Timezone",
    icon: Clock,
    // Sorted by UTC offset (west → east), not alphabetically; the CSV gets the zone name
    value: (c) => {
      const zone = c.timezone?.trim();
      return zone && isValidTimeZone(zone) ? getOffsetMinutes(zone) : undefined;
    },
    sortable: true,
    exportValue: (c) => c.timezone ?? "",
    size: 170,
    minSize: 150,
    render: (c) => <CandidateTimezoneCell timeZone={c.timezone} />,
  }),

  listColumn<CandidateRow>({
    id: "email",
    title: "Email",
    icon: Mail,
    label: "email",
    // Primary first; "+N" lists the rest with their type (Work, Personal…)
    values: (c) => contactValues(c.emails, "email"),
    tag: (value, c) => contactTypeLabel(cleanContacts(c.emails, "email"), value),
    href: mailtoHref,
    sortable: true,
    copy: { text: (c) => primaryValue(c.emails, "email"), label: "email" },
    size: 250,
    minSize: 200,
    className: "text-[13px] text-muted-foreground",
  }),

  listColumn<CandidateRow>({
    id: "phone",
    title: "Phone",
    icon: Phone,
    label: "phone number",
    values: (c) => contactValues(c.phones, "phone"),
    tag: (value, c) => contactTypeLabel(cleanContacts(c.phones, "phone"), value),
    href: telHref,
    copyValue: phoneDigits,
    copy: {
      text: (c) => {
        const phone = primaryValue(c.phones, "phone");
        return phone ? phoneDigits(phone) : null;
      },
      label: "phone number",
    },
    size: 200,
    minSize: 160,
    className: "whitespace-nowrap font-medium text-[13px]",
  }),

  customColumn<CandidateRow>({
    id: "socials",
    title: "Socials",
    icon: Link2,
    // LinkedIn first, then GitHub, X, portfolio…; unsafe or broken links are dropped
    value: (c) => cleanSocials(c.socials).map((social) => social.url),
    copy: { text: (c) => cleanSocials(c.socials)[0]?.url, label: "profile link" },
    size: 200,
    minSize: 160,
    render: (c) => <SocialsCell socials={c.socials} />,
  }),

  numberColumn<CandidateRow>({
    id: "experience",
    title: "Experience",
    icon: BriefcaseBusiness,
    // Sorted and filtered in years (30 months → 2.5); shown as "2 yrs 6 mos"
    value: (c) => experienceYears(c.totalExperienceMonths),
    format: (_, c) => formatExperience(c.totalExperienceMonths),
    display: "badge",
    skeleton: "badge",
    filter: { type: "range", unit: "years", min: 0, step: 1 },
    size: 145,
    minSize: 140,
  }),

  tagsColumn<CandidateRow>({
    id: "skills",
    title: "Skills",
    icon: Sparkles,
    label: "skills",
    values: (c) => cleanSkills(c.skills),
    // "Any of": React + Python finds candidates with either
    filter: { type: "select", multiple: true },
    size: 250,
    minSize: 220,
  }),

  textColumn<CandidateRow>({
    id: "company",
    title: "Company",
    icon: Building2,
    // The current job's company, or the most recent one (marked "Past") when between jobs
    value: (c) => getLatestJob(c)?.job.company,
    filter: { type: "select", multiple: true },
    size: 165,
    minSize: 145,
    render: (company, c) => <JobText text={company} isCurrent={!!getLatestJob(c)?.isCurrent} className="font-medium" />,
  }),

  textColumn<CandidateRow>({
    id: "currentRole",
    title: "Current Role",
    icon: Briefcase,
    value: (c) => getLatestJob(c)?.job.title,
    // Pick one or more titles; options come from the data with counts (searchable when the list is long)
    filter: { type: "select", multiple: true },
    size: 210,
    minSize: 185,
    render: (title, c) => <JobText text={title} isCurrent={!!getLatestJob(c)?.isCurrent} />,
  }),

  customColumn<CandidateRow>({
    id: "education",
    title: "Education",
    icon: GraduationCap,
    value: (c) => cleanEducation(c.education).map((entry) => educationTitle(entry)),
    // The cell shows "B.Tech in Computer Science"; the filter offers degrees (B.Tech, MCA…)
    filterValue: (c) => cleanEducation(c.education).map((entry) => entry.degree?.trim()).filter(Boolean),
    filter: { type: "select", multiple: true },
    // "B.Tech in Computer Science (IIT Bombay, 2020)" per entry
    exportValue: (c) =>
      cleanEducation(c.education).map((entry) => {
        const meta = [entry.institution, entry.endYear].filter(Boolean).join(", ");
        return meta ? `${educationTitle(entry)} (${meta})` : educationTitle(entry);
      }),
    size: 230,
    minSize: 200,
    render: (c) => <EducationCell education={c.education} />,
  }),

  textColumn<CandidateRow>({
    id: "location",
    title: "Location",
    icon: MapPin,
    value: (c) => locationLabel(c),
    filter: { type: "select", multiple: true },
    size: 170,
    minSize: 140,
    render: (label, c) => <LocationText label={label} countryCode={c.location?.countryCode} />,
  }),

  customColumn<CandidateRow>({
    id: "certifications",
    title: "Certifications",
    icon: Award,
    value: (c) => c.certifications,
    // Filtered by who issued it (AWS, Google…); names are too specific to be useful options
    filterValue: (c) => cleanCertifications(c.certifications).map((cert) => cert.provider?.trim()).filter(Boolean),
    filter: { type: "select", multiple: true },
    // "AWS Solutions Architect (Amazon, Feb 2024); …"
    exportValue: (c) =>
      cleanCertifications(c.certifications).map((cert) => {
        const meta = certificationMeta(cert);
        return meta ? `${cert.name} (${meta})` : cert.name;
      }),
    size: 270,
    minSize: 230,
    render: (c) => <CertificationsCell certifications={c.certifications} />,
  }),

  customColumn<CandidateRow>({
    id: "confidence",
    title: "Confidence",
    icon: Gauge,
    value: (c) => averageConfidence(c),
    // Filtered as a percent (0–100); manual entries have no score and drop out of a range filter
    filterValue: confidencePercent,
    filter: { type: "range", unit: "%", min: 0, max: 100, step: 5 },
    // "87%", or "Manual entry" for profiles without scores
    exportValue: (c) => {
      const average = averageConfidence(c);
      return average === undefined ? "Manual entry" : `${Math.round(average * 100)}%`;
    },
    size: 250,
    minSize: 220,
    render: (c) => <ConfidenceCell average={averageConfidence(c)} />,
  }),
];

/** Columns the toolbar search looks in */
export const CANDIDATE_SEARCH_COLUMNS = ["name", "email", "company", "currentRole"];

/** Which columns are visible until the viewer changes it */
export const DEFAULT_CANDIDATE_COLUMN_VISIBILITY: Record<string, boolean> = {
  name: true,
  status: true,
  owner: true,
  email: true,
  phone: true,
  socials: true,
  experience: true,
  education: true,
  skills: false,
  company: true,
  location: false,
  timezone: true,
  currentRole: false,
  certifications: true,
  confidence: false,
};

/** What the mobile cards show */
export const candidateCardFields: DataTableCardFields<CandidateRow> = {
  title: "name",
  subtitle: candidateSummary,
  description: (candidate) => cleanSkills(candidate.skills).join(", "),
};

/**
 * Quick selections in the table's Select menu: candidates that share a gap or a situation,
 * so they can be fixed or handled in one go (assign, change status, delete…).
 */
export const candidateSelectionPresets: DataTableSelectionPreset<CandidateRow>[] = [
  { id: "missing-email", label: "Missing email", icon: MailX, match: (c) => !primaryValue(c.emails, "email") },
  { id: "missing-phone", label: "Missing phone", icon: PhoneOff, match: (c) => !primaryValue(c.phones, "phone") },
  {
    id: "no-linkedin",
    label: "No LinkedIn",
    icon: Link2Off,
    match: (c) => !cleanSocials(c.socials).some((social) => social.platform === "linkedin"),
  },
  {
    id: "freshers",
    label: "Freshers",
    description: "≤ 1 year",
    icon: Sprout,
    match: (c) => c.totalExperienceMonths !== null && c.totalExperienceMonths <= 12,
  },
  {
    id: "between-jobs",
    label: "Between jobs",
    description: "no current role",
    icon: CircleOff,
    match: (c) => getLatestJob(c)?.isCurrent === false,
  },
  { id: "manual", label: "Entered manually", description: "no resume", icon: PenLine, match: (c) => c.source?.type === "manual" },
  {
    id: "low-confidence",
    label: "Low confidence",
    description: "below 60%",
    icon: Gauge,
    match: (c) => {
      const average = averageConfidence(c);
      return average !== undefined && average < 0.6;
    },
  },
];
