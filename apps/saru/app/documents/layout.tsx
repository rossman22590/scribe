import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';
import { Chat } from '@/components/chat/chat';
import { ResizablePanel } from '@/components/resizable-panel';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SuggestionOverlayProvider } from '@/components/suggestion-overlay-provider';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getCurrentAdminUser } from '@/lib/admin';
import { getCurrentDocumentsByUserId } from '@/lib/db/queries';
import { chatModels, DEFAULT_CHAT_MODEL } from '@/lib/ai/models';

export default async function DocumentsLayout({ children }: { children: ReactNode }) {
  const readonlyHeaders = await headers();
  const requestHeaders = new Headers(readonlyHeaders);
  const session = await auth.api.getSession({ headers: requestHeaders });
  const user = session?.user;
  const documents = user?.id
    ? await getCurrentDocumentsByUserId({ userId: user.id })
    : [];
  const adminUser = user?.id ? await getCurrentAdminUser() : null;
  const cookieHeader = readonlyHeaders.get('cookie') || '';
  const leftCookie = cookieHeader
    .split('; ')
    .find((row: string) => row.startsWith('sidebar_state_left='));
  const isLeftSidebarCollapsed = leftCookie
    ? leftCookie.split('=')[1] === 'false'
    : true;

  // Restore the model the user last picked. Validated against chatModels so a
  // stale or hand-edited cookie can't reach myProvider.languageModel(), which
  // throws on an unknown alias.
  const modelCookie = cookieHeader
    .split('; ')
    .find((row: string) => row.startsWith('chat-model='));
  const cookieModelId = modelCookie
    ? decodeURIComponent(modelCookie.split('=')[1] ?? '')
    : '';
  const selectedChatModel = chatModels.some((m) => m.id === cookieModelId)
    ? cookieModelId
    : DEFAULT_CHAT_MODEL;

  return (
      <SidebarProvider defaultOpenLeft={!isLeftSidebarCollapsed} defaultOpenRight={true}>
          <SuggestionOverlayProvider>
          <div className="flex flex-row h-dvh w-full bg-background">
          <AppSidebar user={user} initialDocuments={documents} isAdmin={Boolean(adminUser)} />
          <main className="flex-1 flex flex-row min-w-0">
            <div className="flex-1 min-w-0 overflow-hidden border-r subtle-border">
              {children} 
            </div>
            <ResizablePanel 
              side="right"
              defaultSize={400} 
              minSize={320} 
              maxSize={600}
              className="border-l subtle-border transition-all duration-200"
            >
              <Chat
                initialMessages={[]}
                selectedChatModel={selectedChatModel}
              />
            </ResizablePanel>
          </main>
        </div>
        </SuggestionOverlayProvider>
      </SidebarProvider>
  );
} 
