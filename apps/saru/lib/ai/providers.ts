import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
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

const openRouterChat = (modelId: string) => openrouter.chat(modelId);

export const myProvider = customProvider({
  languageModels: {
    'chat-model-small': openRouterChat(openRouterModels.small),
    'chat-model-large': openRouterChat(openRouterModels.large),
    'chat-model-reasoning': wrapLanguageModel({
      model: openRouterChat(openRouterModels.reasoning),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': openRouterChat(openRouterModels.title),
    'artifact-model': openRouterChat(openRouterModels.artifact),
  },
});
