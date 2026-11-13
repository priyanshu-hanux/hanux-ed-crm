import { useSearchParams } from "react-router";

export default function CallLogsPage() {
    const [searchParams] = useSearchParams();

    return (
        <section className="flex w-full justify-center px-4 py-10 md:px-8 md:py-10">
            Call Logs {searchParams.get("type")}
        </section>
    );
}
