import { useState } from "react";
import { addDays, endOfDay, isBefore } from "date-fns";
import { AlertCircle, CalendarClock, CheckCircle2, ListChecks, Plus, Trash2, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TASK_TYPE_CONFIG } from "../activity-config";
import { DueBadge } from "../shared/due-badge";
import { EmptyState } from "../shared/empty-state";
import { InfoCard } from "../shared/info-card";
import { TabBody } from "../shared/section";
import type { LeadTabProps, LeadTask, LeadTaskType } from "../types";

/** Due-date presets for a new task (days from today) */
const DUE_OPTIONS = [
  { value: "0", label: "Today" },
  { value: "1", label: "Tomorrow" },
  { value: "3", label: "In 3 days" },
  { value: "7", label: "Next week" },
];

/** Follow-ups for this lead: overdue first, then upcoming, then done */
export function TasksTab({ record, actions }: LeadTabProps) {
  const now = new Date();
  const open = record.tasks.filter((task) => !task.done).sort(byDueDate);
  const overdue = open.filter((task) => isBefore(new Date(task.dueAt), now));
  const upcoming = open.filter((task) => !isBefore(new Date(task.dueAt), now));
  const completed = record.tasks.filter((task) => task.done).sort(byDueDate);

  return (
    <TabBody>
      <NewTaskForm onAdd={actions.addTask} />

      {record.tasks.length === 0 ? (
        <EmptyState icon={ListChecks} title="No tasks yet" description="Plan the next call, email or follow-up so this lead doesn't go cold." />
      ) : (
        <>
          <TaskGroup
            icon={AlertCircle}
            title="Overdue"
            tasks={overdue}
            actions={actions}
            tone="danger"
          />
          <TaskGroup icon={CalendarClock} title="Upcoming" tasks={upcoming} actions={actions} />
          <TaskGroup icon={CheckCircle2} title="Completed" tasks={completed} actions={actions} />
        </>
      )}
    </TabBody>
  );
}

function byDueDate(a: LeadTask, b: LeadTask) {
  return Date.parse(a.dueAt) - Date.parse(b.dueAt);
}

function NewTaskForm({ onAdd }: { onAdd: LeadTabProps["actions"]["addTask"] }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<LeadTaskType>("follow-up");
  const [dueIn, setDueIn] = useState("1");

  return (
    <form
      className="overflow-hidden rounded-xl border bg-card shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) return;
        onAdd({ title: trimmed, type, dueAt: endOfDay(addDays(new Date(), Number(dueIn))).toISOString() });
        setTitle("");
      }}
    >
      <div className="flex items-center gap-2 px-4">
        <Plus className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a task, e.g. Share offer details"
          aria-label="Task title"
          className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t bg-muted/40 px-4 py-2">
        <Select value={type} onValueChange={(value) => setType(value as LeadTaskType)}>
          <SelectTrigger size="sm" className="w-32 bg-background" aria-label="Task type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {Object.entries(TASK_TYPE_CONFIG).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                <config.icon />
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dueIn} onValueChange={setDueIn}>
          <SelectTrigger size="sm" className="w-32 bg-background" aria-label="Due date">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {DUE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" size="sm" className="ml-auto" disabled={!title.trim()}>
          Add task
        </Button>
      </div>
    </form>
  );
}

function TaskGroup({
  icon,
  title,
  tasks,
  actions,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  tasks: LeadTask[];
  actions: LeadTabProps["actions"];
  tone?: "danger";
}) {
  if (tasks.length === 0) return null;
  return (
    <InfoCard icon={icon} title={title} count={tasks.length} tone={tone}>
      <ul className="divide-y">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} actions={actions} />
        ))}
      </ul>
    </InfoCard>
  );
}

function TaskItem({ task, actions }: { task: LeadTask; actions: LeadTabProps["actions"] }) {
  const { icon: TypeIcon, label: typeLabel } = TASK_TYPE_CONFIG[task.type];
  const checkboxId = `task-${task.id}`;

  return (
    <li className="group flex items-center gap-3 px-4 py-3">
      <Checkbox id={checkboxId} checked={task.done} onCheckedChange={() => actions.toggleTask(task.id)} />
      <label htmlFor={checkboxId} className="min-w-0 flex-1 cursor-pointer">
        <span className={cn("block truncate text-sm font-medium", task.done && "font-normal text-muted-foreground line-through")}>
          {task.title}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <TypeIcon className="size-3.5" aria-hidden="true" />
          {typeLabel}
          {task.assignee && (
            <>
              <span aria-hidden="true">·</span>
              {task.assignee}
            </>
          )}
        </span>
      </label>
      <DueBadge iso={task.dueAt} done={task.done} />
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => actions.deleteTask(task.id)}
        aria-label={`Delete task: ${task.title}`}
        className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <Trash2 />
      </Button>
    </li>
  );
}
