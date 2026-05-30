'use client';

import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { chatModels } from '@/lib/ai/models';
import { cn } from '@/lib/utils';
import {
  formatUsageCreditsLabel,
  MIN_CREDITS_PER_REQUEST,
} from '@/lib/credits/token-pricing';
import { canUseModel } from '@/lib/credits/plans';

import { CheckCircleFillIcon, ChevronDownIcon } from '../icons';
import { Paywall } from '@/components/paywall';

type SubscriptionStatus = {
  hasActiveSubscription: boolean;
  plan: 'free' | 'premium' | 'ultra';
};

type CreditsResponse = {
  balance: number;
  allowance: number;
};

export function ModelSelector({
  selectedModelId,
  className,
  minimal = false,
  onModelChange,
}: {
  selectedModelId: string;
  className?: string;
  minimal?: boolean;
  onModelChange: (newModelId: string) => void;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [isPaywallOpen, setPaywallOpen] = useState(false);

  const { data: subscriptionData, isLoading: isSubscriptionLoading } = useSWR<SubscriptionStatus>(
    '/api/user/subscription-status',
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: creditsData } = useSWR<CreditsResponse>('/api/user/credits', fetcher, {
    revalidateOnFocus: true,
  });

  const plan = subscriptionData?.plan ?? 'free';
  const balance = creditsData?.balance ?? 0;

  const selectedChatModel = useMemo(
    () => chatModels.find((chatModel) => chatModel.id === selectedModelId),
    [selectedModelId]
  );

  if (isSubscriptionLoading) {
    return (
      <Button
        data-testid="model-selector"
        variant="outline"
        className={cn('md:px-2 md:h-[34px]', className)}
        disabled
      >
        Loading...
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          asChild
          className={cn(
            'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
            className
          )}
        >
          <Button
            data-testid="model-selector"
            variant="outline"
            className="flex items-center gap-1 md:px-2 md:h-[34px]"
          >
            {minimal ? selectedModelId.split('-')[0] : selectedChatModel?.name}
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          {chatModels.map((chatModel) => {
            const { id, proOnly } = chatModel;
            const isPlanLocked = proOnly === true && !canUseModel(id, plan, true);
            const isCreditLocked = balance < MIN_CREDITS_PER_REQUEST;
            const isLocked = isPlanLocked || isCreditLocked;

            return (
              <DropdownMenuItem
                data-testid={`model-selector-item-${id}`}
                key={id}
                onSelect={() => {
                  if (isLocked) {
                    setPaywallOpen(true);
                    return;
                  }
                  setOpen(false);
                  onModelChange(id);
                  mutate('/api/user/credits');
                }}
                data-active={id === selectedModelId}
                className="group relative flex w-full items-center gap-2 px-3 py-2 cursor-pointer"
              >
                <div className="flex flex-col gap-1 items-start flex-1">
                  <div className="flex items-center gap-2">
                    <span>{chatModel.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatUsageCreditsLabel(id)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {chatModel.description}
                  </div>
                  {isPlanLocked && (
                    <div className="text-xs text-amber-600">Requires Premium or Ultra</div>
                  )}
                  {isCreditLocked && !isPlanLocked && (
                    <div className="text-xs text-amber-600">Not enough credits</div>
                  )}
                </div>
                {!isLocked && id === selectedModelId && (
                  <div className="text-foreground dark:text-foreground">
                    <CheckCircleFillIcon />
                  </div>
                )}
                {isLocked && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPaywallOpen(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {isPlanLocked ? 'Upgrade' : 'Get credits'}
                  </Button>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <Paywall
        isOpen={isPaywallOpen}
        onOpenChange={setPaywallOpen}
        required={false}
        highlightPlan={plan === 'premium' ? 'ultra' : 'premium'}
      />
    </>
  );
}
