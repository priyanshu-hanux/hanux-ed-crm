/**
 * A candidate profile, built from a parsed resume or entered by hand.
 * CRM data about the lead (status, owner, notes, tasks…) lives separately, in the lead record.
 *
 * Rules for whoever fills these in (resume parser, forms, API):
 * - Leave a value out (or use null where the type allows) instead of "", "N/A" or "-".
 * - Lists are cleaned before saving: trimmed, no blanks, no duplicates.
 * - Dates are "YYYY-MM" (or "YYYY" when the month is unknown), because resumes rarely give a day.
 */
export interface Candidate {
  id: string;
  name: string;

  emails: ContactPoint[];
  phones: ContactPoint[];
  socials: SocialProfile[];

  /** Total work experience in months (60 = 5 years); null when unknown. Used for sorting and filtering. */
  totalExperienceMonths: number | null;
  /** Work history, newest first. The current job has `endDate: null`. */
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: Certification[];

  location: Location | null;
  /** IANA zone, e.g. "Asia/Kolkata"; null when unknown */
  timezone: string | null;

  /** Where the profile came from */
  source: ProfileSource;
  /** How sure the resume parser was about each field (0–1). Only set for extracted profiles. */
  confidence?: Partial<Record<CandidateField, number>>;
}

export interface ContactPoint {
  /** As written, e.g. "aarav@infosys.com" or "+91 98765 43210" */
  value: string;
  type?: "work" | "personal" | "mobile" | "other";
  /** The one to use first. When none is marked, the first in the list is primary. */
  isPrimary?: boolean;
}

export type SocialPlatform = "linkedin" | "x" | "github" | "portfolio" | "other";

export interface SocialProfile {
  platform: SocialPlatform;
  url: string;
}

export interface WorkExperience {
  company: string;
  title?: string;
  /** "2021-04" */
  startDate?: string;
  /** null = current job; undefined = not known */
  endDate?: string | null;
  location?: string;
  description?: string;
}

export interface Education {
  /** "IIT Bombay" */
  institution?: string;
  /** "B.Tech" */
  degree?: string;
  /** "Computer Science" */
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
}

export interface Certification {
  name: string;
  provider?: string;
  /** "2024-03" or "2024" */
  issueDate?: string;
  /** null = never expires; undefined = not known */
  expiryDate?: string | null;
  credentialId?: string;
  /** Verification link */
  url?: string;
}

export interface Location {
  city?: string;
  region?: string;
  /** ISO 3166-1 alpha-2, e.g. "IN" */
  countryCode?: string;
  /** As written, e.g. "Jaipur, India" */
  display: string;
}

export interface ProfileSource {
  type: "resume" | "manual" | "import";
  resumeFileId?: string;
  /** ISO date-time of the resume extraction */
  extractedAt?: string;
  /** ISO date-time of the last change */
  updatedAt: string;
}

/** Fields that can carry an extraction confidence score */
export type CandidateField =
  | "name"
  | "emails"
  | "phones"
  | "socials"
  | "totalExperienceMonths"
  | "experience"
  | "education"
  | "skills"
  | "certifications"
  | "location"
  | "timezone";
