'use client';

import useSWR from 'swr';
import { Coins, Loader2 } from 'lucide-react';
import { fetcher } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type CreditsResponse = {
  balance: number;
  allowance: number;
  plan: string;
  periodEnd: string;
};

interface CreditsBadgeProps {
  onClick?: () => void;
  className?: string;
}

export function CreditsBadge({ onClick, className }: CreditsBadgeProps) {
  const { data, isLoading } = useSWR<CreditsResponse>(
    '/api/user/credits',
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: true }
  );

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1',
          className
        )}
        aria-label="Loading credits"
      >
        <Loader2 className="size-3 animate-spin" />
        <span>Credits</span>
      </div>
    );
  }

  if (!data) return null;

  const isLow = data.balance <= Math.max(5, Math.floor(data.allowance * 0.1));

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => onClick?.()}
          className={cn(
            'flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border transition-colors cursor-pointer',
            isLow
              ? 'border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
              : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/50',
            className
          )}
          aria-label={`${data.balance} of ${data.allowance} AI credits remaining. View transaction history.`}
        >
          <Coins className="size-3.5" />
          <span className="font-medium tabular-nums">
            {data.balance.toLocaleString()}
            <span className="text-muted-foreground font-normal">
              {' '}
              / {data.allowance.toLocaleString()} credits
            </span>
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">
          {data.balance.toLocaleString()} of {data.allowance.toLocaleString()} credits
          remaining — {data.plan} plan
        </p>
        <p className="text-xs text-muted-foreground">
          Resets {new Date(data.periodEnd).toLocaleDateString()}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Click to view usage</p>
        {isLow && (
          <p className="text-xs text-amber-600 mt-1">Running low — upgrade for more</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
