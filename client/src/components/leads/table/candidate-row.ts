import type { Candidate } from "@/types/candidate";
import type { LeadStatus } from "./details/types";

/**
 * One row of the candidates table: the profile plus the lead's pipeline fields.
 * The profile (Candidate) stays free of CRM data; a list API would return these joined,
 * e.g. GET /candidates → [{ ...profile, status, owner }].
 */
export interface CandidateRow extends Candidate {
  /** Where the lead is in the hiring pipeline */
  status: LeadStatus;
  /** The executive working the lead; null = unassigned */
  owner: string | null;
}

/** A Candidate that also carries the lead's status and owner */
export function isCandidateRow(candidate: Candidate): candidate is CandidateRow {
  return "status" in candidate && "owner" in candidate;
}
