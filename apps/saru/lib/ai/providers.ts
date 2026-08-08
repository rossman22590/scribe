import { customProvider } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { OPENROUTER_MODEL_SLUGS } from './openrouter-models';

const openRouterAppUrl =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const openRouterAppTitle = process.env.OPENROUTER_APP_TITLE || 'Scribe';

const openrouter = createOpenRouter({
  headers: {
    'HTTP-Referer': openRouterAppUrl,
    'X-OpenRouter-Title': openRouterAppTitle,
    'X-Title': openRouterAppTitle,
  },
});

const openRouterModels = OPENROUTER_MODEL_SLUGS;

/** Reasoning depth for the reasoning-tier model. */
const REASONING_EFFORT = (process.env.OPENROUTER_REASONING_EFFORT ??
  'medium') as 'low' | 'medium' | 'high';

const openRouterChat = (modelId: string) => openrouter.chat(modelId);

export const myProvider = customProvider({
  languageModels: {
    'chat-model-small': openRouterChat(openRouterModels.small),
    'chat-model-large': openRouterChat(openRouterModels.large),
    // GPT-5.6 Sol returns reasoning via OpenRouter's native `reasoning` field,
    // which the provider already emits as AI SDK reasoning parts — no
    // extractReasoningMiddleware/<think> parsing needed.
    'chat-model-reasoning': openrouter.chat(openRouterModels.reasoning, {
      reasoning: { effort: REASONING_EFFORT },
    }),
    'chat-model-balanced': openRouterChat(openRouterModels.balanced),
    'title-model': openRouterChat(openRouterModels.title),
    'artifact-model': openRouterChat(openRouterModels.artifact),
  },
});
