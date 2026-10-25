import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-rule bg-paper-deep/45 no-print">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-10 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-xl font-semibold tracking-[-0.03em]">
              Viva
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-red" />
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
            A voice-first oral exam for the code you ship. Built for people who
            can build anything and explain it out loud.
          </p>
        </div>

        <div>
          <p className="mono-label text-ink-soft">Take a look</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/demo" className="hover:text-red">
                Scripted replays
              </Link>
            </li>
            <li>
              <Link href="/new" className="hover:text-red">
                Run a live viva
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-red">
                Method &amp; limits
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mono-label text-ink-soft">The fine print</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Viva is a signal, not a hiring verdict. The final call is human.
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-ink-soft">
            Built for the WeMakeDevs × Wispr Flow No Hands challenge.
          </p>
        </div>
      </div>
    </footer>
  );
}
