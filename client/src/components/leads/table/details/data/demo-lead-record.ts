/**
 * DEMO DATA ONLY. Builds a believable CRM record for a candidate so the tabs have
 * something to show until the leads API exists. Replace useLeadRecord's source, not this file's callers.
 */
import { addDays, addHours, subDays, subHours, subMinutes } from "date-fns";

import type { Candidate } from "@/types/candidate";
import { cleanSkills, getLatestJob } from "../../candidate-fields";
import type { CandidateRow } from "../../candidate-row";
import type { LeadActivity, LeadNote, LeadRecord, LeadStatus, LeadTask } from "../types";

const OWNERS = [
  "Rakesh Kumar", "Ananya Iyer", "Vikram Rao", "Priya Nair", "Arjun Malhotra", "Sneha Reddy", "Karan Mehta", "Divya Pillai",
];
const SOURCES = ["LinkedIn", "Referral", "Naukri", "Company website", "Job fair"];
// "new" twice, so most leads are early in the pipeline
const STATUSES: LeadStatus[] = ["new", "new", "contacted", "qualified", "interviewing", "offer", "hired", "rejected"];

/** Small stable hash, so every candidate always gets the same demo record */
function seedOf(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash;
}

const pick = <T,>(items: T[], seed: number, offset = 0) => items[(seed + offset) % items.length];

// From a different part of the seed than the status, so owners and statuses don't pair up
const ownerOf = (seed: number) => pick(OWNERS, Math.floor(seed / 7));

/** A table row for a candidate: same status and owner as its demo lead record; about 1 in 6 is unassigned */
export function createDemoCandidateRow(candidate: Candidate): CandidateRow {
  const seed = seedOf(candidate.id);
  return {
    ...candidate,
    status: pick(STATUSES, seed, 2),
    owner: seed % 6 === 0 ? null : ownerOf(seed),
  };
}

export function createDemoLeadRecord(candidate: Candidate, now = new Date()): LeadRecord {
  const seed = seedOf(candidate.id);
  const owner = ownerOf(seed);
  const source = pick(SOURCES, seed, 1);
  const status = pick(STATUSES, seed, 2);
  const firstName = candidate.name.split(" ")[0] || candidate.name;
  const createdAt = subDays(now, 9 + (seed % 12));
  const iso = (date: Date) => date.toISOString();

  const activities: LeadActivity[] = [
    {
      id: `${candidate.id}-a1`,
      type: "created",
      title: `Lead created from ${source}`,
      at: iso(createdAt),
      actor: "System",
    },
    {
      id: `${candidate.id}-a2`,
      type: "resume",
      title: "Resume parsed",
      description: `Extracted ${parseCount(candidate)} fields from the uploaded resume.`,
      at: iso(addHours(createdAt, 1)),
      actor: "AI extraction",
    },
    {
      id: `${candidate.id}-a3`,
      type: "email",
      title: `Intro email sent to ${firstName}`,
      description: `Shared the role overview for ${getLatestJob(candidate)?.job.title || "the open role"}.`,
      at: iso(subDays(now, 6)),
      actor: owner,
    },
    {
      id: `${candidate.id}-a4`,
      type: "call",
      title: "Outbound call · 18 min",
      description: "Interested in the role. Notice period 60 days, open to relocation.",
      at: iso(subDays(now, 3)),
      actor: owner,
    },
    {
      id: `${candidate.id}-a5`,
      type: "status",
      title: "Status changed to Contacted",
      at: iso(subDays(now, 3)),
      actor: owner,
    },
    {
      id: `${candidate.id}-a6`,
      type: "meeting",
      title: "Technical screening scheduled",
      description: "45 min with the engineering panel.",
      at: iso(subHours(now, 5)),
      actor: owner,
    },
  ];

  const notes: LeadNote[] = [
    {
      id: `${candidate.id}-n1`,
      body: `${firstName} prefers calls after 6 PM local time. Strong on ${parseFirstSkill(candidate)}.`,
      author: owner,
      createdAt: iso(subDays(now, 3)),
      pinned: true,
    },
    {
      id: `${candidate.id}-n2`,
      body: "Current CTC shared over the call; expecting a 25–30% hike.",
      author: owner,
      createdAt: iso(subMinutes(subDays(now, 3), 20)),
    },
  ];

  const tasks: LeadTask[] = [
    {
      id: `${candidate.id}-t1`,
      title: `Send interview prep material to ${firstName}`,
      type: "email",
      dueAt: iso(subDays(now, 1)),
      done: false,
      assignee: owner,
    },
    {
      id: `${candidate.id}-t2`,
      title: "Follow-up call after screening",
      type: "call",
      dueAt: iso(addDays(now, 1)),
      done: false,
      assignee: owner,
    },
    {
      id: `${candidate.id}-t3`,
      title: "Verify certifications",
      type: "follow-up",
      dueAt: iso(subDays(now, 4)),
      done: true,
      assignee: owner,
    },
  ];

  return {
    status,
    owner,
    source,
    createdAt: iso(createdAt),
    activities,
    notes,
    tasks,
    resume: {
      fileName: `${candidate.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-resume.pdf`,
      fileSize: 180_000 + (seed % 400) * 1024,
      uploadedAt: iso(createdAt),
      pages: 2 + (seed % 2),
      // When the profile was extracted from this file; manual profiles weren't
      parsedAt:
        candidate.source?.type === "resume" ? candidate.source.extractedAt ?? iso(addHours(createdAt, 1)) : undefined,
    },
  };
}

function parseCount(candidate: Candidate) {
  // Manual profiles weren't extracted; count the fields that have data instead
  if (!candidate.confidence) return 0;
  return Object.values(candidate.confidence).filter((value) => typeof value === "number" && value > 0).length;
}

function parseFirstSkill(candidate: Candidate) {
  return cleanSkills(candidate.skills)[0] || "core skills";
}
