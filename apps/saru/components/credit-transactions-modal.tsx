'use client';

import useSWR from 'swr';
import { ArrowDownLeft, ArrowUpRight, Coins, Loader2 } from 'lucide-react';
import { fetcher } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type CreditTransaction = {
  id: string;
  amount: number;
  balanceAfter: number;
  reason: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

type TransactionsResponse = {
  transactions: CreditTransaction[];
};

type CreditsResponse = {
  balance: number;
  allowance: number;
  plan: string;
  periodEnd: string;
};

const REASON_LABELS: Record<string, string> = {
  period_refill: 'Monthly refill',
  chat: 'Chat',
  suggestion: 'Suggestion',
  inline_suggestion: 'Inline suggestion',
  user_style: 'Style analysis',
};

const formatReason = (reason: string, metadata: Record<string, unknown> | null): string => {
  const label = REASON_LABELS[reason] ?? reason.replace(/_/g, ' ');
  const modelId = metadata?.modelId;
  if (typeof modelId === 'string' && modelId.length > 0) {
    return `${label} · ${modelId.replace(/^chat-model-/, '')}`;
  }
  return label;
};

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

interface CreditTransactionsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade?: () => void;
}

export function CreditTransactionsModal({
  isOpen,
  onOpenChange,
  onUpgrade,
}: CreditTransactionsModalProps) {
  const { data: creditsData } = useSWR<CreditsResponse>(
    isOpen ? '/api/user/credits' : null,
    fetcher
  );
  const { data, isLoading, error } = useSWR<TransactionsResponse>(
    isOpen ? '/api/user/credit-transactions' : null,
    fetcher
  );

  const isLow =
    creditsData &&
    creditsData.balance <= Math.max(5, Math.floor(creditsData.allowance * 0.1));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Coins className="size-5" />
            Credit usage
          </DialogTitle>
          {creditsData ? (
            <DialogDescription asChild>
              <div className="text-left space-y-1 pt-1">
                <p className="text-sm text-foreground font-medium tabular-nums">
                  {creditsData.balance}
                  <span className="text-muted-foreground font-normal">
                    {' '}
                    / {creditsData.allowance} credits remaining
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {creditsData.plan} plan · resets{' '}
                  {new Date(creditsData.periodEnd).toLocaleDateString()}
                </p>
              </div>
            </DialogDescription>
          ) : (
            <DialogDescription>Your recent credit activity</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-2 py-2 min-h-[200px]">
          {isLoading ? (
            <div
              className="flex items-center justify-center py-12 text-muted-foreground"
              aria-label="Loading transactions"
            >
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-muted-foreground text-center py-12 px-4">
              Could not load transactions. Please try again.
            </p>
          ) : !data?.transactions.length ? (
            <p className="text-sm text-muted-foreground text-center py-12 px-4">
              No credit activity yet.
            </p>
          ) : (
            <ul className="space-y-1" aria-label="Credit transactions">
              {data.transactions.map((tx) => {
                const isCredit = tx.amount > 0;
                return (
                  <li
                    key={tx.id}
                    className="flex items-start gap-3 rounded-md px-4 py-3 hover:bg-muted/50 transition-colors"
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
                        {formatReason(tx.reason, tx.metadata)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.createdAt)} · balance {tx.balanceAfter}
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
          )}
        </div>

        {isLow && onUpgrade ? (
          <div className="border-t px-6 py-4">
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                onUpgrade();
              }}
            >
              Get more credits
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
