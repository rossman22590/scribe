import type { LanguageModelUsage } from 'ai';
import {
  CREDIT_USD_VALUE,
  CREDIT_COST_MULTIPLIER,
  openRouterCostUsd,
  getOpenRouterPricing,
} from './openrouter-pricing';

const rawMinCredits = Number(process.env.CREDIT_MIN_PER_REQUEST ?? 1);

export const MIN_CREDITS_PER_REQUEST =
  Number.isFinite(rawMinCredits) && rawMinCredits >= 0
    ? Math.ceil(rawMinCredits)
    : 1;

/** Minimum credits per request after global multiplier */
export const getEffectiveMinCredits = (): number =>
  Math.max(
    MIN_CREDITS_PER_REQUEST,
    Math.ceil(MIN_CREDITS_PER_REQUEST * CREDIT_COST_MULTIPLIER)
  );

/** Apply global markup; enforces effective minimum */
export const applyCreditCostMultiplier = (baseCredits: number): number =>
  Math.max(
    getEffectiveMinCredits(),
    Math.ceil(baseCredits * CREDIT_COST_MULTIPLIER)
  );

export const creditsFromTokenUsage = (
  modelId: string,
  usage: LanguageModelUsage | undefined
): number => {
  const costUsd = openRouterCostUsd(modelId, usage);

  // Non-finite guards matter as much as the <= 0 case: a NaN cost would flow
  // into deductCredits, fail its integer check, throw, and be swallowed by the
  // caller's try/catch — billing nothing at all. Always fall back to the
  // minimum charge rather than to no charge.
  if (!Number.isFinite(costUsd) || costUsd <= 0) {
    return getEffectiveMinCredits();
  }

  const baseCredits = Math.ceil(costUsd / CREDIT_USD_VALUE);
  const credits = applyCreditCostMultiplier(baseCredits);
  return Number.isFinite(credits) ? credits : getEffectiveMinCredits();
};

/** Rough upper bound for pre-flight balance checks in the UI */
export const estimateCreditsForTokens = (
  modelId: string,
  estimatedInputTokens: number,
  estimatedOutputTokens: number
): number => {
  const { inputUsdPerMillion, outputUsdPerMillion } =
    getOpenRouterPricing(modelId);
  const costUsd =
    (estimatedInputTokens / 1_000_000) * inputUsdPerMillion +
    (estimatedOutputTokens / 1_000_000) * outputUsdPerMillion;

  const baseCredits = Math.ceil(costUsd / CREDIT_USD_VALUE);
  return applyCreditCostMultiplier(baseCredits);
};

export const formatUsageCreditsLabel = (modelId: string): string => {
  const inPer1k = estimateCreditsForTokens(modelId, 1000, 0);
  const outPer1k = estimateCreditsForTokens(modelId, 0, 1000);
  return `~${inPer1k} / ~${outPer1k} cr per 1k in/out`;
};

export { CREDIT_USD_VALUE, creditsToDollars } from './openrouter-pricing';
