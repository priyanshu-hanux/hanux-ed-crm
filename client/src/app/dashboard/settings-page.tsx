import { EmailSection, PasswordSection, ProfileSection, SessionsSection } from "@/components/account/account-sections";

export default function SettingsPage() {
    return (
        <div className="w-full max-w-3xl space-y-5">
            <div>
                <h1 className="text-2xl font-semibold">Settings</h1>
                <p className="text-sm text-muted-foreground">Your profile, sign-in and devices.</p>
            </div>
            <ProfileSection />
            <EmailSection />
            <PasswordSection />
            <SessionsSection />
        </div>
    );
}
