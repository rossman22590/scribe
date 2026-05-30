'use client';

import Link from 'next/link';
import { PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FooterProps {
  variant?: 'default' | 'editorial';
}

export function Footer({ variant = 'default' }: FooterProps) {
  const isEditorial = variant === 'editorial';

  return (
    <footer
      className={cn(
        'border-t py-8 text-sm',
        isEditorial
          ? 'border-white/10 bg-[#0b0a09] text-[#f4eadb]/56'
          : 'border-black/10 bg-[#fdf7ff] text-[#596168] dark:border-white/10 dark:bg-[#0d0f0f] dark:text-white/60',
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 md:px-8 lg:px-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link
            href="/"
            className={cn(
              'group flex items-center gap-2',
              isEditorial ? 'text-[#f4eadb]' : 'text-[#101214] dark:text-white',
            )}
            aria-label="Scribe home"
          >
            <span
              className={cn(
                'flex size-8 items-center justify-center rounded-lg transition duration-300 group-hover:-translate-y-0.5',
                isEditorial
                  ? 'border border-[#d8b46b]/25 bg-[#f4eadb] text-[#17120f]'
                  : 'bg-[#7c3aed] text-white dark:bg-[#f0abfc] dark:text-[#22072a]',
              )}
            >
              <PenLine className="size-4" />
            </span>
            <span
              className={cn(
                'font-semibold',
                isEditorial && 'tracking-[0.18em]',
              )}
            >
              Scribe
            </span>
          </Link>

          <span
            className={cn(
              'text-sm',
              isEditorial
                ? 'text-[#f4eadb]/56'
                : 'text-[#596168] dark:text-white/60',
            )}
          >
            AI writing workspace for drafts, edits, and published pages.
          </span>
        </div>

        <div
          className={cn(
            'border-t pt-5',
            isEditorial
              ? 'border-white/10'
              : 'border-black/10 dark:border-white/10',
          )}
        >
          Copyright {new Date().getFullYear()} Scribe. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
