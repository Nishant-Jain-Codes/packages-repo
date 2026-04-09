/**
 * FormBuilderLayout.tsx
 *
 * Persistent layout that wraps /manage-forms, /form-builder, and /report-config
 * with a SINGLE VoiceAgentProvider + VoiceAgentPanel.
 *
 * Keeping the provider at layout level (instead of per-page) means the
 * ElevenLabs Conversational AI WebSocket session stays alive when the user
 * navigates between those routes — allowing multi-step voice commands like
 * "create a merchandising form with a photo and a text field" to complete
 * all their tool calls even after the CREATE_ACTIVITY navigation fires.
 */

import { Outlet } from "react-router-dom";
import { VoiceAgentProvider } from "./VoiceAgentContext";
import { VoiceAgentPanel } from "./VoiceAgentPanel";
import { VoiceActionFeedProvider } from "./VoiceActionFeedContext";
import { VoiceActionFeed } from "./VoiceActionFeed";

export function FormBuilderLayout() {
  return (
    <VoiceActionFeedProvider>
      <VoiceAgentProvider initialStage="idle">
        <Outlet />
        <VoiceAgentPanel />
        <VoiceActionFeed />
      </VoiceAgentProvider>
    </VoiceActionFeedProvider>
  );
}
