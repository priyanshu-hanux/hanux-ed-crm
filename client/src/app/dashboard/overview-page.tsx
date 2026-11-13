import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  return (
    <main className="w-full min-w-0 space-y-6">


      {/* Heading */}
      <section className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40 rounded bg-muted" />
          <Skeleton className="h-4 w-64 rounded bg-muted" />
        </div>


        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-28 rounded-lg bg-muted" />
          <Skeleton className="h-10 w-28 rounded-lg bg-muted" />
          <Skeleton className="h-10 w-40 rounded-lg bg-muted" />
        </div>
      </section>


      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-28 rounded-xl bg-muted"
          />
        ))}
      </section>


      {/* Analytics */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Skeleton className="min-h-80 rounded-xl bg-muted" />
        <Skeleton className="min-h-80 rounded-xl bg-muted" />
      </section>


      {/* Bottom Widgets */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-[0.9fr_1.3fr_0.8fr]">
        <Skeleton className="min-h-80 rounded-xl bg-muted" />
        <Skeleton className="min-h-80 rounded-xl bg-muted" />
        <Skeleton className="min-h-80 rounded-xl bg-muted" />
      </section>


    </main>
  )
}
