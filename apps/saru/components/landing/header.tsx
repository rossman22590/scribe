"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";

interface HeaderProps {
  hasSession: boolean;
  onBeginClick: () => void;
  isNavigating?: boolean;
}

export function Header({
  hasSession,
  onBeginClick,
  isNavigating,
}: HeaderProps) {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-black/10 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#0d0f0f]/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-8 lg:px-12">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#101214] dark:text-white"
          aria-label="Scribe home"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-[#7c3aed] text-white dark:bg-[#f0abfc] dark:text-[#22072a]">
            <PenLine className="size-4" />
          </span>
          <span className="text-lg font-semibold">Scribe</span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-6 text-sm text-[#596168] dark:text-white/60 md:flex"
        >
          <a href="#workflow" className="hover:text-[#101214] dark:hover:text-white">
            Workflow
          </a>
          <a href="#features" className="hover:text-[#101214] dark:hover:text-white">
            Features
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-9 rounded-lg bg-[#7c3aed] px-4 text-white hover:bg-[#6d28d9] dark:bg-[#f0abfc] dark:text-[#22072a] dark:hover:bg-[#f5d0fe]"
            onClick={onBeginClick}
            disabled={isNavigating}
          >
            {hasSession ? "Open" : "Start"}
          </Button>
        </div>
      </div>
    </header>
  );
}
