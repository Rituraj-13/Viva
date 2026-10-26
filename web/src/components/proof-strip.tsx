import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  FlaskConical,
  Play,
} from "lucide-react";
import Link from "next/link";
import { Kicker } from "@/components/ui";
import { demoAsset, reportAsset } from "@/lib/showcase";

export function ProofStrip() {
  const demo = demoAsset();
  const report = reportAsset();

  const items = [
    {
      icon: Play,
      label: demo.real ? "Demo · 2 min" : "Demo",
      title: demo.real ? "Watch the 2-min demo" : "Watch the scripted demo",
      body: demo.real
        ? "The problem, a spoken answer, and the report — start to finish."
        : "A full exam rhythm, replayed at reading speed. No mic or login.",
      href: demo.href,
      external: demo.external,
    },
    {
      icon: FileText,
      label: report.real ? "Real session" : "Sample session",
      title: report.real ? "See a real report" : "See a sample report",
      body: report.real
        ? "A finished live viva with exact quotes and line references."
        : "An authored report that shows every receipt the exam returns.",
      href: report.href,
      external: report.external,
    },
    {
      icon: FlaskConical,
      label: "60 seconds",
      title: "Try the sample exam",
      body: "A login throttle is preloaded. Press Build the exam and start talking.",
      href: "/new?sample=1",
      external: false,
    },
  ];

  return (
    <section className="border-b border-rule bg-paper-deep/25">
      <div className="mx-auto max-w-[1180px] px-5 py-10 md:px-8 md:py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Kicker>Proof, not promises</Kicker>
            <h2 className="mt-3 font-serif text-3xl leading-none tracking-[-0.04em] md:text-4xl">
              See it before you trust it.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
            Watch the demo, read a finished report, or take the sample exam in
            about a minute.
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="mono-label text-red">{item.label}</span>
                  <Icon size={16} className="text-ink-soft" />
                </div>
                <h3 className="mt-4 font-serif text-2xl leading-tight tracking-[-0.03em] group-hover:text-red">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {item.body}
                </p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-4 font-mono text-[9px] uppercase tracking-[0.08em] text-red">
                  {item.external ? "Open the demo" : "Open"}
                  {item.external ? (
                    <ArrowUpRight size={11} />
                  ) : (
                    <ArrowRight size={11} />
                  )}
                </span>
              </>
            );

            const className =
              "paper-card group flex flex-col p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:border-ink";

            return item.external ? (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className={className}
              >
                {content}
              </a>
            ) : (
              <Link key={item.title} href={item.href} className={className}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
