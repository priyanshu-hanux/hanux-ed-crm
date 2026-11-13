import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";

import { CopyValueButton, EmptyCell, OverflowHoverCard } from "@/components/table";
import { cn } from "@/lib/utils";
import type { SocialProfile } from "@/types/candidate";
import { cleanSocials, SOCIAL_PLATFORM_LABEL, socialLabel } from "./contact";

/** One profile as a short link ("in/jane-doe", "@jane") that opens in a new tab */
export function SocialLink({ social, className }: { social: SocialProfile; className?: string }) {
  const platform = SOCIAL_PLATFORM_LABEL[social.platform];
  return (
    <a
      href={social.url}
      target="_blank"
      rel="noopener noreferrer"
      title={social.url}
      // Clicking a link in a row shouldn't also open the row's details drawer
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "inline-flex min-w-0 max-w-full items-center gap-1.5 text-[13px] text-sky-700 underline-offset-4 hover:underline dark:text-sky-400",
        className
      )}
    >
      <span className="truncate">{socialLabel(social)}</span>
      <ExternalLink className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
      <span className="sr-only">({platform}, opens in a new tab)</span>
    </a>
  );
}

/** Small platform tag: "LinkedIn", "GitHub"… */
export function PlatformTag({ social }: { social: SocialProfile }) {
  return (
    <span className="shrink-0 rounded-full border bg-muted/50 px-1.5 text-[10px] font-medium text-muted-foreground">
      {SOCIAL_PLATFORM_LABEL[social.platform]}
    </span>
  );
}

/**
 * A candidate's profiles in a table cell: the first one (LinkedIn when there is one) and a
 * "+N" pill that lists every profile with its platform, a link and a copy button.
 */
export function SocialsCell({
  socials,
  emptyText,
}: {
  socials: readonly SocialProfile[] | null | undefined;
  emptyText?: ReactNode;
}) {
  const list = cleanSocials(socials);
  if (list.length === 0) return <EmptyCell>{emptyText}</EmptyCell>;

  const [first, ...others] = list;
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <SocialLink social={first} className="min-w-0" />
      {/* Without other profiles, say which site the link is (LinkedIn is the expected default) */}
      {others.length === 0 && first.platform !== "linkedin" && <PlatformTag social={first} />}
      {others.length > 0 && (
        <OverflowHoverCard
          hiddenCount={others.length}
          title={`${list.length} profiles`}
          triggerLabel={`Show all ${list.length} profiles`}
        >
          <ul className="divide-y">
            {list.map((social) => (
              <li key={social.url} className="flex items-center gap-2 px-3 py-1.5">
                <span className="w-16 shrink-0 text-[11px] font-medium text-muted-foreground">
                  {SOCIAL_PLATFORM_LABEL[social.platform]}
                </span>
                <SocialLink social={social} className="min-w-0 flex-1" />
                <CopyValueButton text={social.url} label={`${SOCIAL_PLATFORM_LABEL[social.platform]} link`} />
              </li>
            ))}
          </ul>
        </OverflowHoverCard>
      )}
    </div>
  );
}
