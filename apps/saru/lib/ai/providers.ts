import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'Scribe',
  },
});

const openRouterModels = {
  small: 'anthropic/claude-3.5-haiku',
  large: 'anthropic/claude-sonnet-4.6',
  reasoning: 'openai/gpt-5.5',
  title: process.env.OPENROUTER_TITLE_MODEL || 'openai/gpt-oss-20b',
  artifact:
    process.env.OPENROUTER_ARTIFACT_MODEL ||
    'anthropic/claude-3.5-haiku',
};

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
