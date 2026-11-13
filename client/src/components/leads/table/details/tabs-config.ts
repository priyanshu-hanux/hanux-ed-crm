import { CertificationsTab } from "./tabs/certifications-tab";
import { NotesTab } from "./tabs/notes-tab";
import { OverviewTab } from "./tabs/overview-tab";
import { ResumeTab } from "./tabs/resume-tab";
import { TasksTab } from "./tabs/tasks-tab";
import { TimelineTab } from "./tabs/timeline-tab";
import type { LeadTabDefinition } from "./types";

/**
 * The tabs of the candidate drawer, in order. To add a tab: build a component that takes
 * LeadTabProps in ./tabs and add an entry here.
 */
export const LEAD_TABS: LeadTabDefinition[] = [
  { value: "overview", label: "Overview", component: OverviewTab },
  {
    value: "timeline",
    label: "Timeline",
    count: (_, record) => record.activities.length,
    component: TimelineTab,
  },
  {
    value: "notes",
    label: "Notes",
    count: (_, record) => record.notes.length,
    component: NotesTab,
  },
  {
    value: "tasks",
    label: "Tasks",
    // Open tasks only: that's what needs attention
    count: (_, record) => record.tasks.filter((task) => !task.done).length,
    component: TasksTab,
  },
  { value: "resume", label: "Resume", component: ResumeTab },
  {
    value: "certifications",
    label: "Certifications",
    count: (candidate) => candidate.certifications?.length,
    component: CertificationsTab,
  },
];
