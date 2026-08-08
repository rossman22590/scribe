/**
 * OpenRouter model slugs used by Scribe (see providers.ts).
 * USD per 1M tokens = OpenRouter list prices (August 2026).
 */
export const OPENROUTER_MODEL_SLUGS = {
  small: process.env.OPENROUTER_SMALL_MODEL ?? 'anthropic/claude-haiku-4.5',
  large: process.env.OPENROUTER_LARGE_MODEL ?? 'anthropic/claude-sonnet-5',
  reasoning: process.env.OPENROUTER_REASONING_MODEL ?? 'openai/gpt-5.6-sol',
  balanced: process.env.OPENROUTER_BALANCED_MODEL ?? 'openai/gpt-5.6-terra',
  title: process.env.OPENROUTER_TITLE_MODEL ?? 'anthropic/claude-haiku-4.5',
  artifact:
    process.env.OPENROUTER_ARTIFACT_MODEL ?? 'anthropic/claude-haiku-4.5',
} as const;

/** Maps internal model ids → OpenRouter slug */
export const SCRIBE_MODEL_TO_OPENROUTER_SLUG: Record<string, string> = {
  'chat-model-small': OPENROUTER_MODEL_SLUGS.small,
  'chat-model-large': OPENROUTER_MODEL_SLUGS.large,
  'chat-model-reasoning': OPENROUTER_MODEL_SLUGS.reasoning,
  'chat-model-balanced': OPENROUTER_MODEL_SLUGS.balanced,
  'title-model': OPENROUTER_MODEL_SLUGS.title,
  'artifact-model': OPENROUTER_MODEL_SLUGS.artifact,
};

export type OpenRouterUsdPerMillion = {
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
};
