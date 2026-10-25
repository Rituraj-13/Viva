import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Viva — the oral exam for code",
    template: "%s · Viva",
  },
  description:
    "If you can build it, can you speak it? Viva gives your code a five-question oral exam, answered out loud with Wispr Flow, and returns an evidence-backed report.",
  openGraph: {
    title: "Viva — the oral exam for code",
    description:
      "Paste a file. Answer five questions out loud. Get a report that quotes the moment you understood it — or confidently didn’t.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Viva — the oral exam for code",
    description:
      "A five-question oral exam for the code you ship. Voice-first, evidence-backed.",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4efe4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
