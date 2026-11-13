import { useSearchParams } from "react-router";

export default function LeadsPage() {
    const [searchParams] = useSearchParams();

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-semibold"><span className="capitalize">{searchParams.get("type")}</span> Leads</h1>
                <p className="text-sm text-muted-foreground">
                    Manage and organize your CRM leads.
                </p>
            </div>
        </div>
    );
}
