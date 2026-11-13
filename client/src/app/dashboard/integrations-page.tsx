import { useMemo, useState } from "react";
import { ArrowUpRight, ExternalLink, Plus, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { appIntegrations, categories, type Integration } from "@/components/integrations/integrations.config";
import { IntegrationStats } from "@/components/integrations/integration-stats";
import { IntegrationToolbar, type StatusFilter, type ViewMode } from "@/components/integrations/integration-toolbar";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { IntegrationListHeader, IntegrationRow } from "@/components/integrations/integration-row";
import { IntegrationDialog } from "@/components/integrations/integration-dialog";

const INITIAL_CONNECTED = ["slack", "monday", "twilio", "gmail"];

export default function IntegrationsPage() {
  const [connected, setConnected] = useState<string[]>(INITIAL_CONNECTED);
  const [category, setCategory] = useState("All");
  const [filter, setFilter] = useState<StatusFilter>("All");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");

  // Kept separate so dialog content doesn't vanish mid close-animation
  const [selected, setSelected] = useState<Integration | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const visibleIntegrations = useMemo(() => {
    const term = search.trim().toLowerCase();
    return appIntegrations.filter((item) => {
      const isConnected = connected.includes(item.id);
      const inCategory = category === "All" || item.category === category;
      const inStatus = filter === "All" || (filter === "Connected" ? isConnected : !isConnected);
      const inSearch =
        !term || `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(term);
      return inCategory && inStatus && inSearch;
    });
  }, [category, connected, filter, search]);

  const toggleConnection = (id: string, next: boolean) =>
    setConnected((current) =>
      next ? [...new Set([...current, id])] : current.filter((v) => v !== id),
    );

  const openDetails = (item: Integration) => {
    setSelected(item);
    setDialogOpen(true);
  };

  const resetFilters = () => {
    setSearch("");
    setCategory("All");
    setFilter("All");
  };

  const selectedConnected = !!selected && connected.includes(selected.id);
  const hasActiveFilters = search !== "" || category !== "All" || filter !== "All";

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Integrations</h1>
          <p className="text-sm text-muted-foreground">
            Connect your workspace with the tools your team already loves.
          </p>
        </div>
        <Button className="w-full gap-2 rounded-full sm:w-auto">
          <Plus className="size-4" /> Add New
        </Button>
      </section>

      <IntegrationStats
        total={appIntegrations.length}
        connected={connected.length}
        categoryCount={categories.length - 1}
      />

      <Card className="gap-0 overflow-hidden rounded-2xl py-0 shadow-sm shadow-slate-900/2">
        <IntegrationToolbar
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
          category={category}
          onCategoryChange={setCategory}
          view={view}
          onViewChange={setView}
        />
        <Separator />

        <div className="p-4 sm:p-5">
          {visibleIntegrations.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center">
              <span className="grid size-10 place-items-center rounded-full bg-muted">
                <Search className="size-5 text-muted-foreground" />
              </span>
              <p className="text-sm font-semibold">No integrations found</p>
              <p className="text-xs text-muted-foreground">Try another search or category.</p>
              <Button variant="link" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              {/* Grid: always on mobile; on md+ only when grid view is selected */}
              <div
                className={cn(
                  "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3",
                  view === "list" && "md:hidden",
                )}
              >
                {visibleIntegrations.map((item) => (
                  <IntegrationCard
                    key={item.id}
                    item={item}
                    isConnected={connected.includes(item.id)}
                    onOpen={openDetails}
                    onToggle={toggleConnection}
                  />
                ))}
              </div>

              {/* List: md+ only */}
              {view === "list" && (
                <div className="hidden overflow-hidden rounded-xl border md:block">
                  <IntegrationListHeader />
                  <div className="divide-y">
                    {visibleIntegrations.map((item) => (
                      <IntegrationRow
                        key={item.id}
                        item={item}
                        isConnected={connected.includes(item.id)}
                        onOpen={openDetails}
                        onToggle={toggleConnection}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span>
            Showing {visibleIntegrations.length} of {appIntegrations.length} integrations
          </span>
          {hasActiveFilters && (
            <Button
              variant="link"
              size="sm"
              className="h-auto justify-start gap-1 p-0 text-xs text-violet-700"
              onClick={resetFilters}
            >
              Browse all integrations <ArrowUpRight className="size-3.5" />
            </Button>
          )}
        </div>
      </Card>

      <footer className="flex flex-col gap-2 px-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 shrink-0" /> Your connections are encrypted and managed securely.
        </span>
        <a
          className="flex items-center gap-1.5 text-violet-700 hover:underline"
          href="mailto:support@hanux.com"
        >
          Need help? Contact support <ExternalLink className="size-3" />
        </a>
      </footer>

      <IntegrationDialog
        item={selected}
        open={dialogOpen}
        isConnected={selectedConnected}
        onOpenChange={setDialogOpen}
        onConfirm={() => {
          if (selected) toggleConnection(selected.id, !selectedConnected);
          setDialogOpen(false);
        }}
      />
    </main>
  );
}