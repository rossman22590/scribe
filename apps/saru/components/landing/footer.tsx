"use client";

import Link from "next/link";
import { PenLine } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-black/10 bg-[#fdf7ff] py-8 text-sm text-[#596168] dark:border-white/10 dark:bg-[#0d0f0f] dark:text-white/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 md:px-8 lg:px-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#101214] dark:text-white"
            aria-label="Scribe home"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#7c3aed] text-white dark:bg-[#f0abfc] dark:text-[#22072a]">
              <PenLine className="size-4" />
            </span>
            <span className="font-semibold">Scribe</span>
          </Link>

          <span className="text-sm text-[#596168] dark:text-white/60">
            AI writing workspace for drafts, edits, and published pages.
          </span>
        </div>

        <div className="border-t border-black/10 pt-5 dark:border-white/10">
          Copyright {new Date().getFullYear()} Scribe. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
