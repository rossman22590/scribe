import type { LanguageModelUsage } from 'ai';
import {
  SCRIBE_MODEL_TO_OPENROUTER_SLUG,
  type OpenRouterUsdPerMillion,
} from '@/lib/ai/openrouter-models';

/**
 * 1 credit = this many USD of OpenRouter API spend.
 * Premium 1000 cr ≈ $10/mo, Ultra 3000 cr ≈ $30/mo.
 */
/**
 * Parse a numeric env var, falling back to the default when it is missing,
 * unparseable, or out of range. A bad value must never reach the billing math:
 * NaN propagates through the cost calculation, trips the integer check in
 * deductCredits, and the resulting throw is caught by the callers — which means
 * a single typo'd env var silently serves every request for free.
 */
const numericEnv = (
  name: string,
  fallback: number,
  { min }: { min: number }
): number => {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < min) {
    console.warn(
      `[credits] Ignoring invalid ${name}="${raw}" (must be a finite number >= ${min}); using ${fallback}.`
    );
    return fallback;
  }
  return parsed;
};

export const CREDIT_USD_VALUE = numericEnv('CREDIT_USD_VALUE', 0.01, {
  min: Number.MIN_VALUE,
});

/**
 * Global markup on token-derived charges (2 = 100% more expensive than raw OR
 * cost). Floored at 1: the markup may be configured away, but never below cost.
 */
export const CREDIT_COST_MULTIPLIER = numericEnv('CREDIT_COST_MULTIPLIER', 2, {
  min: 1,
});

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
      inputUsdPerMillion: numericEnv('OR_PRICE_HAIKU_INPUT_PER_M', 1.0, { min: 0 }),
      outputUsdPerMillion: numericEnv('OR_PRICE_HAIKU_OUTPUT_PER_M', 5.0, { min: 0 }),
    },
    'anthropic/claude-sonnet-5': {
      inputUsdPerMillion: numericEnv('OR_PRICE_SONNET_INPUT_PER_M', 2.0, { min: 0 }),
      outputUsdPerMillion: numericEnv('OR_PRICE_SONNET_OUTPUT_PER_M', 10.0, { min: 0 }),
    },
    'openai/gpt-5.6-sol': {
      inputUsdPerMillion: numericEnv('OR_PRICE_SOL_INPUT_PER_M', 5.0, { min: 0 }),
      outputUsdPerMillion: numericEnv('OR_PRICE_SOL_OUTPUT_PER_M', 30.0, { min: 0 }),
    },
    'openai/gpt-5.6-terra': {
      inputUsdPerMillion: numericEnv('OR_PRICE_TERRA_INPUT_PER_M', 1.0, { min: 0 }),
      outputUsdPerMillion: numericEnv('OR_PRICE_TERRA_OUTPUT_PER_M', 6.0, { min: 0 }),
    },
  };

const maxKnownPrice = (key: keyof OpenRouterUsdPerMillion): number =>
  Math.max(
    ...Object.values(OPENROUTER_USD_PER_MILLION).map((price) => price[key])
  );

/**
 * Pricing for a slug that is not in the table above.
 *
 * Deliberately the most expensive known rate, not an average: an unpriced model
 * is billed as if it were the priciest one we serve, so a slug override (via the
 * OPENROUTER_*_MODEL env vars) can never be billed below its real cost. Erring
 * cheap here would undercharge silently — pointing the reasoning tier at a
 * $5/$30 model while billing it at $1/$5 loses money on every call.
 */
const DEFAULT_OR_PRICING: OpenRouterUsdPerMillion = {
  inputUsdPerMillion: numericEnv(
    'OR_PRICE_DEFAULT_INPUT_PER_M',
    maxKnownPrice('inputUsdPerMillion'),
    { min: 0 }
  ),
  outputUsdPerMillion: numericEnv(
    'OR_PRICE_DEFAULT_OUTPUT_PER_M',
    maxKnownPrice('outputUsdPerMillion'),
    { min: 0 }
  ),
};

const warnedUnpricedSlugs = new Set<string>();

export const getOpenRouterPricing = (
  scribeModelId: string
): OpenRouterUsdPerMillion => {
  const slug =
    SCRIBE_MODEL_TO_OPENROUTER_SLUG[scribeModelId] ?? scribeModelId;
  const known = OPENROUTER_USD_PER_MILLION[slug];
  if (known) return known;

  if (!warnedUnpricedSlugs.has(slug)) {
    warnedUnpricedSlugs.add(slug);
    console.warn(
      `[credits] No price entry for "${slug}" — billing at the most expensive known rate ` +
        `($${DEFAULT_OR_PRICING.inputUsdPerMillion}/$${DEFAULT_OR_PRICING.outputUsdPerMillion} per 1M). ` +
        `Add it to OPENROUTER_USD_PER_MILLION.`
    );
  }
  return DEFAULT_OR_PRICING;
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
