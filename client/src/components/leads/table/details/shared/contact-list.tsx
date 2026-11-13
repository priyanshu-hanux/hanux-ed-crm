import type { ContactPoint } from "@/types/candidate";
import { CONTACT_TYPE_LABEL, mailtoHref, phoneDigits, telHref } from "../../contact";
import { CopyButton } from "./copy-button";

const KIND_CONFIG = {
  email: { href: mailtoHref, copyText: (value: string) => value, label: "email" },
  phone: { href: telHref, copyText: phoneDigits, label: "phone number" },
} as const;

/**
 * Every email or phone of a lead, one per line: a clickable link (mailto/tel), its type
 * ("Work", "Personal"…), a "Primary" tag on the first one when there are several, and a copy button.
 * Pass the cleaned list (cleanContacts), which puts the primary first.
 */
export function ContactList({ points, kind }: { points: ContactPoint[]; kind: keyof typeof KIND_CONFIG }) {
  const config = KIND_CONFIG[kind];

  return (
    <ul className="space-y-1">
      {points.map(({ value, type }, index) => (
        <li key={`${value}-${index}`} className="flex min-w-0 items-center gap-2">
          <a
            href={config.href(value)}
            className="min-w-0 truncate font-medium text-foreground underline-offset-4 hover:underline"
            title={value}
          >
            {value}
          </a>
          {type && <span className="shrink-0 text-[10px] text-muted-foreground">{CONTACT_TYPE_LABEL[type]}</span>}
          {points.length > 1 && index === 0 && (
            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">Primary</span>
          )}
          <span className="ml-auto shrink-0">
            <CopyButton text={config.copyText(value)} label={config.label} />
          </span>
        </li>
      ))}
    </ul>
  );
}
