import {
  type UIMessage,
  type UIMessageStreamWriter,
  streamText,
  smoothStream,
  stepCountIs,
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
} from 'ai';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
  getDocumentById,
  getMessagesByChatId,
  getMessageById,
  updateChatContextQuery,
  deleteMessagesAfterMessageId,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  convertToUIMessages,
  convertUIMessageToDBFormat,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '@/app/api/chat/actions/chat';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { streamingDocument } from '@/lib/ai/tools/document-streaming';
import { NextResponse } from 'next/server';
import { myProvider } from '@/lib/ai/providers';
import { auth } from "@/lib/auth";
import { headers } from 'next/headers';
import { assertMinimumCredits, deductCreditsFromUsage } from '@/lib/credits/usage-billing';
import { getEffectiveMinCredits } from '@/lib/credits/token-pricing';
import { getUserSubscriptionPlan } from '@/lib/subscription';
import { canUseModel } from '@/lib/credits/plans';
import { chatModels } from '@/lib/ai/models';
import type { Document } from '@saru/db';
import { webSearch } from '@/lib/ai/tools/web-search';
import type { ActiveDocumentId, ChatContextPayload, ChatAiOptions } from '@/types/chat';

export const maxDuration = 60;

function getMessageText(message: UIMessage): string {
  return (message.parts ?? [])
    .filter(
      (part): part is { type: 'text'; text: string } =>
        typeof part === 'object' &&
        part !== null &&
        part.type === 'text' &&
        'text' in part &&
        typeof part.text === 'string'
    )
    .map((part) => part.text)
    .join(' ')
    .trim();
}

function shouldForceStreamingDocument({
  userText,
  activeTools,
}: {
  userText: string;
  activeTools: Array<'streamingDocument' | 'updateDocument' | 'webSearch'>;
}) {
  if (!activeTools.includes('streamingDocument')) {
    return false;
  }

  return /\b(create|write|draft|compose|generate|make)\b[\s\S]{0,80}\b(poem|story|essay|article|post|blog|letter|email|outline|document|draft|script|paragraph|section|copy)\b/i.test(
    userText
  );
}

function getCreatedDocumentIdFromMessages(messages: UIMessage[]) {
  for (const message of messages) {
    for (const part of message.parts ?? []) {
      if (
        part.type === 'tool-streamingDocument' &&
        'output' in part &&
        part.output &&
        typeof part.output === 'object' &&
        'documentId' in part.output &&
        typeof part.output.documentId === 'string'
      ) {
        return part.output.documentId;
      }
    }
  }

  return undefined;
}

async function createEnhancedSystemPrompt({
  selectedChatModel,
  activeDocumentId,
  mentionedDocumentIds,
  customInstructions,
  writingStyleSummary,
  applyStyle,
  userId,
  availableTools = ['streamingDocument','updateDocument','webSearch'] as Array<'streamingDocument'|'updateDocument'|'webSearch'>,
}: {
  selectedChatModel: string;
  activeDocumentId?: ActiveDocumentId;
  mentionedDocumentIds?: string[] | null;
  customInstructions?: string | null;
  writingStyleSummary?: string | null;
  applyStyle?: boolean;
  userId: string;
  availableTools?: Array<'streamingDocument'|'updateDocument'|'webSearch'>;
}) {

  let basePrompt = systemPrompt({ selectedChatModel, availableTools });

  if (customInstructions) {
    basePrompt = customInstructions + "\n\n" + basePrompt;
  }

  if (applyStyle && writingStyleSummary) {
    const styleBlock = `PERSONAL STYLE GUIDE\n• Emulate the author\'s tone, rhythm, sentence structure, vocabulary choice, and punctuation habits.\n• Do NOT copy phrases or introduce topics from the reference text.\n• Only transform wording to match style; keep semantic content from the current conversation.\nStyle description: ${writingStyleSummary}`;
    basePrompt = styleBlock + "\n\n" + basePrompt;
  }

  if (activeDocumentId) {
    try {
      const document = await getDocumentById({ id: activeDocumentId });
      if (document && document.userId === userId) {
        const documentContext = `
CURRENT DOCUMENT:
Title: ${document.title}
Content:
${document.content || '(Empty document)'}
`;
        basePrompt += `\n\n${documentContext}`;
      }
    } catch (error) {
      console.error(`[Chat] Failed to load active document ${activeDocumentId}:`, error);
    }
  }

  if (mentionedDocumentIds && mentionedDocumentIds.length > 0) {
    basePrompt += `\n\n--- MENTIONED DOCUMENTS (do not modify) ---`;
    for (const mentionedId of mentionedDocumentIds) {
      if (mentionedId === activeDocumentId) continue;

      try {
        const document = await getDocumentById({ id: mentionedId });
        if (document && document.userId === userId) {
          const mentionedContext = `
MENTIONED DOCUMENT:
Title: ${document.title}
Content:
${document.content || '(Empty document)'}
`;
          basePrompt += `\n${mentionedContext}`;
        }
      } catch (error) {
        console.error(`[Chat] Failed to load mentioned document ${mentionedId}:`, error);
      }
    }
    basePrompt += `\n--- END MENTIONED DOCUMENTS ---`;
  }

  return basePrompt;
}

// Get a chat by ID with its messages
export async function GET(request: Request) {
  try {
    const readonlyHeaders = await headers();
    const requestHeaders = new Headers(readonlyHeaders);
    const session = await auth.api.getSession({ headers: requestHeaders });

    if (!session?.user) {
      return new Response('Authentication error', { status: 401 });
    }

    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('id');

    if (!chatId) {
      return new Response('Chat ID is required', { status: 400 });
    }

    const chat = await getChatById({ id: chatId });
    if (!chat) {
      return new Response('Chat not found', { status: 404 });
    }

    if (chat.userId !== userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const dbMessages = await getMessagesByChatId({ id: chatId });
    const uiMessages = convertToUIMessages(dbMessages);

    return new Response(JSON.stringify({
      ...chat,
      messages: uiMessages
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return new Response('Error fetching chat', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const readonlyHeaders = await headers();
    const requestHeaders = new Headers(readonlyHeaders);
    const session = await auth.api.getSession({ headers: requestHeaders });

    if (!session?.user) {
      return new Response('Authentication error', { status: 401 });
    }

    const userId = session.user.id;

    type ChatRequestData = ChatContextPayload & Record<string, unknown>;

    interface ChatRequestBody {
      id: string;
      chatId: string;
      messages: Array<UIMessage>;
      selectedChatModel: string;
      data?: ChatRequestData;
      aiOptions?: ChatAiOptions | null;
      trailingMessageId?: string;
    }

    const {
      id: requestId,
      chatId,
      messages,
      selectedChatModel,
      data: requestData,
      aiOptions,
      trailingMessageId,
    }: ChatRequestBody = await request.json();

    const subscriptionPlan = await getUserSubscriptionPlan(userId);
    const modelDef = chatModels.find((m) => m.id === selectedChatModel);
    if (modelDef?.proOnly && !canUseModel(selectedChatModel, subscriptionPlan, true)) {
      return NextResponse.json(
        { error: 'upgrade_required', message: 'This model requires a Premium or Ultra subscription.' },
        { status: 402 }
      );
    }

    const creditError = await assertMinimumCredits(userId, getEffectiveMinCredits());
    if (creditError) return creditError;

    let activeDocumentId: ActiveDocumentId = requestData?.activeDocumentId ?? undefined;
    let mentionedDocumentIds = requestData?.mentionedDocumentIds ?? undefined;
    const customInstructions = aiOptions?.customInstructions ?? null;
    const suggestionLength = aiOptions?.suggestionLength ?? 'medium';
    const writingStyleSummary = aiOptions?.writingStyleSummary ?? null;
    const applyStyle = aiOptions?.applyStyle ?? true;

    const userMessage = getMostRecentUserMessage(messages);
    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(chatId)) {
      return new Response('Invalid chat ID format', { status: 400 });
    }

    if (activeDocumentId && !uuidRegex.test(activeDocumentId)) {
      activeDocumentId = undefined;
    }
    if (Array.isArray(mentionedDocumentIds)) {
      mentionedDocumentIds = mentionedDocumentIds.filter(
        (id): id is string => typeof id === 'string' && uuidRegex.test(id)
      );
    } else {
      mentionedDocumentIds = undefined;
    }

    const chat = await getChatById({ id: chatId });

    if (!chat) {
      let title = 'New chat';
      try {
        title = await generateTitleFromUserMessage({ message: userMessage });
      } catch (error) {
        console.warn('[Chat Route] Title generation failed, using fallback:', error);
      }
      await saveChat({
        id: chatId,
        userId: userId,
        title,
        document_context: {
          active: activeDocumentId || undefined,
          mentioned: mentionedDocumentIds,
        }
      });
    } else {
      if (chat.userId !== userId) {
        return new Response('Unauthorized', { status: 401 });
      }

      await updateChatContextQuery({
        chatId,
        userId,
        context: {
          active: activeDocumentId || undefined,
          mentioned: mentionedDocumentIds,
        }
      });
    }


    const existingUserMessage = await getMessageById({ id: userMessage.id });
    if (!existingUserMessage) {
      await saveMessages({
        messages: [{
          id: userMessage.id,
          chatId: chatId,
          role: userMessage.role,
          content: { parts: userMessage.parts },
          createdAt: new Date().toISOString(),
        }],
      });
    }

    if (trailingMessageId) {
      const anchorMessage = await getMessageById({ id: trailingMessageId });
      if (anchorMessage && anchorMessage.chatId === chatId) {
        await deleteMessagesAfterMessageId({ chatId, messageId: trailingMessageId });
      } else {
        console.warn(`Invalid trailingMessageId ${trailingMessageId} for chat ${chatId}`);
      }
    }

    const toolSession = session;
    if (!toolSession) {
      return new Response('Internal Server Error', { status: 500 });
    }


    let validatedActiveDocumentId: string | undefined = undefined;
    let activeDoc: Document | null = null;
    if (activeDocumentId && uuidRegex.test(activeDocumentId)) {
        try {
        activeDoc = await getDocumentById({ id: activeDocumentId });
          if (activeDoc) {
            validatedActiveDocumentId = activeDocumentId;
          }
      } catch (error) {
        console.error(`Error loading active document ${activeDocumentId}:`, error);
      }
    }

    type AvailableTools = Partial<{
      streamingDocument: ReturnType<typeof streamingDocument>;
      updateDocument: ReturnType<typeof updateDocument>;
      webSearch: ReturnType<typeof webSearch>;
    }>;
    const availableTools: AvailableTools = {};
    const activeToolsList: Array<'streamingDocument' | 'updateDocument' | 'webSearch'> = [];

    const activeDocumentContent = activeDoc?.content ?? '';
    const isActiveDocumentEmpty = activeDocumentContent.trim().length === 0;

    if (validatedActiveDocumentId === undefined) {
      availableTools.streamingDocument = streamingDocument({ session: toolSession, chatId });
      activeToolsList.push('streamingDocument');
    } else {
      availableTools.updateDocument = updateDocument({
        session: toolSession,
        documentId: validatedActiveDocumentId,
      });
      activeToolsList.push('updateDocument');

      if (isActiveDocumentEmpty) {
        availableTools.streamingDocument = streamingDocument({
          session: toolSession,
          documentId: validatedActiveDocumentId,
          chatId,
        });
        activeToolsList.push('streamingDocument');
      }
    }

    if (process.env.TAVILY_API_KEY) {
      availableTools.webSearch = webSearch({ session: toolSession });
      activeToolsList.push('webSearch');
    }

    const dynamicSystemPrompt = await createEnhancedSystemPrompt({
      selectedChatModel,
      activeDocumentId: validatedActiveDocumentId,
      mentionedDocumentIds,
      customInstructions,
      writingStyleSummary,
      applyStyle,
      userId,
      availableTools: activeToolsList,
    });
    const userText = getMessageText(userMessage);
    const forceStreamingDocument = shouldForceStreamingDocument({
      userText,
      activeTools: activeToolsList,
    });

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }: { writer: UIMessageStreamWriter }) => {
        const toolsWithStream: AvailableTools = { ...availableTools };
        if (toolsWithStream.streamingDocument) {
          toolsWithStream.streamingDocument = streamingDocument({
            session: toolSession,
            dataStream,
            documentId: validatedActiveDocumentId,
            chatId,
          });
        }

        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: dynamicSystemPrompt,
          messages: convertToModelMessages(messages),
          stopWhen: forceStreamingDocument ? stepCountIs(1) : stepCountIs(2),
          activeTools: activeToolsList,
          prepareStep: forceStreamingDocument
            ? ({ stepNumber }) =>
                stepNumber === 0
                  ? {
                      toolChoice: {
                        type: 'tool' as const,
                        toolName: 'streamingDocument' as const,
                      },
                    }
                  : { toolChoice: 'none' as const }
            : undefined,
          experimental_transform: smoothStream({ chunking: 'word' }),
          tools: toolsWithStream,
          onFinish: async ({ totalUsage }) => {
            try {
              const deductResult = await deductCreditsFromUsage({
                userId,
                modelId: selectedChatModel,
                usage: totalUsage,
                reason: 'chat',
                extraMetadata: { chatId },
              });
              if (!deductResult.ok) {
                console.warn(
                  `[Chat] Insufficient credits after stream for user ${userId}: ` +
                    `need ${deductResult.required}, captured ${deductResult.captured}, ` +
                    `unbilled ${deductResult.required - deductResult.captured}`
                );
              }
            } catch (error) {
              console.error('[Chat] Failed to deduct credits from token usage:', error);
            }
          },
        });

        result.consumeStream();
        dataStream.merge(result.toUIMessageStream({ sendReasoning: true }));
      },
      generateId: generateUUID,
      onFinish: async ({ messages: allMessages }: { messages: UIMessage[] }) => {
        if (userId) {
          try {
            const existingMessages = await getMessagesByChatId({ id: chatId });
            const existingIds = new Set(existingMessages.map((m) => m.id));
            const createdDocumentId = getCreatedDocumentIdFromMessages(allMessages);
            const contextActiveDocumentId =
              createdDocumentId || validatedActiveDocumentId;

            const generated = allMessages
              .filter(
                (m) =>
                  m.role === 'assistant' &&
                  typeof m.id === 'string' &&
                  m.id.length > 0 &&
                  !existingIds.has(m.id)
              )
              .map((m) => convertUIMessageToDBFormat(m, chatId));

            if (generated.length > 0) {
              await saveMessages({ messages: generated });
            }
            await updateChatContextQuery({
              chatId,
              userId,
              context: {
                active: contextActiveDocumentId,
                mentioned: mentionedDocumentIds,
              },
            });
          } catch (error) {
            console.error('Failed to save chat/messages onFinish:', error);
          }
        }
      },
      onError: () => 'Oops, an error occurred!',
    });

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()), {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });

  } catch (error) {
    console.error('Chat route error:', error);
    return NextResponse.json({ error }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const readonlyHeaders = await headers();
    const requestHeaders = new Headers(readonlyHeaders);
    const session = await auth.api.getSession({ headers: requestHeaders });

    if (!session?.user) {
      return new Response('Authentication error', { status: 401 });
    }

    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const rawChatId = searchParams.get('id');

    if (!rawChatId) {
      return new Response('Chat ID is required', { status: 400 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(rawChatId)) {
      return new Response('Invalid chat ID format', { status: 400 });
    }

    const chat = await getChatById({ id: rawChatId });

    if (!chat) {
      return new Response('Chat not found', { status: 404 });
    }

    if (chat.userId !== userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id: rawChatId });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return new Response('Error deleting chat', { status: 500 });
  }
}
