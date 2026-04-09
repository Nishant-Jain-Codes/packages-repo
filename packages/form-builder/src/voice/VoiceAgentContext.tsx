/**
 * VoiceAgentContext.tsx
 *
 * Provides the voice agent's state and actions to ManageForms and FormBuilder
 * without prop drilling. Both screens wrap themselves in this provider.
 *
 * Also exposes a UI callbacks registry so host components (FormBuilder, etc.)
 * can register handlers that the voice agent can trigger directly — e.g.
 * opening the JSON dialog.
 */

import { createContext, useContext, useRef, type ReactNode } from "react";
import { useVoiceAgent } from "./useVoiceAgent";
import type { VoiceAgentState, VoiceAgentActions, AgentStage } from "./useVoiceAgent";
import { useVoiceActionFeed } from "./VoiceActionFeedContext";
import type { FeedEntry } from "./VoiceActionFeedContext";

// ─── UI Callbacks ─────────────────────────────────────────────────────────────

export interface UICallbacks {
  openJsonDialog?: () => void;
  downloadForm?: () => void;
  copyJsonToClipboard?: () => Promise<void>;
  /** Report config screen registers this to handle RC_* voice actions */
  reportConfigDispatch?: (action: any) => string;
  /** Report preview screen registers this to handle RP_* voice actions */
  reportPreviewDispatch?: (action: any) => string;
  /** Called after voice agent adds a field — field ID for the highlight ring */
  onVoiceFieldAdded?: (fieldId: string) => void;
  /** Called after SUGGEST_FIELDS — section ID to pulse the section glow */
  onVoiceSectionHighlight?: (sectionId: string) => void;
  /** Called after SAVE — flashes the Save button */
  onVoiceSave?: () => void;
  /** Called before REMOVE_SECTION — flashes the section red so user sees which one is being removed */
  onVoiceSectionRemove?: (sectionId: string) => void;
  /** Returns current list of report names — used to inject into agent context */
  getReportNames?: () => string[];
}

// ─── Context value ────────────────────────────────────────────────────────────

interface VoiceAgentContextValue {
  state: VoiceAgentState;
  actions: VoiceAgentActions;
  /** Register UI-level callbacks from host components (e.g. FormBuilder) */
  registerUICallbacks: (callbacks: Partial<UICallbacks>) => void;
  /** Internal ref — used by useVoiceAgent dispatcher */
  uiCallbacksRef: React.MutableRefObject<Partial<UICallbacks>>;
}

const VoiceAgentContext = createContext<VoiceAgentContextValue | null>(null);

interface VoiceAgentProviderProps {
  children: ReactNode;
  initialStage?: AgentStage;
}

export function VoiceAgentProvider({ children, initialStage = "idle" }: VoiceAgentProviderProps) {
  const uiCallbacksRef = useRef<Partial<UICallbacks>>({});
  const onReportConfigReadyRef = useRef<(() => void) | null>(null);

  // Wire the action feed emitter into useVoiceAgent via a stable ref
  const { emitAction } = useVoiceActionFeed();
  const emitFeedRef = useRef<(entry: Omit<FeedEntry, "id" | "exiting">) => void>(emitAction);
  emitFeedRef.current = emitAction;

  const agent = useVoiceAgent(initialStage, uiCallbacksRef, onReportConfigReadyRef, emitFeedRef);

  const registerUICallbacks = (callbacks: Partial<UICallbacks>) => {
    uiCallbacksRef.current = { ...uiCallbacksRef.current, ...callbacks };
    // Flush any queued RC_* actions the moment the report-config page registers
    if (callbacks.reportConfigDispatch) {
      onReportConfigReadyRef.current?.();
    }
  };

  return (
    <VoiceAgentContext.Provider value={{ ...agent, registerUICallbacks, uiCallbacksRef }}>
      {children}
    </VoiceAgentContext.Provider>
  );
}

export function useVoiceAgentContext(): VoiceAgentContextValue {
  const ctx = useContext(VoiceAgentContext);
  if (!ctx) {
    throw new Error("useVoiceAgentContext must be used inside <VoiceAgentProvider>");
  }
  return ctx;
}
