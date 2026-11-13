import { LayoutGrid, ListFilter, PlugZap, RefreshCw, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface IntegrationStatsProps {
  total: number;
  connected: number;
  categoryCount: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function IntegrationStats({ total, connected, categoryCount }: IntegrationStatsProps) {
  const pct = total ? Math.round((connected / total) * 100) : 0;

  const stats: { label: string; value: string; note: string; icon: LucideIcon }[] = [
    { label: "Available", value: pad(total), note: "Catalog", icon: LayoutGrid },
    { label: "Connected", value: pad(connected), note: `${pct}% of catalog`, icon: PlugZap },
    { label: "Categories", value: pad(categoryCount), note: "Explore", icon: ListFilter },
    { label: "Sync activity", value: "Live", note: "Healthy", icon: RefreshCw },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(({ label, value, note, icon: Icon }) => (
        <div key={label} className="border border-border rounded-xl shadow-sm shadow-slate-900/2">
          <div className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600">
                <Icon className="size-4" />
              </span>
              <span className="truncate">{label}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <strong className="text-xl font-bold tracking-tight sm:text-2xl">{value}</strong>
              <Badge
                variant="secondary"
                className="rounded-full bg-emerald-50 text-[10px] font-medium text-emerald-700 hover:bg-emerald-50"
              >
                {note}
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}