import 'server-only';

import { getActiveSubscriptionByUserId } from '@/lib/db/queries';
import { normalizePlan, type SubscriptionPlan } from '@/lib/credits/plans';
import { isStripeBillingEnforced } from '@/lib/credits/config';

export type SubscriptionStatusResponse = {
  hasActiveSubscription: boolean;
  plan: 'free' | 'premium' | 'ultra';
  status: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
};

export const getSubscriptionStatusForUser = async (
  userId: string
): Promise<SubscriptionStatusResponse> => {
  if (!isStripeBillingEnforced()) {
    return {
      hasActiveSubscription: true,
      plan: 'ultra',
      status: 'active',
      periodEnd: null,
      cancelAtPeriodEnd: false,
      trialEnd: null,
    };
  }

  const subscription = await getActiveSubscriptionByUserId({ userId });

  if (!subscription) {
    return {
      hasActiveSubscription: false,
      plan: 'free',
      status: null,
      periodEnd: null,
      cancelAtPeriodEnd: false,
      trialEnd: null,
    };
  }

  const plan = normalizePlan(subscription.plan);

  return {
    hasActiveSubscription: true,
    plan,
    status: subscription.status,
    periodEnd: subscription.periodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
    trialEnd: subscription.trialEnd?.toISOString() ?? null,
  };
};

export const getUserSubscriptionPlan = async (
  userId: string
): Promise<SubscriptionPlan> => {
  if (!isStripeBillingEnforced()) return 'ultra';
  const subscription = await getActiveSubscriptionByUserId({ userId });
  if (!subscription) return null;
  return normalizePlan(subscription.plan);
};
