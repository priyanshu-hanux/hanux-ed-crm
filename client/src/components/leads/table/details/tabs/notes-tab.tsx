import { useState } from "react";
import { Pin, PinOff, StickyNote, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Actor } from "../shared/actor";
import { EmptyState } from "../shared/empty-state";
import { InfoCard } from "../shared/info-card";
import { RelativeTime } from "../shared/relative-time";
import { TabBody } from "../shared/section";
import type { LeadNote, LeadTabProps } from "../types";

/** Internal notes about the lead. Pinned notes stay on top. */
export function NotesTab({ record, actions }: LeadTabProps) {
  const [draft, setDraft] = useState("");
  const notes = [...record.notes].sort(
    (a, b) => Number(!!b.pinned) - Number(!!a.pinned) || Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    actions.addNote(body);
    setDraft("");
  };

  return (
    <TabBody>
      {/* Composer */}
      <form
        className="overflow-hidden rounded-xl border bg-card shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Ctrl/⌘ + Enter saves, like most CRMs
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Write a note about this lead…"
          aria-label="New note"
          className="min-h-20 resize-none rounded-none border-0 bg-transparent px-4 py-3 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <div className="flex items-center justify-between gap-2 border-t bg-muted/40 px-4 py-2">
          <p className="text-xs text-muted-foreground">
            <kbd className="rounded border bg-background px-1 font-sans text-[10px]">Ctrl</kbd> +{" "}
            <kbd className="rounded border bg-background px-1 font-sans text-[10px]">Enter</kbd> to save · visible to your team
          </p>
          <Button type="submit" size="sm" disabled={!draft.trim()}>
            Add note
          </Button>
        </div>
      </form>

      {notes.length === 0 ? (
        <EmptyState icon={StickyNote} title="No notes yet" description="Capture call outcomes, preferences and anything the next person should know." />
      ) : (
        <InfoCard icon={StickyNote} title="Notes" count={notes.length}>
          <ul className="divide-y">
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onTogglePin={() => actions.togglePinNote(note.id)}
                onDelete={() => actions.deleteNote(note.id)}
              />
            ))}
          </ul>
        </InfoCard>
      )}
    </TabBody>
  );
}

function NoteItem({ note, onTogglePin, onDelete }: { note: LeadNote; onTogglePin: () => void; onDelete: () => void }) {
  return (
    <li className={cn("group px-4 py-3", note.pinned && "bg-amber-50/60 dark:bg-amber-500/5")}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Actor name={note.author} className="font-medium text-foreground" />
        <span aria-hidden="true">·</span>
        <RelativeTime iso={note.createdAt} />
        {note.pinned && (
          <Badge
            variant="outline"
            className="gap-1 border-amber-200 bg-amber-100/60 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
          >
            <Pin className="size-3" aria-hidden="true" />
            Pinned
          </Badge>
        )}
        <div className="ml-auto flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
          <Button variant="ghost" size="icon-xs" onClick={onTogglePin} aria-label={note.pinned ? "Unpin note" : "Pin note"}>
            {note.pinned ? <PinOff /> : <Pin />}
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={onDelete} aria-label="Delete note" className="hover:text-destructive">
            <Trash2 />
          </Button>
        </div>
      </div>
      <p className="mt-2 whitespace-pre-wrap pl-[26px] text-sm leading-6 text-foreground">{note.body}</p>
    </li>
  );
}
