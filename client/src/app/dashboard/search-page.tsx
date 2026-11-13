
"use client";

import * as React from "react";
import { appIcons } from "@/configs/icons";

import {
    AISearchInput,
    type SearchQuery,
} from "@/components/search/ai-search-input";

const suggestions = [
    {
        icon: appIcons.users,
        title: "Find potential leads",
        prompt: "Find 10 software engineers working at FAANG companies",
    },
    {
        icon: appIcons.search,
        title: "Research professionals",
        prompt: "Find 20 marketing specialists with PMP certification",
    },
    {
        icon: appIcons.globe,
        title: "Research a topic",
        prompt: "What is PMP certification and where is it used?",
    },
    {
        icon: appIcons.chart,
        title: "Analyze my CRM",
        prompt: "Give me an overview of my CRM lead database",
    },
];

export default function SearchPage() {
    const [prompt, setPrompt] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);

    async function handleSearch(query: SearchQuery) {
        setIsLoading(true);

        try {
            // TODO: Replace with your CRM AI search API.
            // The backend should use query.scope to determine
            // whether to search CRM, the web, or both.
            console.log("Search query:", query.text);
            console.log("Search scope:", query.scope);
            console.log("Attachments:", query.files);

            // Example:
            // const result = await searchApi(query);
            // setMessages((current) => [...current, result]);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <section className="flex w-full justify-center px-4 py-10 md:px-8 md:py-10">
            <div className="w-full max-w-3xl">
                <div className="mb-8 text-center">
                    <div className="relative mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-muted/40">
                        <appIcons.globe className="size-6 text-muted-foreground" />
                    </div>

                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                        What would you like to know?
                    </h1>

                    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                        Search your CRM, discover potential leads, analyze
                        business data, or research the latest information
                        from the web.
                    </p>
                </div>

                <AISearchInput
                    initialPrompt={prompt}
                    onTextChange={setPrompt}
                    onSubmitQuery={handleSearch}
                    isLoading={isLoading}
                />

                <section className="mt-8">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Try asking
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                        {suggestions.map((item) => {
                            const Icon = item.icon;

                            return (
                                <button
                                    key={item.title}
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => setPrompt(item.prompt)}
                                    className="group flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent/50 disabled:pointer-events-none disabled:opacity-50"
                                >
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                        <Icon className="size-4 text-muted-foreground" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium">
                                            {item.title}
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                            {item.prompt}
                                        </p>
                                    </div>

                                    <appIcons.arrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                </button>
                            );
                        })}
                    </div>
                </section>

                <p className="mt-8 text-center text-xs text-muted-foreground">
                    AI-generated answers may need verification.
                    CRM access permissions still apply.
                </p>
            </div>
        </section>
    );
};
