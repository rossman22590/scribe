import { planAllowanceCredits, PLAN_MONTHLY_USD } from './openrouter-pricing';

export type CreditPlan = 'free' | 'premium' | 'ultra';

/**
 * Monthly credits = OpenRouter API budget at 1 credit = $0.01.
 * Premium: $10 → 1000 credits. Ultra: $30 → 3000 credits. Free: $1 → 100 credits.
 */
export const CREDIT_ALLOWANCES: Record<CreditPlan, number> = {
  free: planAllowanceCredits('free'),
  premium: planAllowanceCredits('premium'),
  ultra: planAllowanceCredits('ultra'),
};

export const CREDIT_ALLOWANCE_USD: Record<CreditPlan, number> = {
  free: PLAN_MONTHLY_USD.free,
  premium: PLAN_MONTHLY_USD.premium,
  ultra: PLAN_MONTHLY_USD.ultra,
};

export const isStripeEnabled = (): boolean =>
  process.env.STRIPE_ENABLED === 'true' ||
  process.env.NEXT_PUBLIC_STRIPE_ENABLED === 'true';

export const isStripeBillingEnforced = (): boolean =>
  process.env.STRIPE_ENABLED === 'true';
