import type { LanguageModelUsage } from 'ai';
import {
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

/**
 * OpenRouter list price: USD per 1 million tokens.
 *
 * Keyed by slug, not by role — several roles share a slug (small, title and
 * artifact all run Haiku 4.5), and keying by role would silently collide.
 * Prices are OpenRouter list as of August 2026.
 */
export const OPENROUTER_USD_PER_MILLION: Record<string, OpenRouterUsdPerMillion> =
  {
    'anthropic/claude-haiku-4.5': {
      inputUsdPerMillion: Number(
        process.env.OR_PRICE_HAIKU_INPUT_PER_M ?? 1.0
      ),
      outputUsdPerMillion: Number(
        process.env.OR_PRICE_HAIKU_OUTPUT_PER_M ?? 5.0
      ),
    },
    'anthropic/claude-sonnet-5': {
      inputUsdPerMillion: Number(
        process.env.OR_PRICE_SONNET_INPUT_PER_M ?? 2.0
      ),
      outputUsdPerMillion: Number(
        process.env.OR_PRICE_SONNET_OUTPUT_PER_M ?? 10.0
      ),
    },
    'openai/gpt-5.6-sol': {
      inputUsdPerMillion: Number(process.env.OR_PRICE_SOL_INPUT_PER_M ?? 5.0),
      outputUsdPerMillion: Number(
        process.env.OR_PRICE_SOL_OUTPUT_PER_M ?? 30.0
      ),
    },
    'openai/gpt-5.6-terra': {
      inputUsdPerMillion: Number(process.env.OR_PRICE_TERRA_INPUT_PER_M ?? 1.0),
      outputUsdPerMillion: Number(
        process.env.OR_PRICE_TERRA_OUTPUT_PER_M ?? 6.0
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
