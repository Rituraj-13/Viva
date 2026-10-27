import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/90 backdrop-blur-sm no-print">
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center gap-6 px-5 md:px-8">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-serif text-[26px] font-semibold leading-none tracking-[-0.04em]">
            Viva
          </span>
          <span className="h-2 w-2 translate-y-[-1px] rounded-full bg-red transition-transform group-hover:scale-125" />
        </Link>

        <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft md:inline">
          The oral exam for code
        </span>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/pitch"
            className="hidden px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft transition-colors hover:text-ink sm:inline"
          >
            Pitch
          </Link>
          <Link
            href="/demo"
            className="hidden px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft transition-colors hover:text-ink sm:inline"
          >
            Replays
          </Link>
          <Link
            href="/about"
            className="hidden px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft transition-colors hover:text-ink sm:inline"
          >
            Method
          </Link>
          <Link
            href="/build"
            className="hidden px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft transition-colors hover:text-ink sm:inline"
          >
            Build log
          </Link>
          <Link href="/new" className="btn btn-primary btn-sm">
            Run a viva
          </Link>
        </nav>
      </div>
    </header>
  );
}
