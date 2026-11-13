import type { ReactNode } from "react";

/** Spacing shared by every tab panel: cards stacked with a gap */
export function TabBody({ children }: { children: ReactNode }) {
  return <div className="space-y-4 p-4">{children}</div>;
}
