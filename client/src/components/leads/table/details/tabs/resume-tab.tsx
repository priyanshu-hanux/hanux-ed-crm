import { useRef, type ReactNode } from "react";
import { AlertTriangle, Download, ExternalLink, FileText, ScanText, Upload } from "lucide-react";

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import { CONFIDENCE_FIELDS, hasExtractionScores } from "../../candidate-fields";
import { ConfidenceBar } from "../shared/confidence-bar";
import { EmptyState } from "../shared/empty-state";
import { InfoCard } from "../shared/info-card";
import { RelativeTime } from "../shared/relative-time";
import { TabBody } from "../shared/section";
import type { LeadTabProps } from "../types";
import { confidenceLevel, formatFileSize } from "../utils";


const RESUME_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** The resume file and how confidently each field was extracted from it */
export function ResumeTab({ candidate, record, actions }: LeadTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { resume } = record;
  const scores = candidate.confidence ?? {};
  const extracted = hasExtractionScores(candidate);
  // Only the fields the parser scored; a field it skipped isn't "0% confident"
  const scoredFields = CONFIDENCE_FIELDS.filter(({ key }) => typeof scores[key] === "number");
  const lowConfidence = scoredFields.filter(({ key }) => confidenceLevel(scores[key]).level === "low");
  const average = scoredFields.length
    ? Math.round(scoredFields.reduce((sum, { key }) => sum + confidenceLevel(scores[key]).percent, 0) / scoredFields.length)
    : 0;

  const chooseFile = () => fileInputRef.current?.click();

  return (
    <TabBody>
      <input
        ref={fileInputRef}
        type="file"
        accept={RESUME_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) actions.attachResume(file);
          event.currentTarget.value = "";
        }}
      />

      {resume ? (
        <InfoCard
          icon={FileText}
          title="Resume file"
          action={
            <Button variant="outline" size="xs" onClick={chooseFile} className="bg-background">
              <Upload />
              Replace
            </Button>
          }
          bodyClassName="p-3"
        >
          <Attachment className="w-full border-0 bg-muted/40">
            <AttachmentMedia className="bg-red-50 text-red-600 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20">
              <FileText />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{resume.fileName}</AttachmentTitle>
              <AttachmentDescription>
                {formatFileSize(resume.fileSize)}
                {resume.pages ? ` · ${resume.pages} pages` : ""} · uploaded <RelativeTime iso={resume.uploadedAt} />
              </AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions className="gap-1">
              <ResumeLink url={resume.url} label="Open resume" icon={<ExternalLink />} />
              <ResumeLink url={resume.url} label="Download resume" icon={<Download />} download={resume.fileName} />
            </AttachmentActions>
          </Attachment>
          {!resume.url && (
            <p className="mt-2 px-1 text-xs text-muted-foreground">
              Open and download become available once resumes are served by the API.
            </p>
          )}
        </InfoCard>
      ) : (
        <EmptyState
          icon={FileText}
          title="No resume attached"
          description="Upload a PDF or Word file. Fields are extracted automatically."
          action={
            <Button size="sm" variant="outline" onClick={chooseFile}>
              <Upload />
              Upload resume
            </Button>
          }
        />
      )}

      <InfoCard
        icon={ScanText}
        title="Extracted fields"
        count={extracted ? `${average}% avg` : undefined}
        action={
          resume?.parsedAt ? (
            <span className="text-xs text-muted-foreground">
              Parsed <RelativeTime iso={resume.parsedAt} />
            </span>
          ) : undefined
        }
      >
        {!extracted && (
          <p className="px-4 py-3 text-sm text-muted-foreground">
            This profile was entered manually, so there are no extraction scores.
          </p>
        )}
        {extracted && lowConfidence.length > 0 && (
          <div className="flex items-start gap-2 border-b bg-red-50/70 px-4 py-2.5 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">
            <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            Review {lowConfidence.map((field) => field.label.toLowerCase()).join(", ")}: extracted with low confidence.
          </div>
        )}
        {extracted && (
          <>
            <ul className="divide-y">
              {scoredFields.map(({ key, label }) => (
                <li key={key} className="px-4 py-2.5">
                  <ConfidenceBar label={label} value={scores[key]} />
                </li>
              ))}
            </ul>
            <p className="border-t bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
              80%+ is reliable · 60–79% worth a glance · below 60% should be checked
            </p>
          </>
        )}
      </InfoCard>
    </TabBody>
  );
}

/** Open / download action: a link when the file has a URL, a disabled button otherwise */
function ResumeLink({
  url,
  label,
  icon,
  download,
}: {
  url?: string;
  label: string;
  icon: ReactNode;
  download?: string;
}) {
  if (!url) {
    return (
      <AttachmentAction variant="outline" disabled aria-label={label} title={label}>
        {icon}
      </AttachmentAction>
    );
  }
  return (
    <AttachmentAction variant="outline" asChild aria-label={label} title={label}>
      <a href={url} target={download ? undefined : "_blank"} rel="noreferrer" download={download}>
        {icon}
      </a>
    </AttachmentAction>
  );
}
