import Link from "next/link";
import Script from "next/script";
import { MessageSquare, Zap, Clock, ArrowRight } from "lucide-react";

export const metadata = {
  title: "BizBot Demo — Bella Vista Restaurant",
  description:
    "See BizBot in action. Chat with Bella, the AI assistant for Bella Vista Restaurant.",
};

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Answers instantly",
    description:
      "Responds to customer questions about hours, menus, reservations, and more — around the clock.",
  },
  {
    icon: Clock,
    title: "Always available",
    description:
      "No hold times, no missed chats. BizBot handles inquiries 24/7 so your team can focus on service.",
  },
  {
    icon: Zap,
    title: "Ready in minutes",
    description:
      "Upload your business content, and BizBot learns everything it needs to represent your brand.",
  },
];

export default function DemoPage() {
  return (
    <>
      {/*
       * Load the widget launcher after the page becomes interactive.
       * "lazyOnload" is the recommended strategy for chat support plugins per the Next.js docs —
       * it defers the script to browser idle time so it never blocks the main thread.
       */}
      <Script
        src="/widget/launcher.js?token=demo-bella-vista"
        strategy="lazyOnload"
      />

      <div className="min-h-screen bg-zinc-950 text-white">
        {/* ── Nav bar ─────────────────────────────────────────────── */}
        <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
          <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
            <span className="font-semibold text-lg tracking-tight">
              <span style={{ color: "#65fe08" }}>Biz</span>Bot
            </span>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              View Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* ── Hero ────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-1.5 text-xs font-medium text-zinc-400 mb-8"
          >
            <span
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: "#65fe08" }}
            />
            Live demo — Bella Vista Restaurant
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
            AI Chat for{" "}
            <span style={{ color: "#65fe08" }}>Local Businesses</span>
          </h1>

          <p className="text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            BizBot turns your business knowledge into a 24/7 AI assistant that
            answers customer questions, captures leads, and books reservations —
            automatically.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ backgroundColor: "#65fe08" }}
            >
              View Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
            >
              Get started free
            </a>
          </div>
        </section>

        {/* ── Demo callout ────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 sm:p-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div
                className="flex-shrink-0 rounded-xl p-3"
                style={{ backgroundColor: "rgba(101,254,8,0.12)" }}
              >
                <MessageSquare
                  className="h-6 w-6"
                  style={{ color: "#65fe08" }}
                />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-1">
                  You&apos;re talking to Bella
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Bella is the AI assistant for{" "}
                  <span className="text-white font-medium">
                    Bella Vista Restaurant
                  </span>
                  . She knows the menu, hours, reservation policy, and more.
                  Click the chat button in the{" "}
                  <span className="text-white font-medium">
                    bottom-right corner
                  </span>{" "}
                  to start a conversation.
                </p>
              </div>
              <div
                className="flex-shrink-0 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
                style={{
                  borderColor: "rgba(101,254,8,0.3)",
                  color: "#65fe08",
                  backgroundColor: "rgba(101,254,8,0.08)",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: "#65fe08" }}
                />
                Widget loading below
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature cards ───────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <h2 className="text-2xl font-bold text-center mb-10">
            Why local businesses choose BizBot
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 flex flex-col gap-4 hover:border-zinc-700 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(101,254,8,0.10)" }}
                >
                  <Icon className="h-5 w-5" style={{ color: "#65fe08" }} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <footer className="border-t border-zinc-800 py-8">
          <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-zinc-500">
            <span>
              &copy; {new Date().getFullYear()}{" "}
              <span className="text-zinc-300 font-medium">BizBot</span>. All
              rights reserved.
            </span>
            <Link
              href="/dashboard"
              className="hover:text-zinc-300 transition-colors"
            >
              Dashboard &rarr;
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}
