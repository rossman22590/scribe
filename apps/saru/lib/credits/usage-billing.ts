import 'server-only';

import type { LanguageModelUsage } from 'ai';
import { deductCredits, ensureUserCredits, type DeductCreditsResult } from './service';
import { creditsFromTokenUsage, MIN_CREDITS_PER_REQUEST } from './token-pricing';
import { openRouterCostUsd } from './openrouter-pricing';
import { insufficientCreditsResponse } from './require-credits';
import { NextResponse } from 'next/server';

export const assertMinimumCredits = async (
  userId: string,
  minimum: number = MIN_CREDITS_PER_REQUEST
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

  return deductCredits({
    userId,
    cost,
    reason,
    metadata: {
      modelId,
      inputTokens: usage?.inputTokens ?? 0,
      outputTokens: usage?.outputTokens ?? 0,
      totalTokens: usage?.totalTokens ?? 0,
      costUsd,
      creditsCharged: cost,
      ...extraMetadata,
    },
  });
};
