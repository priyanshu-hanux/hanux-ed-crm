import type { ComponentType } from "react";

import type { Candidate } from "@/data/dummy-candidates";

/** Where the lead is in the hiring pipeline */
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "interviewing"
  | "offer"
  | "hired"
  | "rejected";

export type LeadActivityType = "call" | "email" | "meeting" | "note" | "status" | "task" | "resume" | "created";

/** One entry on the timeline */
export interface LeadActivity {
  id: string;
  type: LeadActivityType;
  title: string;
  description?: string;
  /** ISO date-time */
  at: string;
  /** Who did it, e.g. "Rakesh Kumar" or "System" */
  actor?: string;
}

export interface LeadNote {
  id: string;
  body: string;
  author: string;
  /** ISO date-time */
  createdAt: string;
  pinned?: boolean;
}

export type LeadTaskType = "call" | "email" | "follow-up" | "meeting";

export interface LeadTask {
  id: string;
  title: string;
  type: LeadTaskType;
  /** ISO date-time */
  dueAt: string;
  done: boolean;
  assignee?: string;
}

export interface LeadResume {
  fileName: string;
  /** Bytes */
  fileSize: number;
  /** ISO date-time */
  uploadedAt: string;
  /** Link to view/download the file. Without it, Preview and Download are disabled. */
  url?: string;
  pages?: number;
  /** ISO date-time of the AI extraction */
  parsedAt?: string;
}

/** Everything about a lead that isn't on the table row itself */
export interface LeadRecord {
  status: LeadStatus;
  owner?: string;
  source?: string;
  /** ISO date-time */
  createdAt: string;
  activities: LeadActivity[];
  notes: LeadNote[];
  tasks: LeadTask[];
  resume?: LeadResume;
}

/** Changes the tabs can make; the hook decides how they're saved */
export interface LeadRecordActions {
  addNote: (body: string) => void;
  togglePinNote: (noteId: string) => void;
  deleteNote: (noteId: string) => void;
  addTask: (task: Pick<LeadTask, "title" | "type" | "dueAt">) => void;
  toggleTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  attachResume: (file: File) => void;
}

/** What every tab receives */
export interface LeadTabProps {
  candidate: Candidate;
  record: LeadRecord;
  actions: LeadRecordActions;
}

export type LeadTabValue = "overview" | "timeline" | "notes" | "tasks" | "resume" | "certifications";

export interface LeadTabDefinition {
  value: LeadTabValue;
  label: string;
  /** Small number next to the label (hidden when 0 or undefined) */
  count?: (candidate: Candidate, record: LeadRecord) => number | undefined;
  component: ComponentType<LeadTabProps>;
}
