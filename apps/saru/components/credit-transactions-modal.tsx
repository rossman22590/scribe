'use client';

import useSWR from 'swr';
import { Coins } from 'lucide-react';
import { fetcher } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CreditTransactionsList,
  type CreditTransactionItem,
} from '@/components/credit-transactions-list';

type TransactionsResponse = {
  transactions: CreditTransactionItem[];
};

type CreditsResponse = {
  balance: number;
  allowance: number;
  plan: string;
  periodEnd: string;
};

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
          <CreditTransactionsList
            transactions={data?.transactions}
            isLoading={isLoading}
            error={Boolean(error)}
          />
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
