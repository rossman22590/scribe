import type { LanguageModelUsage } from 'ai';
import {
  CREDIT_USD_VALUE,
  openRouterCostUsd,
  getOpenRouterPricing,
} from './openrouter-pricing';

export const MIN_CREDITS_PER_REQUEST = Number(
  process.env.CREDIT_MIN_PER_REQUEST ?? 1
);

export const creditsFromTokenUsage = (
  modelId: string,
  usage: LanguageModelUsage | undefined
): number => {
  const costUsd = openRouterCostUsd(modelId, usage);

  if (costUsd <= 0) {
    return MIN_CREDITS_PER_REQUEST;
  }

  const credits = Math.ceil(costUsd / CREDIT_USD_VALUE);
  return Math.max(MIN_CREDITS_PER_REQUEST, credits);
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

  return Math.max(
    MIN_CREDITS_PER_REQUEST,
    Math.ceil(costUsd / CREDIT_USD_VALUE)
  );
};

export const formatUsageCreditsLabel = (modelId: string): string => {
  const inPer1k = estimateCreditsForTokens(modelId, 1000, 0);
  const outPer1k = estimateCreditsForTokens(modelId, 0, 1000);
  return `~${inPer1k} / ~${outPer1k} cr per 1k in/out`;
};

export { CREDIT_USD_VALUE, creditsToDollars } from './openrouter-pricing';
