import 'server-only';

import { db } from '@saru/db';
import * as schema from '@saru/db';
import { desc, eq } from 'drizzle-orm';
import {
  CREDIT_ALLOWANCES,
  type CreditPlan,
  isStripeBillingEnforced,
} from './config';
import { normalizePlan } from './plans';
import { getActiveSubscriptionByUserId } from '@/lib/db/queries';

const startOfCalendarMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const endOfCalendarMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth() + 1, 1);

export type CreditBalanceInfo = {
  balance: number;
  allowance: number;
  plan: CreditPlan;
  periodEnd: Date;
};

const resolveEffectivePlan = async (userId: string): Promise<CreditPlan> => {
  if (!isStripeBillingEnforced()) {
    return 'ultra';
  }
  const subscription = await getActiveSubscriptionByUserId({ userId });
  if (!subscription) return 'free';
  return normalizePlan(subscription.plan);
};

export const ensureUserCredits = async (userId: string): Promise<CreditBalanceInfo> => {
  const now = new Date();
  const effectivePlan = await resolveEffectivePlan(userId);
  const allowance = CREDIT_ALLOWANCES[effectivePlan];

  const existing = await db
    .select()
    .from(schema.userCredits)
    .where(eq(schema.userCredits.userId, userId))
    .limit(1);

  if (existing.length === 0) {
    const periodStart = startOfCalendarMonth(now);
    const periodEnd = endOfCalendarMonth(now);
    await db.insert(schema.userCredits).values({
      userId,
      balance: allowance,
      periodStart,
      periodEnd,
      planSnapshot: effectivePlan,
    });
    return { balance: allowance, allowance, plan: effectivePlan, periodEnd };
  }

  const row = existing[0];
  const subscription = await getActiveSubscriptionByUserId({ userId });
  const subscriptionPeriodEnd =
    subscription?.periodEnd && effectivePlan !== 'free'
      ? subscription.periodEnd
      : null;

  const periodEnded = row.periodEnd <= now;
  const planChanged = row.planSnapshot !== effectivePlan;

  if (periodEnded || planChanged) {
    const periodStart =
      effectivePlan === 'free' ? startOfCalendarMonth(now) : (subscription?.periodStart ?? row.periodStart);
    const periodEnd =
      subscriptionPeriodEnd ??
      (effectivePlan === 'free' ? endOfCalendarMonth(now) : endOfCalendarMonth(now));

    await db
      .update(schema.userCredits)
      .set({
        balance: allowance,
        periodStart,
        periodEnd,
        planSnapshot: effectivePlan,
        updatedAt: now,
      })
      .where(eq(schema.userCredits.userId, userId));

    return { balance: allowance, allowance, plan: effectivePlan, periodEnd };
  }

  return {
    balance: row.balance,
    allowance,
    plan: effectivePlan,
    periodEnd: row.periodEnd,
  };
};

export const getCreditBalance = async (userId: string): Promise<CreditBalanceInfo> =>
  ensureUserCredits(userId);

export const refillCreditsForPlan = async (
  userId: string,
  plan: CreditPlan,
  periodEnd?: Date
): Promise<CreditBalanceInfo> => {
  const now = new Date();
  const allowance = CREDIT_ALLOWANCES[plan];
  const periodStart = startOfCalendarMonth(now);
  const end =
    periodEnd ??
    (plan === 'free' ? endOfCalendarMonth(now) : endOfCalendarMonth(now));

  const existing = await db
    .select()
    .from(schema.userCredits)
    .where(eq(schema.userCredits.userId, userId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(schema.userCredits).values({
      userId,
      balance: allowance,
      periodStart,
      periodEnd: end,
      planSnapshot: plan,
    });
  } else {
    await db
      .update(schema.userCredits)
      .set({
        balance: allowance,
        periodStart,
        periodEnd: end,
        planSnapshot: plan,
        updatedAt: now,
      })
      .where(eq(schema.userCredits.userId, userId));
  }

  await db.insert(schema.creditTransactions).values({
    userId,
    amount: allowance,
    balanceAfter: allowance,
    reason: 'period_refill',
    metadata: { plan },
  });

  return { balance: allowance, allowance, plan, periodEnd: end };
};

export type DeductCreditsResult =
  | { ok: true; balance: number }
  | { ok: false; balance: number; required: number };

export const deductCredits = async ({
  userId,
  cost,
  reason,
  metadata,
}: {
  userId: string;
  cost: number;
  reason: string;
  metadata?: Record<string, unknown>;
}): Promise<DeductCreditsResult> => {
  const info = await ensureUserCredits(userId);

  if (info.balance < cost) {
    return { ok: false, balance: info.balance, required: cost };
  }

  const newBalance = info.balance - cost;

  await db.transaction(async (tx) => {
    await tx
      .update(schema.userCredits)
      .set({ balance: newBalance, updatedAt: new Date() })
      .where(eq(schema.userCredits.userId, userId));

    await tx.insert(schema.creditTransactions).values({
      userId,
      amount: -cost,
      balanceAfter: newBalance,
      reason,
      metadata: metadata ?? null,
    });
  });

  return { ok: true, balance: newBalance };
};

export const syncCreditsFromSubscription = async (userId: string): Promise<void> => {
  const plan = await resolveEffectivePlan(userId);
  const subscription = await getActiveSubscriptionByUserId({ userId });
  const periodEnd = subscription?.periodEnd ?? endOfCalendarMonth(new Date());
  await refillCreditsForPlan(userId, plan, periodEnd);
};

export const getCreditTransactions = async (
  userId: string,
  limit = 50
): Promise<schema.CreditTransaction[]> =>
  db
    .select()
    .from(schema.creditTransactions)
    .where(eq(schema.creditTransactions.userId, userId))
    .orderBy(desc(schema.creditTransactions.createdAt))
    .limit(limit);
