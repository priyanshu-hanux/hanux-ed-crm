import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { Candidate } from "@/data/dummy-candidates";
import { isCandidateRow } from "../../candidate-row";
import { createDemoLeadRecord } from "../data/demo-lead-record";
import type { LeadActivity, LeadRecord, LeadRecordActions } from "../types";
import { createLocalId } from "../utils";

/** Shown as the author of notes and tasks created here, until the session user is wired in */
const CURRENT_USER = "You";

/**
 * The CRM record behind a candidate (timeline, notes, tasks, resume) and the actions that change it.
 *
 * The one place to connect the API: load the record with React Query and send each action
 * as a mutation. Changes are local for now and reset when the drawer closes.
 * Render the caller with `key={candidate.id}` so each candidate starts from its own record.
 */
export function useLeadRecord(candidate: Candidate): { record: LeadRecord; actions: LeadRecordActions } {
  // The table row's status and owner win, so the drawer shows what the row shows
  const [record, setRecord] = useState<LeadRecord>(() => {
    const demo = createDemoLeadRecord(candidate);
    return isCandidateRow(candidate) ? { ...demo, status: candidate.status, owner: candidate.owner ?? undefined } : demo;
  });

  const actions = useMemo<LeadRecordActions>(() => {
    const logActivity = (activity: Omit<LeadActivity, "id" | "at" | "actor">) => ({
      id: createLocalId("activity"),
      at: new Date().toISOString(),
      actor: CURRENT_USER,
      ...activity,
    });

    return {
      addNote: (body) => {
        const createdAt = new Date().toISOString();
        setRecord((prev) => ({
          ...prev,
          notes: [{ id: createLocalId("note"), body, author: CURRENT_USER, createdAt }, ...prev.notes],
          activities: [...prev.activities, logActivity({ type: "note", title: "Note added", description: body })],
        }));
        toast.success("Note added");
      },
      togglePinNote: (noteId) =>
        setRecord((prev) => ({
          ...prev,
          notes: prev.notes.map((note) => (note.id === noteId ? { ...note, pinned: !note.pinned } : note)),
        })),
      deleteNote: (noteId) =>
        setRecord((prev) => ({ ...prev, notes: prev.notes.filter((note) => note.id !== noteId) })),

      addTask: ({ title, type, dueAt }) => {
        setRecord((prev) => ({
          ...prev,
          tasks: [
            ...prev.tasks,
            { id: createLocalId("task"), title, type, dueAt, done: false, assignee: CURRENT_USER },
          ],
          activities: [...prev.activities, logActivity({ type: "task", title: `Task created: ${title}` })],
        }));
        toast.success("Task added");
      },
      toggleTask: (taskId) =>
        setRecord((prev) => {
          const task = prev.tasks.find((t) => t.id === taskId);
          if (!task) return prev;
          return {
            ...prev,
            tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
            activities: task.done
              ? prev.activities
              : [...prev.activities, logActivity({ type: "task", title: `Task completed: ${task.title}` })],
          };
        }),
      deleteTask: (taskId) =>
        setRecord((prev) => ({ ...prev, tasks: prev.tasks.filter((task) => task.id !== taskId) })),

      attachResume: (file) => {
        const now = new Date().toISOString();
        setRecord((prev) => ({
          ...prev,
          resume: { fileName: file.name, fileSize: file.size, uploadedAt: now, url: URL.createObjectURL(file) },
          activities: [...prev.activities, logActivity({ type: "resume", title: `Resume uploaded: ${file.name}` })],
        }));
        toast.success("Resume attached");
      },
    };
  }, []);

  return { record, actions };
}
