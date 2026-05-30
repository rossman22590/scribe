'use client';

import { ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatCreditTransactionDate,
  formatCreditTransactionReason,
} from '@/lib/credits/transaction-display';

export type CreditTransactionItem = {
  id: string;
  amount: number;
  balanceAfter: number;
  reason: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

type CreditTransactionsListProps = {
  transactions?: CreditTransactionItem[];
  isLoading?: boolean;
  error?: boolean;
  emptyMessage?: string;
  className?: string;
};

export function CreditTransactionsList({
  transactions,
  isLoading = false,
  error = false,
  emptyMessage = 'No credit activity yet.',
  className,
}: CreditTransactionsListProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center py-8 text-muted-foreground',
          className
        )}
        aria-label="Loading transactions"
      >
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <p
        className={cn(
          'text-sm text-muted-foreground text-center py-8 px-4',
          className
        )}
      >
        Could not load transactions. Please try again.
      </p>
    );
  }

  if (!transactions?.length) {
    return (
      <p
        className={cn(
          'text-sm text-muted-foreground text-center py-8 px-4',
          className
        )}
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className={cn('space-y-1', className)} aria-label="Credit transactions">
      {transactions.map((tx) => {
        const isCredit = tx.amount > 0;
        return (
          <li
            key={tx.id}
            className="flex items-start gap-3 rounded-md px-3 py-2.5 hover:bg-muted/50 transition-colors"
          >
            <div
              className={cn(
                'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full',
                isCredit
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground'
              )}
              aria-hidden
            >
              {isCredit ? (
                <ArrowDownLeft className="size-3.5" />
              ) : (
                <ArrowUpRight className="size-3.5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {formatCreditTransactionReason(tx.reason, tx.metadata)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCreditTransactionDate(tx.createdAt)} · balance{' '}
                {tx.balanceAfter.toLocaleString()}
              </p>
            </div>
            <p
              className={cn(
                'text-sm font-medium tabular-nums shrink-0',
                isCredit
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-foreground'
              )}
            >
              {isCredit ? '+' : ''}
              {tx.amount}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
