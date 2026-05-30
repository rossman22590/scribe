'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/components/toast';
import { Check, Loader2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetcher } from '@/lib/utils';
import { CREDIT_ALLOWANCES } from '@/lib/credits/config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PaywallProps {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  required?: boolean;
  highlightPlan?: 'premium' | 'ultra';
}

type BillingInterval = 'monthly' | 'annual';

type SubscriptionStatus = {
  hasActiveSubscription: boolean;
  plan: 'free' | 'premium' | 'ultra';
  status: string | null;
};

const tierPlans = [
  {
    id: 'premium' as const,
    name: 'Premium',
    monthlyPrice: '$15',
    annualPrice: '$10.50',
    annualSubLabel: 'Billed annually at $126',
    monthlyBilling: '/ month',
    annualBilling: '/ month*',
    annualDiscount: 30,
    features: [
      `${CREDIT_ALLOWANCES.premium.toLocaleString()} AI credits per month`,
      'Publish documents publicly',
      'AI trained on the way you write',
      'Large model access',
    ],
  },
  {
    id: 'ultra' as const,
    name: 'Ultra',
    monthlyPrice: '$29',
    annualPrice: '$20',
    annualSubLabel: 'Billed annually at $240',
    monthlyBilling: '/ month',
    annualBilling: '/ month*',
    annualDiscount: 31,
    features: [
      `${CREDIT_ALLOWANCES.ultra.toLocaleString()} AI credits per month`,
      'Everything in Premium',
      'Reasoning model access',
      'Priority AI usage',
    ],
    highlighted: true,
  },
];

export function Paywall({
  isOpen,
  onOpenChange,
  required = false,
  highlightPlan,
}: PaywallProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('annual');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const { data: subscriptionData } = useSWR<SubscriptionStatus>(
    isOpen ? '/api/user/subscription-status' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const currentPlan = subscriptionData?.plan ?? 'free';

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut(
        {},
        {
          onSuccess: () => {
            setIsSigningOut(false);
            router.push('/login');
            router.refresh();
            toast({ type: 'success', description: 'Signed out successfully.' });
          },
          onError: (ctx) => {
            setIsSigningOut(false);
            toast({
              type: 'error',
              description: ctx.error.message || 'Failed to sign out.',
            });
          },
        }
      );
    } catch {
      setIsSigningOut(false);
      toast({ type: 'error', description: 'An unexpected error occurred during sign out.' });
    }
  };

  const handleUpgrade = async (planName: 'premium' | 'ultra') => {
    const key = `${planName}-${billingInterval}`;
    setIsLoading(true);
    setLoadingKey(key);

    try {
      if (!('subscription' in authClient)) {
        toast({
          type: 'error',
          description: 'Subscription functionality is unavailable. Please contact support.',
        });
        return;
      }

      const currentUrl = window.location.href;
      const { error } = await (authClient as { subscription: { upgrade: (opts: object) => Promise<{ error?: { message?: string } }> } }).subscription.upgrade({
        plan: planName,
        annual: billingInterval === 'annual',
        successUrl: currentUrl,
        cancelUrl: currentUrl,
      });

      if (error) {
        toast({
          type: 'error',
          description: error.message || 'Failed to initiate checkout. Please try again.',
        });
      }
    } catch {
      toast({
        type: 'error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
      setLoadingKey(null);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (required && !open) return;
    onOpenChange?.(open);
  };

  const getCtaLabel = (tierId: 'premium' | 'ultra') => {
    if (currentPlan === 'ultra') return 'Current plan';
    if (currentPlan === 'premium' && tierId === 'premium') return 'Current plan';
    if (currentPlan === 'premium' && tierId === 'ultra') return 'Upgrade to Ultra';
    return `Subscribe to ${tierPlans.find((t) => t.id === tierId)?.name}`;
  };

  const isCtaDisabled = (tierId: 'premium' | 'ultra') => {
    if (currentPlan === 'ultra') return true;
    if (currentPlan === 'premium' && tierId === 'premium') return true;
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[425px] md:max-w-3xl lg:max-w-5xl p-0 overflow-hidden"
        onInteractOutside={(event) => {
          if (required) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (required) event.preventDefault();
        }}
        hideCloseButton={required}
      >
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr]">
          <div className="relative h-40 md:h-full overflow-hidden">
            <Image
              src="/images/sarus.png"
              alt="Scribe"
              fill
              style={{ objectFit: 'cover' }}
              className="filter grayscale contrast-110 brightness-90"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent md:bg-gradient-to-r md:from-black/40 md:via-transparent" />
            <div className="absolute top-6 left-6 z-10">
              <h1 className="text-base font-normal text-white/80">Scribe</h1>
            </div>
          </div>

          <div className="p-6 md:p-8 flex flex-col relative">
            {required && (
              <div className="absolute top-4 right-4 z-20">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-foreground"
                      aria-label="Account options"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={handleSignOut}
                      disabled={isSigningOut}
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                    >
                      {isSigningOut ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : null}
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <DialogHeader className="mb-4 text-left">
              <DialogTitle className="text-xl md:text-2xl font-semibold">
                Choose your plan
              </DialogTitle>
              <DialogDescription className="text-sm">
                Unlock more AI credits, publishing, and advanced models. Usage costs
                credits based on the model and tokens used. Free includes{' '}
                {CREDIT_ALLOWANCES.free.toLocaleString()} credits per month.
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg w-fit">
              <button
                type="button"
                onClick={() => setBillingInterval('monthly')}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors',
                  billingInterval === 'monthly'
                    ? 'bg-background shadow-sm font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval('annual')}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors',
                  billingInterval === 'annual'
                    ? 'bg-background shadow-sm font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Annual
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
              {tierPlans.map((tier) => {
                const isAnnual = billingInterval === 'annual';
                const price = isAnnual ? tier.annualPrice : tier.monthlyPrice;
                const billing = isAnnual ? tier.annualBilling : tier.monthlyBilling;
                const key = `${tier.id}-${billingInterval}`;
                const isHighlighted =
                  tier.highlighted || highlightPlan === tier.id;

                return (
                  <div
                    key={tier.id}
                    className={cn(
                      'border rounded-lg p-5 flex flex-col transition-colors',
                      isHighlighted && 'border-primary bg-muted/30 ring-1 ring-primary/20'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-lg">{tier.name}</h4>
                      {isAnnual && (
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          Save {tier.annualDiscount}%
                        </span>
                      )}
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {price}
                      <span className="text-base font-normal text-muted-foreground">
                        {billing}
                      </span>
                    </p>
                    {isAnnual && tier.annualSubLabel && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {tier.annualSubLabel}
                      </p>
                    )}
                    <ul className="mt-4 space-y-2 flex-grow">
                      {tier.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => handleUpgrade(tier.id)}
                      disabled={isLoading || isCtaDisabled(tier.id)}
                      className="w-full mt-6"
                      size="lg"
                      variant={isHighlighted ? 'default' : 'outline'}
                    >
                      {isLoading && loadingKey === key ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        getCtaLabel(tier.id)
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="mt-6 pt-4 border-t flex flex-col sm:flex-row items-center gap-2 sm:gap-0">
              <p className="text-xs text-muted-foreground flex-shrink-0">
                Publish requires Premium or Ultra.{' '}
                <Link href="#" className="text-blue-500 underline">
                  Learn more
                </Link>
              </p>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
