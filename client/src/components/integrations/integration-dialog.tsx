import { ArrowUpRight, Check, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { IntegrationLogo } from "@/components/integrations/integration-logo";
import type { Integration } from "@/components/integrations/integrations.config";

interface IntegrationDialogProps {
  item: Integration | null;
  open: boolean;
  isConnected: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function IntegrationDialog({ item, open, isConnected, onOpenChange, onConfirm }: IntegrationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md gap-5 rounded-2xl p-5 sm:p-6">
        {item && (
          <>
            <DialogHeader className="items-center space-y-2 text-center">
              <IntegrationLogo item={item} size="lg" />
              <Badge variant="secondary" className="bg-violet-50 text-[10px] tracking-wider text-violet-700 hover:bg-violet-50">
                {isConnected ? "MANAGE CONNECTION" : "CONNECT INTEGRATION"}
              </Badge>
              <DialogTitle className="text-lg sm:text-xl">
                {isConnected ? `Manage ${item.name}` : `Connect ${item.name}`}
              </DialogTitle>
              <DialogDescription className="text-center text-xs leading-relaxed sm:text-sm">
                {isConnected
                  ? `${item.name} is connected to your HANUX workspace. Review access or disconnect below.`
                  : `Allow HANUX to securely connect with ${item.name} and bring your workflow together.`}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold">
                <ShieldCheck className="size-4 text-emerald-600" /> Requested permissions
              </div>
              <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {item.permissions.map((permission) => (
                  <li key={permission} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    {permission}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                HANUX only uses these permissions to power the features you enable. You can revoke access at any time.
              </p>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
              <Button
                variant={isConnected ? "destructive" : "default"}
                className={`w-full gap-2 ${isConnected ? "" : "bg-violet-600 hover:bg-violet-700"}`}
                onClick={onConfirm}
              >
                {isConnected
                  ? <><X className="size-4" /> Disconnect integration</>
                  : <>Continue to {item.name} <ArrowUpRight className="size-4" /></>}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
                Not now
              </Button>
            </DialogFooter>

            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3 shrink-0" /> Secured via OAuth · Tokens encrypted at rest
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}