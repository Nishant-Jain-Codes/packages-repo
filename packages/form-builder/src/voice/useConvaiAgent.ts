/**
 * useConvaiAgent.ts
 *
 * React hook wrapping the ElevenLabs Conversational AI WebSocket SDK.
 * Replaces the entire VAD → STT → LLM parse → TTS pipeline with a single
 * real-time WebSocket session managed by ElevenLabs.
 *
 * The agent in the ElevenLabs dashboard must have one client tool defined:
 *   name: "dispatch_form_action"
 *   description: "Execute a form builder action"
 *   parameters: { action: { type: "string", description: "JSON action object" } }
 *
 * The system prompt (with widget registry + live form state) is injected via
 * overrides at session start.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { buildAgentPrompt } from "./buildAgentPrompt";
import type { VoiceAction, ParseContext } from "./intentParser";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConvaiStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface ConvaiState {
  status: ConvaiStatus;
  /** "listening" = agent is waiting for user to speak; "speaking" = agent is responding */
  mode: "listening" | "speaking";
  transcript: string;   // Latest user message (from onMessage source=user)
  agentMessage: string; // Latest agent message (from onMessage source=ai)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useConvaiAgent(
  dispatchAction: (action: VoiceAction) => Promise<string>,
  getContext: () => ParseContext
) {
  const [convaiState, setConvaiState] = useState<ConvaiState>({
    status: "disconnected",
    mode: "listening",
    transcript: "",
    agentMessage: "",
  });

  const conversationRef = useRef<any>(null); // Conversation instance
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const update = useCallback((updates: Partial<ConvaiState>) => {
    if (isMountedRef.current) {
      setConvaiState((prev) => ({ ...prev, ...updates }));
    }
  }, []);

  // ── Start session ───────────────────────────────────────────────────────────

  const startConvai = useCallback(async (): Promise<void> => {
    update({ status: "connecting" });

    try {
      const { Conversation } = await import("@11labs/client");

      // Fetch signed URL from our backend (keeps API key server-side)
      const resp = await fetch("/api/convai/signed-url", { method: "POST" });
      if (!resp.ok) {
        const { error } = await resp.json().catch(() => ({}));
        throw new Error(error || `Server returned ${resp.status}`);
      }
      const { signedUrl } = await resp.json();

      console.log("[Convai] Starting session with signedUrl...");

      const conv = await Conversation.startSession({
        signedUrl,

        // ── Client tool handler ─────────────────────────────────────────────
        clientTools: {
          dispatch_form_action: async (params: any): Promise<string> => {
            console.log("[Convai] Tool called — dispatch_form_action, params:", params);
            try {
              let action: VoiceAction;
              if (typeof params === "string") {
                action = JSON.parse(params);
              } else if (params?.action && typeof params.action === "string") {
                action = JSON.parse(params.action);
              } else if (params?.action && typeof params.action === "object") {
                action = params.action as VoiceAction;
              } else {
                action = params as VoiceAction;
              }
              console.log("[Convai] Dispatching action:", action);
              const result = await dispatchAction(action);
              console.log("[Convai] Action result:", result);
              return result || "Done.";
            } catch (err) {
              console.error("[Convai] Tool dispatch error:", err);
              return "Sorry, I couldn't complete that action.";
            }
          },
        },

        // ── Session lifecycle ───────────────────────────────────────────────
        onConnect: ({ conversationId }: { conversationId: string }) => {
          console.log("[Convai] onConnect — conversationId:", conversationId);
        },

        onStatusChange: ({ status }: { status: string }) => {
          console.log("[Convai] onStatusChange:", status);
          if (!isMountedRef.current) return;
          const mapped: ConvaiStatus =
            status === "connected"   ? "connected"   :
            status === "connecting"  ? "connecting"  :
            "disconnected";
          update({ status: mapped });
        },

        onModeChange: ({ mode }: { mode: "listening" | "speaking" }) => {
          console.log("[Convai] onModeChange:", mode);
          if (!isMountedRef.current) return;
          update({ mode });
        },

        onMessage: ({ message, source }: { message: string; source: string }) => {
          console.log("[Convai] onMessage — source:", source, "| message:", message);
          if (!isMountedRef.current) return;

          if (source === "user") {
            update({ transcript: message });
            return;
          }

          // ── Intercept tool calls output as text ──────────────────────────
          // When the tool isn't saved in the ElevenLabs dashboard the LLM outputs
          // "dispatch_form_action({...})" as spoken text instead of calling the tool.
          // We parse + execute these so actions work regardless of dashboard setup.
          const toolPattern = /dispatch_form_action\s*\(\s*(\{[\s\S]*?\})\s*\)/g;
          let match: RegExpExecArray | null;
          let actionExecuted = false;

          while ((match = toolPattern.exec(message)) !== null) {
            try {
              const action = JSON.parse(match[1]) as VoiceAction;
              console.log("[Convai] Intercepted tool call from text:", action);
              dispatchAction(action);
              actionExecuted = true;
            } catch (e) {
              console.warn("[Convai] Failed to parse intercepted tool call:", match[1], e);
            }
          }

          // Don't echo raw tool call text to the UI — it's not human-readable
          if (actionExecuted) {
            update({ agentMessage: "On it!" });
          } else {
            update({ agentMessage: message });
          }
        },

        onError: (message: string, context?: any) => {
          console.error("[Convai] onError:", message, context);
          if (isMountedRef.current) {
            update({ status: "error" });
          }
        },

        onDisconnect: (details: any) => {
          console.log("[Convai] onDisconnect:", details);
          if (isMountedRef.current) {
            update({ status: "disconnected" });
          }
        },

        onDebug: (props: any) => {
          console.log("[Convai] debug:", props);
        },
      });

      console.log("[Convai] Session started, conv.isOpen():", conv.isOpen());

      // Send contextual update NOW — conv is assigned so this works correctly.
      // This injects current form state + strong tool-use instructions as a system message.
      try {
        const ctx = getContext();
        const update_msg = buildAgentPrompt(ctx);
        conv.sendContextualUpdate(update_msg);
        console.log("[Convai] Sent contextual update after session start");
      } catch (e) {
        console.warn("[Convai] sendContextualUpdate failed:", e);
      }

      conversationRef.current = conv;
    } catch (err) {
      console.error("[Convai] startSession failed:", err);
      if (isMountedRef.current) {
        update({ status: "error" });
      }
      throw err;
    }
  }, [dispatchAction, getContext, update]);

  // ── Stop session ────────────────────────────────────────────────────────────

  const stopConvai = useCallback(async (): Promise<void> => {
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
      } catch {
        // Ignore errors on cleanup
      }
      conversationRef.current = null;
    }
    if (isMountedRef.current) {
      update({ status: "disconnected", mode: "listening" });
    }
  }, [update]);

  // ── Send context update mid-session ─────────────────────────────────────────

  const sendContextUpdate = useCallback((message: string): void => {
    try {
      conversationRef.current?.sendContextualUpdate(message);
    } catch {
      // Non-critical — session may not be active
    }
  }, []);

  // ── Volume control ──────────────────────────────────────────────────────────

  const setConvaiVolume = useCallback(async (volume: number): Promise<void> => {
    try {
      await conversationRef.current?.setVolume({ volume });
    } catch {
      // Non-critical
    }
  }, []);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      conversationRef.current?.endSession().catch(() => {});
    };
  }, []);

  return {
    convaiState,
    startConvai,
    stopConvai,
    sendContextUpdate,
    setConvaiVolume,
    isConvaiActive: convaiState.status === "connected" || convaiState.status === "connecting",
  };
}
