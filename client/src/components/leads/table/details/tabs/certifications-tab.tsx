import { Award, BadgeCheck, Building, CalendarDays, CalendarX, ExternalLink, KeyRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { certificationStatus, cleanCertifications, formatYearMonth, hasExtractionScores } from "../../candidate-fields";
import { ConfidenceBar } from "../shared/confidence-bar";
import { CopyButton } from "../shared/copy-button";
import { EmptyState } from "../shared/empty-state";
import { InfoCard } from "../shared/info-card";
import { TabBody } from "../shared/section";
import type { LeadTabProps } from "../types";

/** Certifications listed on the resume, newest first */
export function CertificationsTab({ candidate }: LeadTabProps) {
  // Newest first; undated ones last
  const certifications = cleanCertifications(candidate.certifications);

  if (certifications.length === 0) {
    return (
      <TabBody>
        <EmptyState icon={Award} title="No certifications" description="None were found on the resume." />
      </TabBody>
    );
  }

  return (
    <TabBody>
      <InfoCard icon={Award} title="Certifications" count={certifications.length}>
        <ul className="divide-y">
          {certifications.map((cert, index) => (
            <li key={`${cert.credentialId || cert.name}-${index}`} className="group flex gap-3 px-4 py-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30">
                <Award className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-5">{cert.name}</p>
                  {certificationStatus(cert) === "recent" && (
                    <Badge
                      variant="outline"
                      className="shrink-0 gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                    >
                      <BadgeCheck className="size-3" aria-hidden="true" />
                      Recent
                    </Badge>
                  )}
                  {certificationStatus(cert) === "expired" && (
                    <Badge
                      variant="outline"
                      className="shrink-0 gap-1 border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                    >
                      <CalendarX className="size-3" aria-hidden="true" />
                      Expired
                    </Badge>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {cert.provider && (
                    <span className="inline-flex items-center gap-1">
                      <Building className="size-3.5" aria-hidden="true" />
                      {cert.provider}
                    </span>
                  )}
                  {formatYearMonth(cert.issueDate) && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3.5" aria-hidden="true" />
                      Issued {formatYearMonth(cert.issueDate)}
                    </span>
                  )}
                  {cert.expiryDate && formatYearMonth(cert.expiryDate) && (
                    <span className="inline-flex items-center gap-1">
                      {certificationStatus(cert) === "expired" ? "Expired" : "Expires"} {formatYearMonth(cert.expiryDate)}
                    </span>
                  )}
                  {cert.url && (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sky-700 underline-offset-4 hover:underline dark:text-sky-400"
                    >
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                      Verify
                    </a>
                  )}
                </div>
                {cert.credentialId && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border bg-muted/40 py-0.5 pl-2 pr-0.5 text-xs">
                    <KeyRound className="size-3 text-muted-foreground" aria-hidden="true" />
                    <span className="font-mono text-[11px] text-foreground">{cert.credentialId}</span>
                    <CopyButton text={cert.credentialId} label="credential ID" />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </InfoCard>

      {hasExtractionScores(candidate) && typeof candidate.confidence?.certifications === "number" && (
        <InfoCard icon={BadgeCheck} title="Extraction confidence" bodyClassName="px-4 py-3">
          <ConfidenceBar label="Certifications" value={candidate.confidence.certifications} />
        </InfoCard>
      )}
    </TabBody>
  );
}
