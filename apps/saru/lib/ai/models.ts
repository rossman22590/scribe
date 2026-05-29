export const DEFAULT_CHAT_MODEL: string = 'chat-model-small';

interface ChatModel {
  id: string;
  name: string;
  description: string;
  proOnly?: boolean;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model-small',
    name: 'Small Model',
    description: 'Claude 3.5 Haiku for fast everyday writing tasks',
  },
  {
    id: 'chat-model-large',
    name: 'Large Model',
    description: 'Claude Sonnet 4.6 for complex drafts and edits',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning Model',
    description: 'GPT-5.5 for advanced step-by-step reasoning',
  },
];
