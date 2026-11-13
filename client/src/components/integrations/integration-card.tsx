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

interface IntegrationCardProps {
  item: Integration;
  isConnected: boolean;
  onOpen: (item: Integration) => void;
  onToggle: (id: string, next: boolean) => void;
}

export function IntegrationCard({ item, isConnected, onOpen, onToggle }: IntegrationCardProps) {
  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md",
        isConnected && "border-emerald-200/70",
      )}
    >
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <IntegrationLogo item={item} />
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold">{item.name}</h3>
              {/* {item.popular && (
              <Badge variant="secondary" className="rounded-full bg-violet-50 px-2 py-0 text-[10px] text-violet-700 hover:bg-violet-50">Popular</Badge>
            )} */}
              {isConnected && (
                <Badge className="gap-1 rounded-full bg-emerald-50 px-2 py-0 text-[10px] text-emerald-700 hover:bg-emerald-50">
                  <Check className="size-2.5" /> Connected
                </Badge>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" aria-label={`${item.name} options`}>
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

        <div className="min-w-0">
          <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-muted-foreground">{item.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t bg-muted/20 px-4 py-3">
        <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={() => onOpen(item)}>
          <Settings2 className="size-3.5" /> Details
        </Button>
        <Switch
          checked={isConnected}
          onCheckedChange={() => onOpen(item)}
          aria-label={`${isConnected ? "Manage" : "Connect"} ${item.name}`}
          className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-200"
        />
      </div>
    </article>
  );
}