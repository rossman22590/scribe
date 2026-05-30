import type { CreditPlan } from './config';

export type SubscriptionPlan = CreditPlan | null;

const PAID_PLANS = new Set(['premium', 'ultra', 'saru']);

export const normalizePlan = (plan: string | null | undefined): CreditPlan => {
  if (!plan) return 'free';
  const lower = plan.toLowerCase();
  if (lower === 'saru' || lower === 'pro') return 'premium';
  if (lower === 'premium' || lower === 'ultra') return lower as CreditPlan;
  return 'free';
};

export const isPaidPlan = (plan: string | null | undefined): boolean => {
  if (!plan) return false;
  return PAID_PLANS.has(plan.toLowerCase());
};

export const canPublish = (plan: SubscriptionPlan): boolean => {
  if (!plan) return false;
  return plan === 'premium' || plan === 'ultra';
};

export const canUseModel = (
  modelId: string,
  plan: SubscriptionPlan,
  proOnly?: boolean
): boolean => {
  if (!proOnly) return true;
  if (plan === 'ultra') return true;
  if (plan === 'premium' && modelId !== 'chat-model-reasoning') return true;
  return false;
};
