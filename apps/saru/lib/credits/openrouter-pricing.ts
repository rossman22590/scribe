import type { LanguageModelUsage } from 'ai';
import {
  OPENROUTER_MODEL_SLUGS,
  SCRIBE_MODEL_TO_OPENROUTER_SLUG,
  type OpenRouterUsdPerMillion,
} from '@/lib/ai/openrouter-models';

/**
 * 1 credit = this many USD of OpenRouter API spend.
 * Premium 1000 cr ≈ $10/mo, Ultra 3000 cr ≈ $30/mo.
 */
export const CREDIT_USD_VALUE = Number(process.env.CREDIT_USD_VALUE ?? 0.01);

/** Global markup on token-derived charges (2 = 100% more expensive than raw OR cost). */
export const CREDIT_COST_MULTIPLIER = Number(
  process.env.CREDIT_COST_MULTIPLIER ?? 2
);

/** OpenRouter list price: USD per 1 million tokens */
export const OPENROUTER_USD_PER_MILLION: Record<string, OpenRouterUsdPerMillion> =
  {
    [OPENROUTER_MODEL_SLUGS.small]: {
      inputUsdPerMillion: Number(
        process.env.OR_PRICE_HAIKU_INPUT_PER_M ?? 0.8
      ),
      outputUsdPerMillion: Number(
        process.env.OR_PRICE_HAIKU_OUTPUT_PER_M ?? 4.0
      ),
    },
    [OPENROUTER_MODEL_SLUGS.large]: {
      inputUsdPerMillion: Number(
        process.env.OR_PRICE_SONNET_INPUT_PER_M ?? 3.0
      ),
      outputUsdPerMillion: Number(
        process.env.OR_PRICE_SONNET_OUTPUT_PER_M ?? 15.0
      ),
    },
    [OPENROUTER_MODEL_SLUGS.reasoning]: {
      inputUsdPerMillion: Number(
        process.env.OR_PRICE_GPT55_INPUT_PER_M ?? 5.0
      ),
      outputUsdPerMillion: Number(
        process.env.OR_PRICE_GPT55_OUTPUT_PER_M ?? 30.0
      ),
    },
    [OPENROUTER_MODEL_SLUGS.artifact]: {
      inputUsdPerMillion: Number(
        process.env.OR_PRICE_ARTIFACT_INPUT_PER_M ?? 0.8
      ),
      outputUsdPerMillion: Number(
        process.env.OR_PRICE_ARTIFACT_OUTPUT_PER_M ?? 4.0
      ),
    },
    [OPENROUTER_MODEL_SLUGS.title]: {
      inputUsdPerMillion: Number(
        process.env.OR_PRICE_TITLE_INPUT_PER_M ?? 0.1
      ),
      outputUsdPerMillion: Number(
        process.env.OR_PRICE_TITLE_OUTPUT_PER_M ?? 0.1
      ),
    },
  };

const DEFAULT_OR_PRICING: OpenRouterUsdPerMillion = {
  inputUsdPerMillion: Number(process.env.OR_PRICE_DEFAULT_INPUT_PER_M ?? 1.0),
  outputUsdPerMillion: Number(process.env.OR_PRICE_DEFAULT_OUTPUT_PER_M ?? 5.0),
};

export const getOpenRouterPricing = (
  scribeModelId: string
): OpenRouterUsdPerMillion => {
  const slug =
    SCRIBE_MODEL_TO_OPENROUTER_SLUG[scribeModelId] ?? scribeModelId;
  return OPENROUTER_USD_PER_MILLION[slug] ?? DEFAULT_OR_PRICING;
};

/** Raw OpenRouter API cost in USD for token usage */
export const openRouterCostUsd = (
  scribeModelId: string,
  usage: LanguageModelUsage | undefined
): number => {
  if (!usage) return 0;

  const input = usage.inputTokens ?? 0;
  const output = usage.outputTokens ?? 0;
  if (input === 0 && output === 0 && !(usage.totalTokens ?? 0)) return 0;

  const { inputUsdPerMillion, outputUsdPerMillion } =
    getOpenRouterPricing(scribeModelId);

  return (
    (input / 1_000_000) * inputUsdPerMillion +
    (output / 1_000_000) * outputUsdPerMillion
  );
};

export const dollarsToCredits = (usd: number): number =>
  Math.max(0, Math.ceil(usd / CREDIT_USD_VALUE));

export const creditsToDollars = (credits: number): number =>
  credits * CREDIT_USD_VALUE;

/** Monthly plan budgets in USD */
export const PLAN_MONTHLY_USD = {
  free: Number(process.env.CREDITS_FREE_USD_MONTHLY ?? 1),
  premium: Number(process.env.CREDITS_PREMIUM_USD_MONTHLY ?? 10),
  ultra: Number(process.env.CREDITS_ULTRA_USD_MONTHLY ?? 30),
} as const;

export const planAllowanceCredits = (
  plan: keyof typeof PLAN_MONTHLY_USD
): number => dollarsToCredits(PLAN_MONTHLY_USD[plan]);
