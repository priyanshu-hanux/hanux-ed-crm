import type { ReactNode } from "react";
import { isBefore } from "date-fns";
import {
  Briefcase,
  Building2,
  CalendarClock,
  CalendarPlus,
  Clock,
  Contact,
  Flag,
  GraduationCap,
  Hourglass,
  Link2,
  Mail,
  MapPin,
  Phone,
  Radar,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CandidateTimezoneCell } from "@/components/sidebar/timezone/candidate-timezone-cell";
import { cn } from "@/lib/utils";
import { CountryFlag } from "@/components/sidebar/timezone/country-flag";
import {
  cleanEducation,
  cleanSkills,
  educationMeta,
  educationTitle,
  formatExperience,
  formatJobDates,
  getLatestJob,
  locationLabel,
} from "../../candidate-fields";
import { cleanContacts, cleanSocials } from "../../contact";
import { PlatformTag, SocialLink } from "../../social-links";
import { TASK_TYPE_CONFIG } from "../activity-config";
import { Actor } from "../shared/actor";
import { ContactList } from "../shared/contact-list";
import { DueBadge } from "../shared/due-badge";
import { InfoCard, InfoList, InfoRow } from "../shared/info-card";
import { RelativeTime } from "../shared/relative-time";
import { TabBody } from "../shared/section";
import { StatusBadge } from "../shared/status-badge";
import type { LeadTabProps } from "../types";

export function OverviewTab({ candidate, record }: LeadTabProps) {
  const skills = cleanSkills(candidate.skills);
  const emails = cleanContacts(candidate.emails, "email");
  const phones = cleanContacts(candidate.phones, "phone");
  const socials = cleanSocials(candidate.socials);
  const latest = getLatestJob(candidate);
  const jobs = (candidate.experience ?? []).filter((job) => job.company?.trim());
  const education = cleanEducation(candidate.education);
  const location = locationLabel(candidate);
  const nextTask = record.tasks
    .filter((task) => !task.done)
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt))[0];
  const nextTaskOverdue = !!nextTask && isBefore(new Date(nextTask.dueAt), new Date());
  const NextTaskIcon = nextTask ? TASK_TYPE_CONFIG[nextTask.type].icon : CalendarClock;

  return (
    <TabBody>
      {/* Pipeline summary: 2 × 2 tiles */}
      <section aria-label="Lead summary" className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="divide-y">
          <div className="grid grid-cols-2 divide-x">
            <SummaryTile icon={Flag} label="Status">
              <StatusBadge status={record.status} />
            </SummaryTile>
            <SummaryTile icon={UserRound} label="Owner">
              {record.owner ? <Actor name={record.owner} /> : "Unassigned"}
            </SummaryTile>
          </div>
          <div className="grid grid-cols-2 divide-x">
            <SummaryTile icon={Radar} label="Source">
              {record.source ?? "Unknown"}
            </SummaryTile>
            <SummaryTile icon={CalendarPlus} label="Added">
              <RelativeTime iso={record.createdAt} />
            </SummaryTile>
          </div>
        </div>
      </section>

      {nextTask && (
        <section
          aria-label="Next task"
          className={cn(
            "flex items-center gap-3 rounded-xl border bg-card p-3 shadow-xs",
            nextTaskOverdue && "border-red-200 bg-red-50/60 dark:border-red-500/30 dark:bg-red-500/5"
          )}
        >
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg ring-1",
              nextTaskOverdue
                ? "bg-red-100 text-red-600 ring-red-200 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/30"
                : "bg-muted text-muted-foreground ring-border"
            )}
          >
            <NextTaskIcon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Next task</p>
            <p className="truncate text-sm font-medium">{nextTask.title}</p>
          </div>
          <DueBadge iso={nextTask.dueAt} />
        </section>
      )}

      <InfoCard icon={Contact} title="Contact">
        <InfoList>
          <InfoRow
            icon={Mail}
            label={emails.length > 1 ? `Emails (${emails.length})` : "Email"}
            value={emails.length ? <ContactList points={emails} kind="email" /> : null}
          />
          <InfoRow
            icon={Phone}
            label={phones.length > 1 ? `Phones (${phones.length})` : "Phone"}
            value={phones.length ? <ContactList points={phones} kind="phone" /> : null}
          />
          <InfoRow
            icon={Link2}
            label={socials.length > 1 ? `Profiles (${socials.length})` : "Profile"}
            value={
              socials.length ? (
                <ul className="space-y-1">
                  {socials.map((social) => (
                    <li key={social.url} className="flex min-w-0 items-center gap-2">
                      <SocialLink social={social} className="text-sm font-medium" />
                      <PlatformTag social={social} />
                    </li>
                  ))}
                </ul>
              ) : null
            }
          />
          <InfoRow
            icon={Clock}
            label="Local time"
            value={candidate.timezone ? <CandidateTimezoneCell timeZone={candidate.timezone} /> : null}
          />
        </InfoList>
      </InfoCard>

      <InfoCard icon={Briefcase} title="Work">
        <InfoList>
          <InfoRow
            icon={Building2}
            label={latest?.isCurrent === false ? "Last company" : "Company"}
            value={latest?.job.company}
          />
          <InfoRow icon={Briefcase} label={latest?.isCurrent === false ? "Last role" : "Role"} value={latest?.job.title} />
          <InfoRow icon={Hourglass} label="Experience" value={formatExperience(candidate.totalExperienceMonths)} />
          <InfoRow
            icon={MapPin}
            label="Location"
            value={
              location ? (
                <span className="inline-flex items-center gap-2">
                  <CountryFlag code={candidate.location?.countryCode} decorative />
                  {location}
                </span>
              ) : null
            }
          />
        </InfoList>
      </InfoCard>

      <InfoCard icon={Building2} title="Work history" count={jobs.length || undefined}>
        {jobs.length ? (
          <ol className="divide-y">
            {jobs.map((job, index) => (
              <li key={`${job.company}-${job.startDate ?? index}`} className="flex gap-3 px-4 py-3">
                <div
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    job.endDate === null ? "bg-emerald-500" : "bg-muted-foreground/30"
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {job.title || "Role not provided"}
                    {job.endDate === null && <span className="sr-only"> (current)</span>}
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    {[job.company, job.location].filter(Boolean).join(" · ")}
                  </p>
                  {formatJobDates(job) && <p className="mt-0.5 text-xs text-muted-foreground">{formatJobDates(job)}</p>}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="px-4 py-3 text-sm text-muted-foreground">No work history</p>
        )}
      </InfoCard>

      <InfoCard icon={GraduationCap} title="Education" count={education.length || undefined}>
        {education.length ? (
          <ul className="divide-y">
            {education.map((entry, index) => (
              <li key={`${educationTitle(entry)}-${index}`} className="px-4 py-3">
                <p className="text-sm font-medium">{educationTitle(entry)}</p>
                {educationMeta(entry) && <p className="text-[13px] text-muted-foreground">{educationMeta(entry)}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-3 text-sm text-muted-foreground">No education listed</p>
        )}
      </InfoCard>

      <InfoCard icon={Sparkles} title="Skills" count={skills.length || undefined} bodyClassName="p-4">
        {skills.length ? (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <Badge key={skill} variant="outline" className="bg-muted/40 font-normal">
                {skill}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No skills listed</p>
        )}
      </InfoCard>
    </TabBody>
  );
}

function SummaryTile({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <dl className="min-w-0 px-4 py-3">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1.5 truncate text-sm font-medium text-foreground">{children}</dd>
    </dl>
  );
}
