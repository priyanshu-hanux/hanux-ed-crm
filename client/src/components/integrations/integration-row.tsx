import { Check, MoreHorizontal, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { IntegrationLogo } from "@/components/integrations/integration-logo";
import type { Integration } from "@/components/integrations/integrations.config";

const ROW_GRID =
  "grid items-center gap-4 px-4 grid-cols-[minmax(0,1fr)_auto_auto] lg:grid-cols-[minmax(0,1fr)_160px_150px_auto]";

interface RowProps {
  item: Integration;
  isConnected: boolean;
  onOpen: (item: Integration) => void;
  onToggle: (id: string, next: boolean) => void;
}

export function IntegrationListHeader() {
  return (
    <div className={cn(ROW_GRID, "h-10 border-b bg-muted/40 text-[11px] font-medium uppercase tracking-wider text-muted-foreground")}>
      <span>Integration</span>
      <span className="hidden lg:block">Category</span>
      <span>Status</span>
      <span className="sr-only">Actions</span>
    </div>
  );
}

export function IntegrationRow({ item, isConnected, onOpen, onToggle }: RowProps) {
  return (
    <div className={cn(ROW_GRID, "group py-3 transition-colors hover:bg-muted/30")}>
      {/* Integration */}
      <div className="flex min-w-0 items-center gap-3">
        <IntegrationLogo item={item} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="truncate text-sm font-semibold hover:text-violet-700 focus-visible:outline-none focus-visible:underline"
            >
              {item.name}
            </button>
            {item.popular && (
              <Badge variant="secondary" className="shrink-0 rounded-full bg-violet-50 px-1.5 py-0 text-[10px] font-medium text-violet-700 hover:bg-violet-50">
                Popular
              </Badge>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground" title={item.description}>
            {item.description}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <Switch
          checked={isConnected}
          onCheckedChange={() => onOpen(item)}
          aria-label={`${isConnected ? "Manage" : "Connect"} ${item.name}`}
          className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-200"
        />
        <span className={cn("hidden text-xs xl:inline", isConnected ? "text-emerald-700" : "text-muted-foreground")}>
          {isConnected ? (
            <span className="inline-flex items-center gap-1">Connected</span>
          ) : "Not connected"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onOpen(item)}
        >
          <Settings2 className="size-3.5" />
          <span className="hidden lg:inline">Details</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label={`${item.name} options`}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onOpen(item)}>View details</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => (isConnected ? onToggle(item.id, false) : onOpen(item))}
              className={cn(isConnected && "text-rose-600 focus:text-rose-600")}
            >
              {isConnected ? "Disconnect" : "Connect"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}