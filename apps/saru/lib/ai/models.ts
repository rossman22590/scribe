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
    description: 'Claude Haiku 4.5 for fast everyday writing tasks',
  },
  {
    id: 'chat-model-balanced',
    name: 'Balanced Model',
    description: 'GPT-5.6 Terra for everyday drafting and reasoning',
    proOnly: true,
  },
  {
    id: 'chat-model-large',
    name: 'Large Model',
    description: 'Claude Sonnet 5 for complex drafts and edits',
    proOnly: true,
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning Model',
    description: 'GPT-5.6 Sol for advanced step-by-step reasoning',
    proOnly: true,
  },
];
