export default function ProjectLoading() {
  return (
    <div>
      <nav className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="h-6 w-40 animate-pulse bg-line" />
          <div className="h-8 w-8 animate-pulse rounded-full bg-line" />
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-7 flex items-start justify-between border-b border-line pb-6">
          <div>
            <div className="h-9 w-64 animate-pulse bg-line" />
            <div className="mt-3 h-4 w-48 animate-pulse bg-line" />
          </div>
          <div className="h-6 w-24 animate-pulse bg-line" />
        </div>

        <div className="mb-7 flex gap-6 border-b border-line pb-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 w-20 animate-pulse bg-line" />
          ))}
        </div>

        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse border border-line bg-card" />
          ))}
        </div>
      </main>
    </div>
  );
}
