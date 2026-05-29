'use client';

import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import SuggestionOverlay from './suggestion-overlay';
import { useDocument } from '@/hooks/use-document';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { getActiveEditorView } from '@/lib/editor/editor-state';
import {
  ACTIVATE_SUGGESTION_CONTEXT,  
  DEACTIVATE_SUGGESTION_CONTEXT,
  SET_SUGGESTION_LOADING_STATE
} from '@/lib/editor/suggestion-plugin';

interface SuggestionOverlayContextType {
  openSuggestionOverlay: (options: {
    position?: { x: number; y: number };
    selectedText?: string;
    from?: number;
    to?: number;
  }) => void;
  closeSuggestionOverlay: () => void;
  setSuggestionIsLoading: (isLoading: boolean) => void;
}

const SuggestionOverlayContext = createContext<SuggestionOverlayContextType | null>(null);

type SelectionAction = {
  from: number;
  to: number;
  selectedText: string;
  position: { x: number; y: number };
};

export function SuggestionOverlayProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);
  const [selectionAction, setSelectionAction] = useState<SelectionAction | null>(null);
  const { document } = useDocument();
  const documentId = document.documentId;

  const setSuggestionIsLoading = useCallback((isLoading: boolean) => {
    const view = getActiveEditorView();
    if (view) {
      const tr = view.state.tr.setMeta(SET_SUGGESTION_LOADING_STATE, isLoading);
      view.dispatch(tr);
    }
  }, []);

  const openSuggestionOverlay = useCallback(
    ({
      selectedText,
      position,
      from,
      to,
    }: {
      selectedText?: string;
      position?: { x: number; y: number };
      from?: number;
      to?: number;
    }) => {
      if (selectedText) {
        setSelectedText(selectedText);
      } else {
        setSelectedText('');
      }

      if (typeof from === 'number' && typeof to === 'number') {
        setSelectionRange({ from, to });
        const view = getActiveEditorView();
        if (view) {
          // Ensure any previous active state is cleared first, then activate new.
          // This handles rapidly opening new overlays without explicit close.
          let tr = view.state.tr.setMeta(DEACTIVATE_SUGGESTION_CONTEXT, true);
          tr = tr.setMeta(ACTIVATE_SUGGESTION_CONTEXT, { from, to });
          view.dispatch(tr);
        }
      } else {
        setSelectionRange(null);
        // If opening without a specific range, ensure any existing highlight is cleared.
        const view = getActiveEditorView();
        if (view) {
            const tr = view.state.tr.setMeta(DEACTIVATE_SUGGESTION_CONTEXT, true);
            view.dispatch(tr);
        }
      }

      if (position) {
        setPosition(position);
      } else {
        setPosition({ x: window.innerWidth / 2 - 200, y: window.innerHeight / 3 });
      }

      setIsOpen(true);
    },
    [] // No dependencies, relies on getActiveEditorView at call time
  );

  const closeSuggestionOverlay = useCallback(() => {
    setIsOpen(false);
    setSelectedText('');
    setSelectionRange(null);
    
    const view = getActiveEditorView();
    if (view) {
      // Ensure loading is set to false and then deactivate
      let tr = view.state.tr.setMeta(SET_SUGGESTION_LOADING_STATE, false);
      tr = tr.setMeta(DEACTIVATE_SUGGESTION_CONTEXT, true);
      view.dispatch(tr);
    }
  }, []); // No dependencies, relies on getActiveEditorView at call time

  useEffect(() => {
    let updateTimer: ReturnType<typeof setTimeout> | null = null;

    const hideSelectionAction = () => setSelectionAction(null);

    const updateSelectionAction = () => {
      if (updateTimer) clearTimeout(updateTimer);

      updateTimer = setTimeout(() => {
        if (isOpen || !documentId || documentId === 'init') {
          hideSelectionAction();
          return;
        }

        const view = getActiveEditorView();
        if (!view || !view.dom.contains(window.document.activeElement)) {
          hideSelectionAction();
          return;
        }

        const { from, to, empty } = view.state.selection;
        if (empty || from === to) {
          hideSelectionAction();
          return;
        }

        const text = view.state.doc.textBetween(from, to, ' \n\n ');
        if (!text.trim()) {
          hideSelectionAction();
          return;
        }

        const coords = view.coordsAtPos(to);
        setSelectionAction({
          from,
          to,
          selectedText: text,
          position: {
            x: Math.min(window.innerWidth - 44, Math.max(8, coords.right + 8)),
            y: Math.min(window.innerHeight - 44, Math.max(8, coords.bottom - 8)),
          },
        });
      }, 40);
    };

    window.document.addEventListener('selectionchange', updateSelectionAction);
    window.addEventListener('mouseup', updateSelectionAction);
    window.addEventListener('keyup', updateSelectionAction);
    window.addEventListener('resize', hideSelectionAction);
    window.addEventListener('scroll', hideSelectionAction, true);

    return () => {
      if (updateTimer) clearTimeout(updateTimer);
      window.document.removeEventListener('selectionchange', updateSelectionAction);
      window.removeEventListener('mouseup', updateSelectionAction);
      window.removeEventListener('keyup', updateSelectionAction);
      window.removeEventListener('resize', hideSelectionAction);
      window.removeEventListener('scroll', hideSelectionAction, true);
    };
  }, [documentId, isOpen]);

  const handleAcceptSuggestion = useCallback((suggestion: string) => {
    if (!documentId || documentId === 'init') {
      toast.error("Cannot apply suggestion: No document loaded.");
      return;
    }

    if (selectedText && selectedText.trim() !== '' && selectionRange) {
      console.log(`[Provider] Dispatching apply-suggestion event for range [${selectionRange.from}, ${selectionRange.to}]`);
      const event = new CustomEvent('apply-suggestion', {
        detail: {
          from: selectionRange.from,
          to: selectionRange.to,
          suggestion: suggestion,
          documentId: documentId,
          originalText: selectedText,
        }
      });
      window.dispatchEvent(event);
      closeSuggestionOverlay(); // This will also handle deactivating plugin state
    } else {
      if (!selectionRange) {
        toast.warning("Cannot apply suggestion: Text range not captured.");
      } else {
        toast.warning("Cannot apply suggestion: No text was selected.");
      }
    }
  }, [documentId, selectedText, selectionRange, closeSuggestionOverlay]);

  // Setup global keyboard shortcut for cmd+k
  useEffect(() => {
    const handleCommandK = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();

        const activeEditorView = getActiveEditorView();

        if (activeEditorView && activeEditorView.state) {
          const { state } = activeEditorView;
          const { from, to, empty } = state.selection;

          if (!empty) {
            const text = state.doc.textBetween(from, to, ' \n\n ');
            
            let pos = { x: 100, y: 100 }; // Default position
            const domSelection = window.getSelection();
            const range = domSelection?.getRangeAt(0);

            if (range) {
              const rect = range.getBoundingClientRect();
              const overlayWidth = 400; // Approximate width of SuggestionOverlay
              const overlayHeight = 450; // Approximate max height of SuggestionOverlay
              const padding = 10; // Viewport padding

              let newX = rect.left;
              let newY = rect.bottom + padding;

              // Adjust X if it goes off-screen right
              if (newX + overlayWidth > window.innerWidth - padding) {
                newX = window.innerWidth - overlayWidth - padding;
              }
              // Adjust X if it goes off-screen left (less common for LTR text selection)
              if (newX < padding) {
                newX = padding;
              }

              // Adjust Y if it goes off-screen bottom
              if (newY + overlayHeight > window.innerHeight - padding) {
                // Try to position above the selection
                newY = rect.top - overlayHeight - padding;
              }
              // Adjust Y if (after trying above) it goes off-screen top
              if (newY < padding) {
                newY = padding; // Fallback to top of screen with padding
              }
              
              pos = { x: newX, y: newY };
            }

            console.log(`[Provider] Opening overlay via Cmd+K from editor state. Range: [${from}, ${to}]`);
            openSuggestionOverlay({
              position: pos,
              selectedText: text,
              from,
              to,
            });
          } else {
            toast.info("Select text in the editor before pressing Cmd+K.");
          }
        } else {
          console.warn('[Provider] Cmd+K pressed, but no active editor view found.');
          toast.error("Cannot open suggestion overlay: Editor not active.");
        }
      }
    };

    window.addEventListener('keydown', handleCommandK);
    return () => window.removeEventListener('keydown', handleCommandK);
  }, [openSuggestionOverlay]);

  return (
    <SuggestionOverlayContext.Provider
      value={{
        openSuggestionOverlay,
        closeSuggestionOverlay,
        setSuggestionIsLoading,
      }}
    >
      {children}
      {selectionAction && !isOpen && (
        <button
          type="button"
          aria-label="Edit selected text"
          title="Edit selected text"
          className="fixed z-50 inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-lg transition-colors hover:bg-accent hover:text-accent-foreground"
          style={{
            left: selectionAction.position.x,
            top: selectionAction.position.y,
          }}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault();
            openSuggestionOverlay({
              position: {
                x: Math.max(10, Math.min(window.innerWidth - 410, selectionAction.position.x)),
                y: Math.max(10, Math.min(window.innerHeight - 460, selectionAction.position.y + 12)),
              },
              selectedText: selectionAction.selectedText,
              from: selectionAction.from,
              to: selectionAction.to,
            });
            setSelectionAction(null);
          }}
        >
          <Sparkles size={15} strokeWidth={2.25} />
        </button>
      )}
      {documentId && documentId !== 'init' && (
        <SuggestionOverlay
          documentId={documentId}
          isOpen={isOpen}
          onClose={closeSuggestionOverlay}
          selectedText={selectedText}
          position={position}
          onAcceptSuggestion={handleAcceptSuggestion}
          // highlightedTextProps is no longer needed as the plugin handles highlighting
        />
      )}
    </SuggestionOverlayContext.Provider>
  );
}

export function useSuggestionOverlay() {
  const context = useContext(SuggestionOverlayContext);
  
  if (!context) {
    throw new Error('useSuggestionOverlay must be used within a SuggestionOverlayProvider');
  }
  
  return context;
} 
