import 'server-only';

import type { LanguageModelUsage } from 'ai';
import { deductCredits, ensureUserCredits, type DeductCreditsResult } from './service';
import {
  creditsFromTokenUsage,
  getEffectiveMinCredits,
} from './token-pricing';
import { openRouterCostUsd, CREDIT_COST_MULTIPLIER } from './openrouter-pricing';
import { insufficientCreditsResponse } from './require-credits';
import { NextResponse } from 'next/server';

export const assertMinimumCredits = async (
  userId: string,
  minimum: number = getEffectiveMinCredits()
): Promise<NextResponse | null> => {
  const info = await ensureUserCredits(userId);
  if (info.balance < minimum) {
    return insufficientCreditsResponse(info.balance, minimum);
  }
  return null;
};

export const deductCreditsFromUsage = async ({
  userId,
  modelId,
  usage,
  reason,
  extraMetadata,
}: {
  userId: string;
  modelId: string;
  usage: LanguageModelUsage | undefined;
  reason: string;
  extraMetadata?: Record<string, unknown>;
}): Promise<DeductCreditsResult> => {
  const costUsd = openRouterCostUsd(modelId, usage);
  const cost = creditsFromTokenUsage(modelId, usage);

  const outputTokens = usage?.outputTokens ?? 0;
  const reasoningTokens = usage?.reasoningTokens ?? 0;

  // Reasoning tokens are billed as output tokens and are reported as a
  // breakdown *within* completion_tokens, not in addition to it — so pricing
  // outputTokens already charges for reasoning. That invariant is what makes
  // the $30/M reasoning tier safe to bill on outputTokens alone. If an upstream
  // ever reports them additively this comparison breaks first, and every
  // reasoning call on that model has been undercharged.
  if (reasoningTokens > outputTokens) {
    console.error(
      `[credits] ${modelId}: reasoningTokens (${reasoningTokens}) exceeds outputTokens ` +
        `(${outputTokens}). Reasoning is being reported in addition to completion ` +
        `tokens, not within them — billing on outputTokens undercharges this model.`
    );
  }

  return deductCredits({
    userId,
    cost,
    reason,
    // The model call already happened and is already billable upstream, so a
    // shortfall must still take whatever balance remains rather than serving
    // it free. See deductCredits({ allowPartial }).
    allowPartial: true,
    metadata: {
      modelId,
      inputTokens: usage?.inputTokens ?? 0,
      outputTokens,
      reasoningTokens,
      totalTokens: usage?.totalTokens ?? 0,
      costUsd,
      creditCostMultiplier: CREDIT_COST_MULTIPLIER,
      creditsCharged: cost,
      ...extraMetadata,
    },
  });
};
