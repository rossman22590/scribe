import 'server-only';

import { db } from '@saru/db';
import * as schema from '@saru/db';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { CREDIT_ALLOWANCES, type CreditPlan } from './config';
import { normalizePlan } from './plans';
import { getActiveSubscriptionByUserId } from '@/lib/db/queries';

const startOfCalendarMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const endOfCalendarMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth() + 1, 1);

/**
 * Never let a period end land in the past.
 *
 * A stale subscription row (an expired Stripe period, a cancelled plan) used to
 * be written straight back as the new periodEnd. Because the reset branch fires
 * whenever periodEnd <= now, that rewrote an already-expired date on every call
 * and re-granted the full allowance each time — deductCredits calls
 * ensureUserCredits first, so balances reset before every charge and the
 * allowance was effectively unlimited. Fall back to the end of the current
 * calendar month whenever the candidate date is not in the future.
 */
const nextPeriodEnd = (candidate: Date | null | undefined, now: Date): Date =>
  candidate && candidate > now ? candidate : endOfCalendarMonth(now);

export type CreditBalanceInfo = {
  balance: number;
  allowance: number;
  plan: CreditPlan;
  periodEnd: Date;
};

/**
 * Plan applied to a user with no active subscription row.
 *
 * Credits are always metered and deducted, with or without Stripe — this only
 * decides which allowance a subscription-less user is metered against. Defaults
 * to 'free'; set CREDITS_DEFAULT_PLAN to grant a larger allowance (e.g. while
 * Stripe checkout is not yet live) without disabling metering.
 */
const DEFAULT_PLAN_WITHOUT_SUBSCRIPTION: CreditPlan = normalizePlan(
  process.env.CREDITS_DEFAULT_PLAN ?? 'free'
);

/**
 * Always resolved from the subscription row, regardless of whether Stripe
 * billing is enforced. Previously this returned 'ultra' for every user when
 * STRIPE_ENABLED was unset, so paid tiers were ignored and everyone drew
 * against the 3000-credit ultra allowance.
 */
const resolveEffectivePlan = async (userId: string): Promise<CreditPlan> => {
  const subscription = await getActiveSubscriptionByUserId({ userId });
  if (!subscription) return DEFAULT_PLAN_WITHOUT_SUBSCRIPTION;
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
    const periodEnd = nextPeriodEnd(subscriptionPeriodEnd, now);

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
  const end = nextPeriodEnd(periodEnd, now);

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
  | { ok: false; balance: number; required: number; captured: number };

export const deductCredits = async ({
  userId,
  cost,
  reason,
  metadata,
  allowPartial = false,
}: {
  userId: string;
  cost: number;
  reason: string;
  metadata?: Record<string, unknown>;
  /**
   * Post-hoc billing only. When the balance cannot cover `cost`, take whatever
   * is left instead of charging nothing. The API call has already been paid for
   * upstream, so refusing the charge outright means serving it for free — and
   * because the balance is left untouched, the user stays above the pre-flight
   * minimum and can repeat it indefinitely. Draining to zero bounds the loss to
   * a single request and locks the account out until its next refill.
   */
  allowPartial?: boolean;
}): Promise<DeductCreditsResult> => {
  if (!Number.isInteger(cost) || cost <= 0) {
    throw new Error('Credit cost must be a positive whole number');
  }

  await ensureUserCredits(userId);

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(schema.userCredits)
      .set({
        balance: sql`${schema.userCredits.balance} - ${cost}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.userCredits.userId, userId),
          gte(schema.userCredits.balance, cost),
        ),
      )
      .returning({ balance: schema.userCredits.balance });

    if (!updated) {
      const [current] = await tx
        .select({ balance: schema.userCredits.balance })
        .from(schema.userCredits)
        .where(eq(schema.userCredits.userId, userId))
        .limit(1);
      const available = current?.balance ?? 0;

      if (!allowPartial || available <= 0) {
        return { ok: false, balance: available, required: cost, captured: 0 };
      }

      // Take what is there. Guarding on the balance we just read keeps this
      // safe against a concurrent deduction: if it moved, we capture nothing
      // rather than over-charging.
      const [drained] = await tx
        .update(schema.userCredits)
        .set({ balance: 0, updatedAt: new Date() })
        .where(
          and(
            eq(schema.userCredits.userId, userId),
            eq(schema.userCredits.balance, available),
          ),
        )
        .returning({ balance: schema.userCredits.balance });

      if (!drained) {
        return { ok: false, balance: available, required: cost, captured: 0 };
      }

      await tx.insert(schema.creditTransactions).values({
        userId,
        amount: -available,
        balanceAfter: 0,
        reason,
        metadata: {
          ...(metadata ?? {}),
          partialCapture: true,
          requestedCost: cost,
          shortfall: cost - available,
        },
      });

      return { ok: false, balance: 0, required: cost, captured: available };
    }

    await tx.insert(schema.creditTransactions).values({
      userId,
      amount: -cost,
      balanceAfter: updated.balance,
      reason,
      metadata: metadata ?? null,
    });

    return { ok: true, balance: updated.balance };
  });
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
