import { LayoutGrid, ListFilter, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { categories, categoryIcons } from "@/components/integrations/integrations.config";

export const STATUS_FILTERS = ["All", "Available", "Connected"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];
export type ViewMode = "grid" | "list";

interface IntegrationToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: StatusFilter;
  onFilterChange: (value: StatusFilter) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  view: ViewMode;
  onViewChange: (value: ViewMode) => void;
}

export function IntegrationToolbar({
  search, onSearchChange, filter, onFilterChange,
  category, onCategoryChange, view, onViewChange,
}: IntegrationToolbarProps) {
  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search integrations..."
            aria-label="Search integrations"
            className="h-9 pl-9 pr-8 text-sm [&::-webkit-search-cancel-button]:hidden"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Status + view */}
        <div className="flex items-center gap-2">
          <Tabs
            value={filter}
            onValueChange={(v) => onFilterChange(v as StatusFilter)}
            className="flex-1 md:flex-none"
          >
            <TabsList className="grid h-9 w-full grid-cols-3 md:inline-flex md:w-auto">
              {STATUS_FILTERS.map((value) => (
                <TabsTrigger key={value} value={value} className="px-3 text-xs">
                  {value}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="hidden items-center rounded-lg border p-1 md:flex">
            {([
              { value: "grid", icon: LayoutGrid, label: "Grid view" },
              { value: "list", icon: ListFilter, label: "List view" },
            ] as const).map(({ value, icon: Icon, label }) => (
              <Button
                key={value}
                size="icon"
                variant={view === value ? "secondary" : "ghost"}
                className="size-7"
                onClick={() => onViewChange(value)}
                aria-label={label}
                aria-pressed={view === value}
              >
                <Icon className="size-4" />
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Category chips: horizontal scroll on mobile, no visible scrollbar */}
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-5 sm:px-5 [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-1.5">
          {categories.map((value) => {
            const Icon = categoryIcons[value] ?? LayoutGrid;
            const active = category === value;
            return (
              <Button
                key={value}
                size="sm"
                variant="ghost"
                aria-pressed={active}
                onClick={() => onCategoryChange(value)}
                className={cn(
                  "h-8 shrink-0 gap-2 rounded-full border px-3 text-xs",
                  active
                    ? "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-700"
                    : "border-transparent text-muted-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {value}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}