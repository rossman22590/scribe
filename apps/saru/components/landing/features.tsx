"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Braces,
  CheckCircle2,
  FileStack,
  Highlighter,
  Library,
} from "lucide-react";

const features: Array<{
  icon: LucideIcon;
  title: string;
  copy: string;
  demo: "inline" | "selection" | "voice" | "models" | "versions" | "publish";
}> = [
  {
    icon: Highlighter,
    title: "Inline suggestions",
    copy: "Accept completions only when they fit the sentence you are already writing.",
    demo: "inline",
  },
  {
    icon: Bot,
    title: "Selection edits",
    copy: "Highlight a paragraph and ask for sharper, shorter, warmer, or more precise language.",
    demo: "selection",
  },
  {
    icon: Library,
    title: "Voice memory",
    copy: "Scribe can learn recurring tone and structure so edits feel less generic.",
    demo: "voice",
  },
  {
    icon: Braces,
    title: "Model choice",
    copy: "Route quick edits, long reasoning, and title generation to the right model.",
    demo: "models",
  },
  {
    icon: FileStack,
    title: "Version history",
    copy: "Track meaningful changes and return to earlier drafts without losing momentum.",
    demo: "versions",
  },
  {
    icon: CheckCircle2,
    title: "Publish-ready pages",
    copy: "Turn a private draft into a clean public document with reader-friendly sharing.",
    demo: "publish",
  },
];

function FeatureDemo({ type }: { type: (typeof features)[number]["demo"] }) {
  if (type === "inline") {
    return (
      <div className="space-y-3 text-sm">
        <p className="leading-7 text-[#101214] dark:text-white/90">
          The first line should pull the reader in
          <span className="text-[#d946ef]"> without overexplaining the idea.</span>
        </p>
        <div className="inline-flex rounded-md border border-black/10 bg-white px-2 py-1 text-xs text-[#596168] dark:border-white/10 dark:bg-white/10 dark:text-white/60">
          Tab to apply
        </div>
      </div>
    );
  }

  if (type === "selection") {
    return (
      <div className="space-y-3 text-sm">
        <div className="rounded-md bg-[#fdf2f8] px-3 py-2 text-[#831843] dark:bg-[#d946ef]/10 dark:text-[#f9a8d4]">
          &quot;tighten this argument&quot;
        </div>
        <div className="space-y-1 text-xs">
          <p className="text-[#c4514a] line-through">This section is kind of long.</p>
          <p className="text-[#7c3aed] dark:text-[#c4b5fd]">
            This section needs one clear claim.
          </p>
        </div>
      </div>
    );
  }

  if (type === "voice") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>Apply my style</span>
          <span className="rounded-full bg-[#d946ef] px-2 py-1 text-xs text-white">
            On
          </span>
        </div>
        <div className="h-2 rounded-full bg-black/10 dark:bg-white/10">
          <div className="h-2 w-4/5 rounded-full bg-[#d946ef]" />
        </div>
      </div>
    );
  }

  if (type === "models") {
    return (
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        {["Fast", "Deep", "Draft"].map((label) => (
          <div
            key={label}
            className="rounded-md border border-black/10 bg-white px-2 py-4 text-[#3c4043] dark:border-white/10 dark:bg-white/10 dark:text-white/70"
          >
            {label}
          </div>
        ))}
      </div>
    );
  }

  if (type === "versions") {
    return (
      <div className="space-y-2 text-xs">
        {["v3 Stronger close", "v2 Shorter intro", "v1 First draft"].map((label) => (
          <div
            key={label}
            className="rounded-md border border-black/10 bg-white px-3 py-2 text-[#596168] dark:border-white/10 dark:bg-white/10 dark:text-white/60"
          >
            {label}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/10">
      <div className="mb-3 h-2 w-2/3 rounded-full bg-[#101214]/20 dark:bg-white/25" />
      <div className="space-y-2">
        <div className="h-2 rounded-full bg-[#101214]/10 dark:bg-white/10" />
        <div className="h-2 w-5/6 rounded-full bg-[#101214]/10 dark:bg-white/10" />
      </div>
      <div className="mt-4 inline-flex rounded-md bg-[#101214] px-2 py-1 text-xs text-white dark:bg-white dark:text-[#101214]">
        Public
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section
      id="features"
      className="bg-[#fdf7ff] py-20 dark:bg-[#0d0f0f]"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8 lg:px-12">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase text-[#d946ef]">
            Built for working writers
          </p>
          <h2
            id="features-heading"
            className="mt-3 text-4xl font-semibold leading-tight text-[#101214] md:text-5xl dark:text-white"
          >
            The controls you expect from an AI editor.
          </h2>
          <p className="mt-5 text-base leading-7 text-[#596168] dark:text-white/70">
            Scribe focuses on the repeated moments that shape a draft: accepting
            an idea, rewriting a selected passage, preserving style, and shipping
            the finished page.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.45, delay: index * 0.04 }}
                className="flex min-h-[320px] flex-col rounded-lg border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#f5e8ff] text-[#7c3aed] dark:bg-[#d946ef]/20 dark:text-[#f0abfc]">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[#101214] dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#596168] dark:text-white/60">
                  {feature.copy}
                </p>
                <div className="mt-auto pt-8">
                  <FeatureDemo type={feature.demo} />
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
