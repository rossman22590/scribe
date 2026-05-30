'use client';
import { ChevronUp, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { useTheme } from 'next-themes';
import { toast } from '@/components/toast';
import type { ClientUser as User } from '@/lib/auth-client';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Paywall } from '@/components/paywall';
import { CreditsBadge } from '@/components/credits-badge';
import { CreditTransactionsModal } from '@/components/credit-transactions-modal';

type SubscriptionStatus = {
  hasActiveSubscription: boolean;
  plan: 'free' | 'premium' | 'ultra';
  status: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
};

function formatDate(dateString: string | Date | undefined | null): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Invalid Date';
  }
}

function formatPlanName(planName: string | undefined | null): string {
  if (!planName || planName === 'free') return 'Free';
  return planName.charAt(0).toUpperCase() + planName.slice(1);
}

export function SidebarUserNav({ user }: { user: User | null }) {
  const { setTheme, theme } = useTheme();
  const router = useRouter();

  const [isSignOutLoading, setIsSignOutLoading] = useState(false);
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);

  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED === 'true';

  useEffect(() => {
    if (!user) {
      setIsSubscriptionLoading(false);
      return;
    }

    let isMounted = true;
    setIsSubscriptionLoading(true);
    setSubscriptionError(null);

    const fetchSubscription = async () => {
      try {
        const res = await fetch('/api/user/subscription-status');
        const result: SubscriptionStatus = await res.json();
        if (!isMounted) return;
        if (!res.ok) {
          throw new Error('Failed to load subscription info.');
        }
        setSubscription(result);
      } catch (err: unknown) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Could not load subscription info.';
        console.error('Error fetching subscription:', err);
        setSubscriptionError(message);
        setSubscription(null);
      } finally {
        if (isMounted) setIsSubscriptionLoading(false);
      }
    };

    fetchSubscription();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSignOut = async () => {
    setIsSignOutLoading(true);
    await authClient.signOut(
      {},
      {
        onRequest: () => {
          setIsSignOutLoading(true);
        },
        onSuccess: () => {
          router.push('/');
          router.refresh();
        },
        onError: (ctx) => {
          setIsSignOutLoading(false);
          console.error('Error signing out:', ctx.error);
          toast({
            type: 'error',
            description: ctx.error.message || 'Failed to sign out.',
          });
        },
      }
    );
  };

  const handleManageBilling = async () => {
    if (isBillingLoading || isSubscriptionLoading || subscriptionError || !subscription?.hasActiveSubscription) {
      return;
    }
    setIsBillingLoading(true);
    try {
      if (!('subscription' in authClient)) {
        toast({
          type: 'error',
          description: 'Billing management is currently unavailable. Please contact support.',
        });
        return;
      }

      const { error: cancelError } = await (
        authClient as {
          subscription: { cancel: (opts: object) => Promise<{ error?: { message?: string } }> };
        }
      ).subscription.cancel({
        returnUrl: window.location.href,
      });
      if (cancelError) {
        throw new Error(cancelError.message || 'Failed to redirect to billing portal.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not open billing portal.';
      console.error('handleManageBilling error:', err);
      toast({ type: 'error', description: message });
      setIsBillingLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  let statusText = 'No active plan';
  let planName = 'Free';
  let ctaText = 'Subscribe';
  let ctaAction = () => setIsPaywallOpen(true);
  let ctaLoading = isSubscriptionLoading;

  if (isSubscriptionLoading) {
    statusText = 'Loading...';
    planName = 'Checking';
  } else if (subscriptionError) {
    statusText = 'Error loading status';
    planName = 'Error';
  } else if (subscription) {
    planName = formatPlanName(subscription.plan);
    const now = new Date();

    if (subscription.status === 'trialing') {
      const trialEndDate = subscription.trialEnd || subscription.periodEnd;
      const ends = new Date(trialEndDate || '').getTime();
      if (ends > now.getTime()) {
        statusText = `Trial ends ${formatDate(trialEndDate)}`;
        ctaText = 'Upgrade';
        ctaAction = () => setIsPaywallOpen(true);
      } else {
        statusText = `Trial ended ${formatDate(trialEndDate)}`;
        ctaText = 'Subscribe';
        ctaAction = () => setIsPaywallOpen(true);
      }
    } else if (subscription.hasActiveSubscription) {
      if (subscription.cancelAtPeriodEnd) {
        statusText = `Cancels ${formatDate(subscription.periodEnd)}`;
      } else {
        statusText = `Renews ${formatDate(subscription.periodEnd)}`;
      }
      if (subscription.plan === 'premium') {
        ctaText = 'Upgrade to Ultra';
        ctaAction = () => setIsPaywallOpen(true);
        ctaLoading = isSubscriptionLoading;
      } else {
        ctaText = 'Manage';
        ctaAction = handleManageBilling;
        ctaLoading = isBillingLoading;
      }
    } else {
      ctaText = 'Subscribe';
      ctaAction = () => setIsPaywallOpen(true);
    }
  }

  const isLoading = isSignOutLoading || isBillingLoading || isSubscriptionLoading;

  return (
    <>
      <div className="px-2 pb-2">
        <CreditsBadge
          onClick={() => setIsTransactionsOpen(true)}
          className="w-full justify-center"
        />
      </div>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isLoading}>
              <SidebarMenuButton className="border border-r data-[state=open]:border-border text-accent-foreground data-[state=open]:text-sidebar-accent-foreground h-10">
                <span className="truncate">{user.email ?? 'User'}</span>
                <ChevronUp className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
              {(isStripeEnabled || subscription?.hasActiveSubscription) && (
                <>
                  <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Subscription
                  </DropdownMenuLabel>
                  <div className="px-2 py-1.5 text-sm space-y-1">
                    <p className="font-medium">{planName}</p>
                    <p className="text-xs text-muted-foreground">{statusText}</p>
                    <button
                      type="button"
                      onClick={ctaAction}
                      disabled={ctaLoading}
                      className="mt-2 text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {ctaLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin inline-block mr-1 text-muted-foreground" />
                      ) : null}
                      {ctaText}
                    </button>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                disabled={isLoading}
              >
                {`Toggle ${theme === 'light' ? 'dark' : 'light'} mode`}
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={handleSignOut}
                disabled={isLoading}
              >
                {isSignOutLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing out...
                  </>
                ) : (
                  'Sign out'
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <CreditTransactionsModal
        isOpen={isTransactionsOpen}
        onOpenChange={setIsTransactionsOpen}
        onUpgrade={() => setIsPaywallOpen(true)}
      />
      <Paywall isOpen={isPaywallOpen} onOpenChange={setIsPaywallOpen} />
    </>
  );
}
