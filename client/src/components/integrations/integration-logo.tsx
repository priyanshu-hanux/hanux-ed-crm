import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Integration } from "@/components/integrations/integrations.config";

const SIZES = {
  sm: { box: "size-10", px: 24 },
  lg: { box: "size-16", px: 40 },
} as const;

interface IntegrationLogoProps {
  item: Integration;
  size?: keyof typeof SIZES;
  className?: string;
}

export function IntegrationLogo({ item, size = "sm", className }: IntegrationLogoProps) {
  const [failed, setFailed] = useState(false);
  const { box, px } = SIZES[size];
  const dimension = Math.round(px * (item.logoScale ?? 1));

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-lg border bg-background",
        box,
        className,
      )}
    >
      {failed ? (
        <span
          className="grid size-full place-items-center text-sm font-semibold"
          style={{ backgroundColor: `${item.accent}15`, color: item.accent }}
        >
          {item.name.charAt(0)}
        </span>
      ) : (
        <img
          src={item.logo}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="max-h-full max-w-full object-contain"
          style={{ width: dimension, height: dimension }}
        />
      )}
    </div>
  );
}