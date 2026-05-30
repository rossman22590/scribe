'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  hasSession: boolean;
  onBeginClick: () => void;
  isNavigating?: boolean;
  variant?: 'default' | 'editorial';
  navItems?: ReadonlyArray<{
    href: string;
    label: string;
  }>;
}

const defaultNavItems = [
  { href: '#workflow', label: 'Workflow' },
  { href: '#features', label: 'Features' },
] as const;

export function Header({
  hasSession,
  onBeginClick,
  isNavigating,
  variant = 'default',
  navItems = defaultNavItems,
}: HeaderProps) {
  const isEditorial = variant === 'editorial';

  return (
    <header
      className={cn(
        'fixed top-0 z-50 w-full backdrop-blur-xl',
        isEditorial
          ? 'border-b border-white/10 bg-[#0b0a09]/78 text-[#f4eadb]'
          : 'border-b border-black/10 bg-white/80 text-[#101214] dark:border-white/10 dark:bg-[#0d0f0f]/80 dark:text-white',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-8 lg:px-12">
        <Link
          href="/"
          className="group flex items-center gap-2"
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
              'text-lg font-semibold',
              isEditorial && 'tracking-[0.18em]',
            )}
          >
            Scribe
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className={cn(
            'hidden items-center gap-6 text-sm md:flex',
            isEditorial
              ? 'text-[#f4eadb]/58'
              : 'text-[#596168] dark:text-white/60',
          )}
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'group relative transition duration-300',
                isEditorial
                  ? 'hover:text-[#f4eadb]'
                  : 'hover:text-[#101214] dark:hover:text-white',
              )}
            >
              {item.label}
              <span
                className={cn(
                  'absolute -bottom-1 left-0 h-px w-0 transition-all duration-300 group-hover:w-full',
                  isEditorial ? 'bg-[#d8b46b]' : 'bg-[#101214] dark:bg-white',
                )}
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className={cn(
              'group h-9 rounded-lg px-4 transition duration-300',
              isEditorial
                ? 'bg-[#f4eadb] text-[#17120f] hover:-translate-y-0.5 hover:bg-white'
                : 'bg-[#7c3aed] text-white hover:bg-[#6d28d9] dark:bg-[#f0abfc] dark:text-[#22072a] dark:hover:bg-[#f5d0fe]',
            )}
            onClick={onBeginClick}
            disabled={isNavigating}
          >
            {hasSession ? 'Open' : 'Start'}
            {isEditorial && (
              <ArrowRight className="size-3.5 transition duration-300 group-hover:translate-x-0.5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
