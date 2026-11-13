import { Award } from "lucide-react";

import { CopyValueButton, EmptyCell, OverflowHoverCard } from "@/components/table";
import type { Certification } from "@/types/candidate";
import { certificationMeta, certificationStatus, cleanCertifications } from "./candidate-fields";

/** "Expired" tag for a certificate whose expiry date has passed */
function ExpiredTag() {
  return (
    <span className="shrink-0 rounded-full bg-red-500/10 px-1.5 text-[10px] font-medium text-red-700 dark:text-red-300">
      Expired
    </span>
  );
}

/**
 * A candidate's certifications in a table cell: the first one, and a "+N" pill that opens
 * a card listing all of them with provider, year and a copyable credential ID.
 */
export function CertificationsCell({ certifications }: { certifications: Certification[] | null | undefined }) {
  // Newest first, so the cell shows the most recent one
  const list = cleanCertifications(certifications);

  if (list.length === 0) return <EmptyCell />;

  const [first, ...others] = list;

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-[13px] font-medium" title={first.name}>
            {first.name}
          </span>
          {certificationStatus(first) === "expired" && <ExpiredTag />}
        </div>
        <div className="truncate text-[10px] tracking-wide text-muted-foreground">{certificationMeta(first)}</div>
      </div>

      {others.length > 0 && (
        <OverflowHoverCard
          hiddenCount={others.length}
          title={`${list.length} certifications`}
          triggerLabel={`Show all ${list.length} certifications`}
          className="w-80"
        >
          <ul className="divide-y">
            {list.map((cert, index) => (
              <li key={`${cert.credentialId || cert.name}-${index}`} className="flex gap-3 px-3 py-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Award className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium leading-snug">
                    {cert.name}
                    {certificationStatus(cert) === "expired" && (
                      <span className="ml-1.5 inline-block align-middle">
                        <ExpiredTag />
                      </span>
                    )}
                  </p>
                  {certificationMeta(cert) && (
                    <p className="text-xs text-muted-foreground">{certificationMeta(cert)}</p>
                  )}
                  {cert.credentialId?.trim() && (
                    <div className="mt-1 flex items-center gap-1">
                      <span className="truncate font-mono text-[11px] text-muted-foreground" title={cert.credentialId}>
                        ID {cert.credentialId}
                      </span>
                      <CopyValueButton text={cert.credentialId} label="credential ID" className="size-5" />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </OverflowHoverCard>
      )}
    </div>
  );
}
