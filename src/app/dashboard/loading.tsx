export default function DashboardLoading() {
  return (
    <div>
      <nav className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="h-6 w-40 animate-pulse bg-line" />
          <div className="h-8 w-8 animate-pulse rounded-full bg-line" />
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="h-9 w-40 animate-pulse bg-line" />
        <div className="mt-3 h-4 w-72 animate-pulse bg-line" />
        <div className="mt-7 h-10 w-40 animate-pulse bg-line" />

        <div className="mt-9 flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, col) => (
            <div key={col} className="min-w-[280px] flex-1 border-t-2 border-line bg-paper/40 p-3">
              <div className="mb-3 h-4 w-24 animate-pulse bg-line" />
              <div className="space-y-2.5">
                {Array.from({ length: col === 0 ? 2 : 1 }).map((_, i) => (
                  <div key={i} className="h-24 animate-pulse border border-line bg-card" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
