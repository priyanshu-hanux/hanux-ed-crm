import { Link, useLocation } from "react-router";
import { MailWarning } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

/** Asks signed-in users with an unverified email to verify it. */
export function VerifyEmailBanner() {
    const { session } = useAuth();
    const { pathname } = useLocation();
    if (!session || session.user.emailVerifiedAt || pathname === "/settings") return null;

    return (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-sm">
            <MailWarning className="size-4 shrink-0 text-primary" />
            <span className="flex-1">
                Verify your email ({session.user.email}) to invite teammates and keep your account recoverable.
            </span>
            <Link to="/settings#email" className="font-medium text-primary hover:underline">
                Verify now
            </Link>
        </div>
    );
}
