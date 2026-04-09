/**
 * VoiceAgentPanel.tsx
 *
 * Compact slide-up panel with:
 *  - Scrolling message history (user + agent bubbles)
 *  - Context-aware suggestion chips so users know what to say
 *  - Live waveform / status indicators
 */

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, X, Loader2, Volume2, Bot, Zap, WifiOff, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVoiceAgentContext } from "./VoiceAgentContext";
import type { AgentStage } from "./useVoiceAgent";

// ─── Stage labels ──────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  idle: "Ready",
  "manage-forms": "Activities",
  building: "Building Form",
  preview: "Preview",
  "report-config": "Report Config",
  "report-preview": "Report Preview",
};

// ─── Suggestion chips per stage ───────────────────────────────────────────────

const STAGE_SUGGESTIONS: Record<AgentStage, string[]> = {
  idle: ["Create a form", "List activities"],
  "manage-forms": [
    "Create a sales form",
    "Clone merchandising",
    "List activities",
    "Create outlet form with photo and text field",
  ],
  building: [
    "Add a text field",
    "Add image picker",
    "Make it required",
    "Suggest fields for outlet",
    "Save the form",
    "Preview",
    "Validate form",
  ],
  preview: ["Save", "Back to build", "Add a text field"],
  "report-config": [
    "Create a report",
    "Enable live report",
    "Enable date range filter",
    "Save config",
    "Suggest config",
    "List reports",
  ],
  "report-preview": [
    "Filter by West region",
    "Filter by RSM",
    "Reset all filters",
    "Download report",
    "Switch to outlet report",
  ],
};

// ─── Message type ─────────────────────────────────────────────────────────────

interface Message {
  id: number;
  role: "user" | "agent";
  text: string;
}

let _msgId = 0;
const nextId = () => ++_msgId;

// ─── Waveform bars ────────────────────────────────────────────────────────────

function WaveformBars({ active, color = "bg-current" }: { active: boolean; color?: string }) {
  return (
    <div className="flex items-center gap-[3px] h-5">
      {[0.6, 1, 0.75, 1, 0.6].map((scale, i) => (
        <span
          key={i}
          className={cn("w-[3px] rounded-full transition-all", color, active ? "animate-waveform" : "h-[4px]")}
          style={active ? { height: `${Math.round(scale * 16)}px`, animationDelay: `${i * 0.1}s` } : undefined}
        />
      ))}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, isSpeaking }: { msg: Message; isSpeaking: boolean }) {
  if (msg.role === "user") {
    return (
      <div className="flex items-start gap-2 justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-primary/10 border border-primary/20 px-3 py-1.5 text-sm">
          {msg.text}
        </div>
        <div className="h-6 w-6 rounded-full bg-muted border flex items-center justify-center shrink-0 text-[10px] font-bold text-muted-foreground mt-0.5">
          You
        </div>
      </div>
    );
  }
  const isLatest = isSpeaking; // only animate the latest agent message
  return (
    <div className="flex items-start gap-2">
      <div
        className={cn(
          "h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors",
          isLatest
            ? "bg-emerald-500 text-white shadow-[0_0_10px_2px_rgba(16,185,129,0.4)]"
            : "bg-emerald-600/20 text-emerald-600"
        )}
      >
        <Bot className="h-3 w-3" />
      </div>
      <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-card border px-3 py-1.5 text-sm shadow-sm">
        {msg.text}
        {isLatest && (
          <span className="ml-1 inline-flex gap-[2px] items-end">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block w-[3px] h-[3px] rounded-full bg-emerald-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Connecting / Error overlays ──────────────────────────────────────────────

function ConnectingOverlay() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      <p className="text-xs font-medium">Connecting to AI agent…</p>
    </div>
  );
}

function ErrorOverlay() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6">
      <WifiOff className="h-6 w-6 text-destructive/60" />
      <p className="text-xs font-medium text-destructive/80">Connection failed</p>
      <p className="text-[11px] text-muted-foreground text-center max-w-[200px]">
        Check that ELEVENLABS_AGENT_ID is set in your server .env
      </p>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function VoiceAgentPanel() {
  const { state, actions } = useVoiceAgentContext();
  const {
    isListening, isSpeaking, isProcessing,
    transcript, agentMessage,
    stage, isSupported, isOpen,
    usingElevenLabs, usingConvai, convaiStatus,
  } = state;
  const { openPanel, closePanel, toggleListening } = actions;

  const [messages, setMessages] = useState<Message[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const prevAgentMsg = useRef("");
  const prevTranscript = useRef("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Append agent messages to history
  useEffect(() => {
    if (agentMessage && agentMessage !== prevAgentMsg.current) {
      prevAgentMsg.current = agentMessage;
      setMessages((prev) => [...prev.slice(-30), { id: nextId(), role: "agent", text: agentMessage }]);
    }
  }, [agentMessage]);

  // Append user transcripts to history
  useEffect(() => {
    if (transcript && transcript !== prevTranscript.current && transcript !== "Transcribing…") {
      prevTranscript.current = transcript;
      setMessages((prev) => [...prev.slice(-30), { id: nextId(), role: "user", text: transcript }]);
    }
  }, [transcript]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear history on panel open
  useEffect(() => {
    if (isOpen) { setMessages([]); prevAgentMsg.current = ""; prevTranscript.current = ""; }
  }, [isOpen]);

  const isConnecting = usingConvai && convaiStatus === "connecting";
  const hasError     = usingConvai && convaiStatus === "error";
  const isConnected  = usingConvai && convaiStatus === "connected";
  const suggestions  = STAGE_SUGGESTIONS[stage] ?? STAGE_SUGGESTIONS.idle;

  // ── Floating trigger button ──────────────────────────────────────────────

  if (!isOpen) {
    return (
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        {!isSupported && (
          <div className="text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-lg px-3 py-1.5 max-w-[200px] text-center">
            Voice requires Chrome or Edge
          </div>
        )}
        <button
          onClick={openPanel}
          title="Open Voice Agent"
          className={cn(
            "group relative h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200",
            "bg-emerald-600 hover:bg-emerald-500 text-white",
            "hover:scale-110 active:scale-95",
            !isSupported && "opacity-50 cursor-not-allowed"
          )}
          disabled={!isSupported}
        >
          <Mic className="h-6 w-6" />
          <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-40" />
          <span className="absolute right-16 whitespace-nowrap bg-popover text-popover-foreground text-xs px-2 py-1 rounded-md border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Voice Agent
          </span>
        </button>
      </div>
    );
  }

  // ── Expanded Panel ───────────────────────────────────────────────────────

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)]",
        "rounded-2xl border bg-card/95 backdrop-blur-sm shadow-2xl",
        "flex flex-col overflow-hidden",
        "animate-in slide-in-from-bottom-4 fade-in duration-200"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/40">
        <div
          className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
            isSpeaking   ? "bg-emerald-500 text-white shadow-[0_0_10px_2px_rgba(16,185,129,0.5)]"
            : isListening ? "bg-red-500 text-white"
            : isConnecting ? "bg-violet-500/20 text-violet-500"
            : "bg-emerald-600/20 text-emerald-600"
          )}
        >
          {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold leading-none">Form Assistant</p>
            {usingConvai && (
              <span className="inline-flex items-center gap-0.5 text-[10px] bg-violet-500/10 text-violet-600 border border-violet-300/40 rounded-full px-1.5 py-0.5 font-medium">
                <Zap className="h-2.5 w-2.5" /> ConvAI
              </span>
            )}
            {!usingConvai && usingElevenLabs && (
              <span className="inline-flex items-center gap-0.5 text-[10px] bg-violet-500/10 text-violet-600 border border-violet-300/40 rounded-full px-1.5 py-0.5 font-medium">
                <Zap className="h-2.5 w-2.5" /> 11labs
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isConnecting ? "Connecting…" : STAGE_LABELS[stage] ?? "Ready"}
          </p>
        </div>

        {/* Live status pill */}
        {!isConnecting && (isListening || isSpeaking || isProcessing) && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {isListening  && <><span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /><span className="text-red-600 font-medium">Listening</span></>}
            {isProcessing && <><Loader2 className="h-3 w-3 animate-spin" /><span>Thinking</span></>}
            {isSpeaking && !isListening && !isProcessing && <><Volume2 className="h-3 w-3 text-emerald-500" /><span className="text-emerald-600">Speaking</span></>}
          </div>
        )}

        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={closePanel}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Message history */}
      <div className="flex-1 min-h-[140px] max-h-[260px] overflow-y-auto p-4 space-y-3 scroll-smooth">
        {isConnecting && <ConnectingOverlay />}
        {hasError     && <ErrorOverlay />}
        {!isConnecting && !hasError && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-1 py-4 text-muted-foreground">
            <Bot className="h-8 w-8 opacity-30" />
            <p className="text-xs text-center">Just speak — I'm listening.</p>
          </div>
        )}
        {!isConnecting && !hasError && messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isSpeaking={isSpeaking && i === messages.length - 1 && msg.role === "agent"}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips */}
      {!isConnecting && !hasError && (
        <div className="border-t px-3 py-2 bg-muted/10">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lightbulb className="h-3 w-3 text-amber-500 shrink-0" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Try saying</span>
            <button
              className="ml-auto text-[10px] text-amber-600 hover:text-amber-500 font-medium"
              onClick={() => setShowSuggestions((v) => !v)}
            >
              {showSuggestions ? "hide" : "show"}
            </button>
          </div>
          {showSuggestions && (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <span
                  key={s}
                  className="text-[11px] bg-muted border rounded-full px-2.5 py-0.5 text-foreground/70 cursor-default select-none"
                >
                  "{s}"
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="border-t px-4 py-3 flex items-center gap-3 bg-muted/20">
        {usingConvai ? (
          <div
            className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-200",
              isConnected && isListening  ? "bg-red-500 text-white shadow-[0_0_0_6px_rgba(239,68,68,0.15)] scale-105"
              : isConnected && isSpeaking ? "bg-emerald-600 text-white shadow-md"
              : isConnecting              ? "bg-violet-500/20 text-violet-500"
              : "bg-muted text-muted-foreground border"
            )}
          >
            {isConnecting ? <Loader2 className="h-5 w-5 animate-spin" />
             : isSpeaking  ? <Volume2 className="h-5 w-5" />
             : <Mic className={cn("h-5 w-5", isListening && "animate-pulse")} />}
          </div>
        ) : (
          <button
            onClick={toggleListening}
            disabled={isProcessing}
            className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-200",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              isListening ? "bg-red-500 text-white shadow-[0_0_0_6px_rgba(239,68,68,0.15)] scale-105"
              : isSpeaking ? "bg-emerald-600 text-white shadow-md"
              : "bg-muted hover:bg-muted/80 text-muted-foreground border hover:scale-105 active:scale-95"
            )}
          >
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" />
             : isListening  ? <Mic className="h-5 w-5 animate-pulse" />
             : <MicOff className="h-5 w-5" />}
          </button>
        )}

        <div className="flex-1 min-w-0">
          {isConnecting ? (
            <p className="text-xs font-medium text-violet-600">Starting conversation…</p>
          ) : hasError ? (
            <p className="text-xs font-medium text-destructive">Connection failed — check server config</p>
          ) : isListening ? (
            <div className="flex flex-col gap-1">
              <WaveformBars active color="bg-red-500" />
              <p className="text-xs text-red-600 font-medium">Listening…</p>
            </div>
          ) : isProcessing ? (
            <p className="text-xs font-medium">Thinking…</p>
          ) : isSpeaking ? (
            <div className="flex flex-col gap-1">
              <WaveformBars active color="bg-emerald-500" />
              <p className="text-xs text-emerald-600 font-medium">Speaking…</p>
            </div>
          ) : usingConvai && isConnected ? (
            <p className="text-xs font-medium">Ready — just speak</p>
          ) : (
            <p className="text-xs text-muted-foreground">{usingConvai ? "Say something to start" : "Click mic to resume"}</p>
          )}
        </div>
      </div>
    </div>
  );
}
