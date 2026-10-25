import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-[900px] flex-col items-center px-5 py-24 text-center md:px-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-red">
        404 / No viva here
      </p>
      <h1 className="mt-5 font-serif text-[clamp(3rem,8vw,6rem)] leading-[0.9] tracking-[-0.06em]">
        That page
        <br />
        <span className="italic text-red">didn’t answer.</span>
      </h1>
      <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
        The session may have been deleted, the link may be wrong, or this viva
        never existed. You can start a new one in about six minutes.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/new" className={buttonClass("primary")}>
          Run a viva
          <ArrowRight size={14} />
        </Link>
        <Link href="/demo" className={buttonClass("secondary")}>
          Watch a replay
        </Link>
      </div>
    </main>
  );
}
