/**
 * useVoiceAgent.ts
 *
 * Voice agent with two operating modes:
 *
 *  CONVAI MODE (ElevenLabs Conversational AI):
 *    A single WebSocket session handles STT + LLM intent + TTS.
 *    The agent understands natural language natively, calls client tools,
 *    and handles multi-step commands automatically.
 *    Activated when the backend /api/convai/signed-url endpoint is reachable
 *    (i.e. ELEVENLABS_AGENT_ID + ELEVENLABS_API_KEY are configured server-side).
 *
 *  FALLBACK MODE (VAD → ElevenLabs STT → Ollama LLM → TTS):
 *    Original pipeline. Used when convai is unavailable.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  speakWithElevenLabs,
  stopElevenLabsSpeech,
  transcribeWithElevenLabs,
  startRecordingWithVAD,
  hasElevenLabsKey,
} from "./elevenlabs";
import { speak as browserSpeak, stopSpeaking as browserStop } from "./tts";
import { parseIntentWithLLM } from "./intentParser";
import type { ParseContext, VoiceAction } from "./intentParser";
import { buildContextUpdate } from "./buildAgentPrompt";
import { useActivityStore } from "../hooks/useActivityStore";
import { useFormBuilderStore } from "../hooks/useFormBuilderStore";
import { exportSchemaAsJson, downloadSchema } from "../utils/schema";
import type { UICallbacks } from "./VoiceAgentContext";
import type { FeedEntry } from "./VoiceActionFeedContext";
import type { FieldType } from "../types";
import { useConvaiAgent } from "./useConvaiAgent";

type EmitFeed = (entry: Omit<FeedEntry, "id" | "exiting">) => void;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Simple fuzzy similarity 0–1 between two strings (word-overlap based). */
function fuzzyScore(a: string, b: string): number {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.8;
  const wa = na.split(/\s+/);
  const wb = nb.split(/\s+/);
  const common = wa.filter((w) => wb.some((x) => x.startsWith(w) || w.startsWith(x)));
  return common.length / Math.max(wa.length, wb.length);
}

/** Returns a confirmation prompt for destructive actions (fallback mode only), or null if not destructive. */
function getDestructiveConfirmPrompt(
  action: VoiceAction,
  schema: { sections: { title: string; fields: { label: string }[] }[] },
  activities: { name: string }[]
): string | null {
  if (action.type === "DELETE_ACTIVITY") {
    const match = activities.find((a) => a.name.toLowerCase().includes(action.name.toLowerCase()));
    if (match) return `Delete "${match.name}"? This can't be undone. Say yes to confirm.`;
  }
  if (action.type === "RESET_FORM") {
    const fieldCount = schema.sections.reduce((n, s) => n + s.fields.length, 0);
    if (fieldCount > 0) return `Clear all ${fieldCount} fields? This can't be undone. Say yes to confirm.`;
  }
  if (action.type === "REMOVE_SECTION") {
    const sec = schema.sections.find((s) =>
      s.title.toLowerCase().includes(action.title.toLowerCase()) || fuzzyScore(s.title, action.title) >= 0.4
    );
    if (sec) {
      const n = sec.fields.length;
      const warn = n > 0 ? ` It contains ${n} field${n !== 1 ? "s" : ""} which will also be removed.` : "";
      return `Remove section "${sec.title}"?${warn} Say yes to confirm.`;
    }
  }
  if (action.type === "REMOVE_FIELD") {
    const allFields = schema.sections.flatMap((s) => s.fields);
    const field = allFields.find((f) => f.label.toLowerCase().includes(action.targetLabel.toLowerCase()));
    if (field) return `Remove "${field.label}"? Say yes to confirm.`;
  }
  return null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgentStage = "idle" | "manage-forms" | "building" | "preview" | "report-config" | "report-preview";

export interface VoiceAgentState {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  transcript: string;
  agentMessage: string;
  stage: AgentStage;
  isSupported: boolean;
  isOpen: boolean;
  usingElevenLabs: boolean;
  /** true when using ElevenLabs Conversational AI (not the fallback pipeline) */
  usingConvai: boolean;
  /** convai-only: "connecting" | "connected" | "disconnected" | "error" */
  convaiStatus: string;
}

export interface VoiceAgentActions {
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  openPanel: () => void;
  closePanel: () => void;
  setStage: (stage: AgentStage) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVoiceAgent(
  initialStage: AgentStage = "idle",
  uiCallbacksRef?: React.MutableRefObject<Partial<UICallbacks>>,
  onReportConfigReadyRef?: React.MutableRefObject<(() => void) | null>,
  emitFeedRef?: React.MutableRefObject<EmitFeed>
) {
  const emit = (entry: Omit<FeedEntry, "id" | "exiting">) => emitFeedRef?.current?.(entry);
  const navigate = useNavigate();

  const {
    activities,
    addActivity,
    toggleActivity,
    removeActivity,
    loadFromLocalStorage,
    updateActivitySchema,
  } = useActivityStore();

  const {
    schema,
    addField,
    updateField,
    removeField,
    duplicateField,
    moveField,
    setMode,
    setFormName,
    exportSchema,
    importSchema,
    addSection,
    removeSection,
    renameSection,
    undo,
    redo,
    resetForm,
  } = useFormBuilderStore();

  const [state, setState] = useState<VoiceAgentState>({
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    transcript: "",
    agentMessage: "",
    stage: initialStage,
    isSupported: !!navigator.mediaDevices?.getUserMedia,
    isOpen: false,
    usingElevenLabs: hasElevenLabsKey(),
    usingConvai: false,
    convaiStatus: "disconnected",
  });

  // Refs — keep values fresh in closures
  const stageRef = useRef<AgentStage>(initialStage);
  const activityIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const pendingRCActionsRef   = useRef<VoiceAction[]>([]);
  const pendingRPActionsRef   = useRef<VoiceAction[]>([]);
  const pendingFormActionsRef = useRef<VoiceAction[]>([]);
  /** Last field the agent touched — used to resolve "it"/"that" references */
  const lastTouchedFieldRef   = useRef<{ label: string; sectionId: string; fieldId: string } | null>(null);
  /** Last field type added — used by REPEAT_LAST_FIELD */
  const lastAddedFieldTypeRef = useRef<FieldType | null>(null);
  /** Destructive action awaiting "yes" confirmation (fallback mode) */
  const pendingConfirmationRef = useRef<{ action: VoiceAction; description: string } | null>(null);
  const shouldListenRef = useRef(false);
  const vadAbortRef = useRef<(() => void) | null>(null);
  const schemaRef = useRef(schema);
  schemaRef.current = schema;
  const activitiesRef = useRef(activities);
  activitiesRef.current = activities;

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Register flush function — fired by VoiceAgentContext when reportConfigDispatch
  // becomes available (i.e. ReportConfigPage mounts and calls registerUICallbacks)
  useEffect(() => {
    if (!onReportConfigReadyRef) return;
    onReportConfigReadyRef.current = () => {
      const fn = uiCallbacksRef?.current?.reportConfigDispatch;
      if (!fn) return;
      const pending = pendingRCActionsRef.current.splice(0);
      for (const action of pending) {
        fn(action);
      }
    };
  }, []);

  useEffect(() => { stageRef.current = state.stage; }, [state.stage]);

  const updateState = useCallback((updates: Partial<VoiceAgentState>) => {
    if (isMountedRef.current) setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // ── Theme toggle ─────────────────────────────────────────────────────────────

  const toggleTheme = useCallback((): string => {
    const isDark = document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", !isDark);
    localStorage.setItem("theme", !isDark ? "dark" : "light");
    return `Switched to ${!isDark ? "dark" : "light"} mode.`;
  }, []);

  // ── Build context ─────────────────────────────────────────────────────────

  const buildContext = useCallback((): ParseContext => {
    const s = schemaRef.current;
    return {
      stage: stageRef.current === "preview" ? "building" : stageRef.current,
      activityName: s.formName,
      sectionTitles: s.sections.map((sec) => sec.title),
      existingFields: s.sections.flatMap((sec) =>
        sec.fields.map((f) => ({
          label: f.label,
          type: f.type,
          required: f.required,
          section: sec.title,
        }))
      ),
      existingFieldLabels: s.sections.flatMap((sec) => sec.fields.map((f) => f.label)),
      activityNames: activitiesRef.current.map((a) => a.name),
      reportNames: uiCallbacksRef?.current?.getReportNames?.(),
      lastTouchedFieldLabel: lastTouchedFieldRef.current?.label,
    };
  }, []);

  // ── Dispatch action ───────────────────────────────────────────────────────
  // Returns the agent response string. Does NOT speak — caller decides
  // whether to speak immediately (single action) or batch-speak multiple.

  const dispatchAction = useCallback(async (action: VoiceAction): Promise<string> => {
    const schema = schemaRef.current;

    switch (action.type) {

      case "OPEN_ACTIVITY": {
        loadFromLocalStorage();
        const all = activitiesRef.current;
        const match = all.find((a) =>
          a.name.toLowerCase().includes(action.name.toLowerCase()) ||
          action.name.toLowerCase().includes(a.name.toLowerCase())
        );
        if (match) {
          activityIdRef.current = match.id;
          setTimeout(() => navigate(`/form-builder/${match.id}`), 600);
          // F1: proactive field summary from stored schema
          const allFields = match.schema.sections.flatMap((s) => s.fields);
          const summary = allFields.length
            ? ` It has ${allFields.length} field${allFields.length !== 1 ? "s" : ""}: ${allFields.map((f) => f.label).join(", ")}.`
            : " It's empty — want me to suggest some fields?";
          return `Opening "${match.name}".${summary}`;
        }
        // F6: fuzzy match suggestion
        const best = all.reduce<{ name: string; score: number }>(
          (b, a) => { const s = fuzzyScore(a.name, action.name); return s > b.score ? { name: a.name, score: s } : b; },
          { name: "", score: 0 }
        );
        if (best.score >= 0.35) {
          pendingConfirmationRef.current = { action: { type: "OPEN_ACTIVITY", name: best.name }, description: `open "${best.name}"` };
          return `I couldn't find "${action.name}". Did you mean "${best.name}"? Say yes to open it.`;
        }
        const names = all.map((a) => a.name).join(", ");
        return `I couldn't find "${action.name}". Available: ${names || "none yet"}.`;
      }

      case "TOGGLE_ACTIVITY": {
        loadFromLocalStorage();
        const match = activitiesRef.current.find((a) =>
          a.name.toLowerCase().includes(action.name.toLowerCase())
        );
        if (match) {
          toggleActivity(match.id);
          return `"${match.name}" is now ${!match.enabled ? "enabled" : "disabled"}.`;
        }
        return `Couldn't find "${action.name}".`;
      }

      case "DELETE_ACTIVITY": {
        loadFromLocalStorage();
        const match = activitiesRef.current.find((a) =>
          a.name.toLowerCase().includes(action.name.toLowerCase())
        );
        if (!match) return `Couldn't find "${action.name}".`;
        removeActivity(match.id);
        toast.success(`"${match.name}" removed`);
        emit({ icon: "trash", label: `Deleted "${match.name}"`, color: "red" });
        return `"${match.name}" deleted.`;
      }

      case "LIST_ACTIVITIES": {
        loadFromLocalStorage();
        const all = activitiesRef.current;
        if (!all.length) return "No activities yet. Say 'create a merchandising form' to get started.";
        const enabled  = all.filter((a) => a.enabled).map((a) => a.name);
        const disabled = all.filter((a) => !a.enabled).map((a) => a.name);
        let msg = `You have ${all.length} activit${all.length > 1 ? "ies" : "y"}.`;
        if (enabled.length)  msg += ` Active: ${enabled.join(", ")}.`;
        if (disabled.length) msg += ` Inactive: ${disabled.join(", ")}.`;
        return msg;
      }

      case "CREATE_ACTIVITY": {
        loadFromLocalStorage();
        const activity = addActivity(action.name, action.description);
        activityIdRef.current = activity.id;
        importSchema(activity.schema);
        toast.success(`Activity "${activity.name}" created`);
        emit({ icon: "file-plus", label: `Created "${activity.name}"`, color: "blue" });
        updateState({ stage: "building" });
        stageRef.current = "building";
        setTimeout(() => navigate(`/form-builder/${activity.id}`), 900);
        // Detect topic from name so the agent can offer a relevant SUGGEST_FIELDS
        const nameLower = action.name.toLowerCase();
        const TOPIC_HINTS: Record<string, string> = {
          outlet: "outlet", visit: "outlet", store: "outlet",
          sales: "sales", order: "sales", customer: "sales",
          stock: "stock", audit: "stock", inventory: "stock",
          survey: "survey", feedback: "survey", tracking: "survey",
          competition: "survey", competitor: "survey",
          merchandising: "merchandising", merch: "merchandising", display: "merchandising",
        };
        const detectedTopic = Object.keys(TOPIC_HINTS).find((k) => nameLower.includes(k));
        const topicHint = detectedTopic ? TOPIC_HINTS[detectedTopic] : null;
        const followUp = topicHint
          ? `This looks like a ${topicHint} form. Want me to add suggested fields for it? Just say yes.`
          : `Want me to suggest some fields for it, or tell me what fields you need?`;
        return `"${activity.name}" created! ${followUp}`;
      }

      case "ADD_FIELD": {
        const sections = schemaRef.current.sections;
        if (!sections.length) {
          // Form not loaded yet — queue if we're navigating to one (OPEN_ACTIVITY was just called)
          if (activityIdRef.current) {
            pendingFormActionsRef.current.push(action);
            return `Got it. I'll add the ${action.label || action.fieldType} field once the form loads.`;
          }
          return "No sections found. Please open a form first.";
        }
        const sectionId = sections[0].id;
        // F2: track for memory
        lastAddedFieldTypeRef.current = action.fieldType as FieldType;
        addField(sectionId, action.fieldType as FieldType);
        setTimeout(() => {
          const updated = useFormBuilderStore.getState().schema.sections;
          const sec     = updated.find((s) => s.id === sectionId);
          const newField = sec?.fields[sec.fields.length - 1];
          if (newField) {
            const updates: Record<string, any> = {};
            if (action.label)            updates.label    = action.label;
            if (action.options?.length)  updates.options  = action.options;
            if (action.required !== undefined) updates.required = action.required;
            if (Object.keys(updates).length > 0) updateField(sectionId, newField.id, updates);
            // F2: update last-touched ref
            lastTouchedFieldRef.current = { label: action.label || newField.label, sectionId, fieldId: newField.id };
            uiCallbacksRef?.current?.onVoiceFieldAdded?.(newField.id);
            emit({ icon: "plus", label: `Added "${action.label || action.fieldType}" field`, color: "emerald" });
          }
          const actId = activityIdRef.current;
          if (actId) updateActivitySchema(actId, useFormBuilderStore.getState().schema);
        }, 50);
        // F1: proactive follow-up for choice fields with no options
        const isChoice = ["dropdown", "multiselect", "radio"].includes(action.fieldType);
        const hasOptions = action.options && action.options.length > 0;
        const followUp = isChoice && !hasOptions
          ? ` Want me to add some options? Just say the options or "add options Yes, No, Maybe".`
          : ` Say "make it required" or add another field.`;
        return `Added ${action.label || action.fieldType} field.${followUp}`;
      }

      case "REMOVE_FIELD": {
        if (!schemaRef.current.sections.length && activityIdRef.current) {
          pendingFormActionsRef.current.push(action);
          return `Got it. I'll remove "${action.targetLabel}" once the form loads.`;
        }
        const allSections = schema.sections;
        // Exact / substring match first
        for (const section of allSections) {
          const field = section.fields.find((f) =>
            f.label.toLowerCase().includes(action.targetLabel.toLowerCase())
          );
          if (field) {
            removeField(section.id, field.id);
            lastTouchedFieldRef.current = null;
            emit({ icon: "trash", label: `Removed "${field.label}"`, color: "red" });
            return `Removed "${field.label}". Say "undo" if you change your mind.`;
          }
        }
        // F6: fuzzy fallback
        const allFields = allSections.flatMap((s) => s.fields.map((f) => ({ ...f, sectionId: s.id })));
        const best = allFields.reduce<{ label: string; score: number }>(
          (b, f) => { const sc = fuzzyScore(f.label, action.targetLabel); return sc > b.score ? { label: f.label, score: sc } : b; },
          { label: "", score: 0 }
        );
        if (best.score >= 0.35) {
          pendingConfirmationRef.current = { action: { ...action, targetLabel: best.label, _confirmed: true } as any, description: `remove "${best.label}"` };
          return `I couldn't find "${action.targetLabel}". Did you mean "${best.label}"? Say yes to remove it.`;
        }
        return `Couldn't find "${action.targetLabel}".`;
      }

      case "UPDATE_FIELD_PROP": {
        if (!schemaRef.current.sections.length && activityIdRef.current) {
          pendingFormActionsRef.current.push(action);
          return `Got it. I'll update that field once the form loads.`;
        }
        // F2: resolve "it"/"that" (empty targetLabel) from memory
        const resolvedLabel = action.targetLabel || lastTouchedFieldRef.current?.label;
        for (const section of schema.sections) {
          const field = section.fields.find((f) =>
            !resolvedLabel || f.label.toLowerCase().includes(resolvedLabel.toLowerCase())
          );
          if (field) {
            updateField(section.id, field.id, { [action.prop]: action.value } as any);
            lastTouchedFieldRef.current = { label: field.label, sectionId: section.id, fieldId: field.id };
            uiCallbacksRef?.current?.onVoiceFieldAdded?.(field.id);
            emit({ icon: "pencil", label: `"${field.label}" — ${action.prop} updated`, color: "amber" });
            return `Updated "${field.label}" — ${action.prop} set to ${action.value}.`;
          }
        }
        // F6: fuzzy fallback when a label was given but not found
        if (resolvedLabel) {
          const allFields = schema.sections.flatMap((s) => s.fields.map((f) => ({ ...f, sectionId: s.id })));
          const best = allFields.reduce<{ field: typeof allFields[0] | null; score: number }>(
            (b, f) => { const sc = fuzzyScore(f.label, resolvedLabel); return sc > b.score ? { field: f, score: sc } : b; },
            { field: null, score: 0 }
          );
          if (best.field && best.score >= 0.35) {
            updateField(best.field.sectionId, best.field.id, { [action.prop]: action.value } as any);
            lastTouchedFieldRef.current = { label: best.field.label, sectionId: best.field.sectionId, fieldId: best.field.id };
            return `Updated "${best.field.label}" — ${action.prop} set to ${action.value}.`;
          }
        }
        return lastTouchedFieldRef.current
          ? `Couldn't find "${resolvedLabel}". Last field I touched was "${lastTouchedFieldRef.current.label}".`
          : "Couldn't find that field.";
      }

      case "SET_FIELD_OPTIONS": {
        if (!schemaRef.current.sections.length && activityIdRef.current) {
          pendingFormActionsRef.current.push(action);
          return `Got it. I'll set the options once the form loads.`;
        }
        for (const section of schema.sections) {
          const field = section.fields.find((f) => f.label.toLowerCase().includes(action.targetLabel.toLowerCase()));
          if (field) {
            updateField(section.id, field.id, { options: action.options, dataSource: { type: "static" } });
            lastTouchedFieldRef.current = { label: field.label, sectionId: section.id, fieldId: field.id };
            emit({ icon: "list", label: `Options set on "${field.label}"`, color: "amber" });
            return `Set ${action.options.length} options on "${field.label}": ${action.options.join(", ")}.`;
          }
        }
        return `Couldn't find field "${action.targetLabel}".`;
      }

      case "SET_FIELD_DATASOURCE": {
        if (!schemaRef.current.sections.length && activityIdRef.current) {
          pendingFormActionsRef.current.push(action);
          return `Got it. I'll configure the data source once the form loads.`;
        }
        for (const section of schema.sections) {
          const field = section.fields.find((f) => f.label.toLowerCase().includes(action.targetLabel.toLowerCase()));
          if (field) {
            const ds = action.source === "api"
              ? { type: "api" as const, apiEndpoint: action.apiEndpoint, method: action.method ?? "GET", responseKey: action.responseKey, labelKey: action.labelKey, valueKey: action.valueKey, headers: action.headers }
              : { type: "static" as const };
            updateField(section.id, field.id, { dataSource: ds });
            lastTouchedFieldRef.current = { label: field.label, sectionId: section.id, fieldId: field.id };
            emit({ icon: "database", label: `Data source set on "${field.label}"`, color: "blue" });
            return action.source === "api"
              ? `"${field.label}" will load options from ${action.apiEndpoint}.`
              : `"${field.label}" set to static options.`;
          }
        }
        return `Couldn't find field "${action.targetLabel}".`;
      }

      case "SET_FIELD_VALIDATION": {
        if (!schemaRef.current.sections.length && activityIdRef.current) {
          pendingFormActionsRef.current.push(action);
          return `Got it. I'll set the validation once the form loads.`;
        }
        for (const section of schema.sections) {
          const field = section.fields.find((f) => f.label.toLowerCase().includes(action.targetLabel.toLowerCase()));
          if (field) {
            const v: Record<string, unknown> = { ...field.validation };
            if (action.min        !== undefined) v.min = action.min;
            if (action.max        !== undefined) v.max = action.max;
            if (action.minLength  !== undefined) v.minLength = action.minLength;
            if (action.maxLength  !== undefined) v.maxLength = action.maxLength;
            if (action.step       !== undefined) v.step = action.step;
            if (action.pattern    !== undefined) v.pattern = action.pattern;
            if (action.patternMessage !== undefined) v.patternMessage = action.patternMessage;
            updateField(section.id, field.id, { validation: v as any });
            lastTouchedFieldRef.current = { label: field.label, sectionId: section.id, fieldId: field.id };
            emit({ icon: "shield", label: `Validation updated on "${field.label}"`, color: "amber" });
            return `Validation updated on "${field.label}".`;
          }
        }
        return `Couldn't find field "${action.targetLabel}".`;
      }

      case "SET_FIELD_PREFILL": {
        if (!schemaRef.current.sections.length && activityIdRef.current) {
          pendingFormActionsRef.current.push(action);
          return `Got it. I'll set the prefill once the form loads.`;
        }
        for (const section of schema.sections) {
          const field = section.fields.find((f) => f.label.toLowerCase().includes(action.targetLabel.toLowerCase()));
          if (field) {
            updateField(section.id, field.id, { prefill: { apiEndpoint: action.apiEndpoint, method: action.method ?? "GET", responseKey: action.responseKey } });
            lastTouchedFieldRef.current = { label: field.label, sectionId: section.id, fieldId: field.id };
            emit({ icon: "zap", label: `Prefill set on "${field.label}"`, color: "purple" });
            return `"${field.label}" will be prefilled from ${action.apiEndpoint}.`;
          }
        }
        return `Couldn't find field "${action.targetLabel}".`;
      }

      case "SET_FIELD_CONDITION": {
        if (!schemaRef.current.sections.length && activityIdRef.current) {
          pendingFormActionsRef.current.push(action);
          return `Got it. I'll set the condition once the form loads.`;
        }
        for (const section of schema.sections) {
          const field = section.fields.find((f) => f.label.toLowerCase().includes(action.targetLabel.toLowerCase()));
          if (field) {
            if (action.clear) {
              updateField(section.id, field.id, { condition: null });
              return `Removed condition from "${field.label}".`;
            }
            // Find the trigger field by label
            const allFields = schema.sections.flatMap((s) => s.fields);
            const trigger = action.conditionFieldLabel
              ? allFields.find((f) => f.label.toLowerCase().includes(action.conditionFieldLabel!.toLowerCase()))
              : null;
            if (!trigger) return `Couldn't find trigger field "${action.conditionFieldLabel}".`;
            updateField(section.id, field.id, { condition: { fieldId: trigger.id, operator: action.operator ?? "equals", value: action.value ?? "" } });
            lastTouchedFieldRef.current = { label: field.label, sectionId: section.id, fieldId: field.id };
            emit({ icon: "git-branch", label: `Condition set on "${field.label}"`, color: "purple" });
            return `"${field.label}" will show when "${trigger.label}" ${action.operator ?? "equals"} "${action.value}".`;
          }
        }
        return `Couldn't find field "${action.targetLabel}".`;
      }

      case "ADD_SECTION": {
        addSection(action.title);
        emit({ icon: "layout", label: action.title ? `Section "${action.title}" added` : "New section added", color: "slate" });
        return `Added${action.title ? ` "${action.title}"` : " a new"} section.`;
      }

      case "REMOVE_SECTION": {
        const sec = schemaRef.current.sections.find((s) =>
          s.title.toLowerCase().includes(action.title.toLowerCase()) ||
          fuzzyScore(s.title, action.title) >= 0.4
        );
        if (!sec) return `Couldn't find a section matching "${action.title}".`;
        // Flash section red so the user sees which one is about to go
        uiCallbacksRef?.current?.onVoiceSectionRemove?.(sec.id);
        await new Promise((res) => setTimeout(res, 450));
        removeSection(sec.id);
        emit({ icon: "trash", label: `Section "${sec.title}" removed`, color: "red" });
        return `Section "${sec.title}" removed. Say "undo" if you change your mind.`;
      }

      case "MOVE_FIELD_TO_SECTION": {
        if (!schemaRef.current.sections.length && activityIdRef.current) {
          pendingFormActionsRef.current.push(action);
          return `Got it. I'll move those fields once the form loads.`;
        }
        const currentSchema = schemaRef.current;

        // Resolve target section — existing or create new
        let targetSection = action.targetSectionTitle
          ? currentSchema.sections.find((s) => s.title.toLowerCase().includes(action.targetSectionTitle!.toLowerCase()))
          : null;

        if (!targetSection) {
          const newTitle = action.newSectionTitle || action.targetSectionTitle || "New Section";
          addSection(newTitle);
          // addSection is sync in the store — read back immediately
          const updated = useFormBuilderStore.getState().schema.sections;
          targetSection = updated[updated.length - 1];
        }

        if (!targetSection) return "Couldn't create the target section.";

        // Find and move each field
        const moved: string[] = [];
        const notFound: string[] = [];

        for (const label of action.fieldLabels) {
          // Read fresh schema each iteration (sections change after each move)
          const live = useFormBuilderStore.getState().schema;
          let found = false;
          for (const sec of live.sections) {
            if (sec.id === targetSection.id) continue; // already there
            const field = sec.fields.find((f) =>
              f.label.toLowerCase().includes(label.toLowerCase()) ||
              fuzzyScore(f.label, label) >= 0.5
            );
            if (field) {
              const targetIdx = useFormBuilderStore.getState().schema.sections
                .find((s) => s.id === targetSection!.id)?.fields.length ?? 0;
              moveField(sec.id, targetSection.id, field.id, targetIdx);
              moved.push(field.label);
              found = true;
              break;
            }
          }
          if (!found) notFound.push(label);
        }

        if (!moved.length) return `Couldn't find fields: ${notFound.join(", ")}.`;

        // Highlight the target section so the user sees where the fields landed
        uiCallbacksRef?.current?.onVoiceSectionHighlight?.(targetSection.id);
        // Also highlight the last moved field within that section
        const freshSchema = useFormBuilderStore.getState().schema;
        const freshTarget = freshSchema.sections.find((s) => s.id === targetSection.id);
        const lastMovedField = freshTarget?.fields.find((f) => f.label === moved[moved.length - 1]);
        if (lastMovedField) uiCallbacksRef?.current?.onVoiceFieldAdded?.(lastMovedField.id);

        emit({ icon: "arrow-right", label: `Moved ${moved.length} field${moved.length !== 1 ? "s" : ""} to "${targetSection.title}"`, color: "blue" });
        const result = `Moved ${moved.join(", ")} to "${targetSection.title}".`;
        return notFound.length ? `${result} Couldn't find: ${notFound.join(", ")}.` : result;
      }

      case "RENAME_SECTION": {
        const sec = schema.sections.find((s) =>
          !action.currentTitle || s.title.toLowerCase().includes(action.currentTitle.toLowerCase())
        );
        if (sec) {
          renameSection(sec.id, action.newTitle);
          uiCallbacksRef?.current?.onVoiceSectionHighlight?.(sec.id);
          emit({ icon: "pencil", label: `Section renamed to "${action.newTitle}"`, color: "amber" });
          return `Renamed section to "${action.newTitle}".`;
        }
        return "Couldn't find that section.";
      }

      case "SET_MODE": {
        setMode(action.mode);
        updateState({ stage: action.mode === "preview" ? "preview" : "building" });
        return action.mode === "preview"
          ? "Here's your preview. Say 'save' when happy, or tell me what to change."
          : "Back to build mode. What would you like to change?";
      }

      case "SAVE": {
        const currentSchema = exportSchema();
        const id = activityIdRef.current || window.location.pathname.split("/form-builder/")[1];
        if (id) updateActivitySchema(id, currentSchema);
        toast.success("Form saved!");
        emit({ icon: "save", label: "Form saved", color: "emerald" });
        uiCallbacksRef?.current?.onVoiceSave?.();
        const fieldCount = currentSchema.sections.reduce((n, s) => n + s.fields.length, 0);
        const formName = currentSchema.formName || "New Form";

        // Auto-create a report with the same name as the form.
        // Always queue via pendingRCActionsRef + navigate — even if a stale
        // reportConfigDispatch reference exists from a previous visit, calling
        // it would target an unmounted component. Pending actions flush
        // automatically when ReportConfigPage mounts and re-registers.
        const rcCreate = { type: "RC_CREATE_REPORT" } as VoiceAction;
        const rcName   = { type: "RC_SET_DISPLAY_NAME", value: formName } as VoiceAction;
        pendingRCActionsRef.current.push(rcCreate, rcName);
        setTimeout(() => navigate("/report-preview"), 800);

        return `Saved "${formName}" with ${fieldCount} field${fieldCount !== 1 ? "s" : ""}! I've also created a report for it. Want me to suggest some configurations? Say "yes suggest config" or tell me what to set up.`;
      }

      case "UNDO": { undo(); return "Undone."; }
      case "REDO": { redo(); return "Redone."; }

      case "RESET_FORM": {
        resetForm();
        lastTouchedFieldRef.current = null;
        lastAddedFieldTypeRef.current = null;
        return "Form cleared. Start adding fields whenever you're ready.";
      }

      case "NAVIGATE": {
        const label = action.route === "/manage-forms" ? "manage forms" : action.route.replace("/", "");
        emit({ icon: "arrow-right", label: `Navigating to ${label}`, color: "slate" });
        setTimeout(() => navigate(action.route), 600);
        return `Navigating to ${label}.`;
      }

      case "TOGGLE_THEME": return toggleTheme();

      case "GO_BACK": {
        setTimeout(() => navigate(-1 as any), 600);
        return "Going back.";
      }

      case "SETUP_REPORT": {
        const actId = activityIdRef.current || window.location.pathname.split("/form-builder/")[1];
        if (actId) updateActivitySchema(actId, exportSchema());
        toast.success("Opening reports…");
        setTimeout(() => navigate("/report-preview"), 700);
        return "Sure! Taking you to the reports section.";
      }

      case "SKIP_REPORT":
        return "No problem! You can set up the report later from the portal.";

      case "SHOW_JSON": {
        uiCallbacksRef?.current?.openJsonDialog?.();
        return "Here's the JSON schema for your form. I've opened it for you.";
      }

      case "COPY_JSON": {
        const copyFn = uiCallbacksRef?.current?.copyJsonToClipboard;
        if (copyFn) { await copyFn(); }
        else {
          await navigator.clipboard.writeText(exportSchemaAsJson(exportSchema()));
          toast.success("JSON copied to clipboard");
        }
        return "JSON copied to clipboard.";
      }

      case "DOWNLOAD_FORM": {
        const dlFn = uiCallbacksRef?.current?.downloadForm;
        dlFn ? dlFn() : downloadSchema(exportSchema());
        toast.success("Form downloaded!");
        return "Form JSON downloaded.";
      }

      case "LIST_FIELDS": {
        const allFields = schema.sections.flatMap((s) => s.fields.map((f) => f.label));
        if (!allFields.length) return "No fields yet. Say 'add a text field' to get started.";
        return `Your form has ${allFields.length} field${allFields.length > 1 ? "s" : ""}: ${allFields.join(", ")}.`;
      }

      case "COUNT_FIELDS": {
        const total = schema.sections.reduce((acc, s) => acc + s.fields.length, 0);
        return `Your form has ${total} field${total !== 1 ? "s" : ""} across ${schema.sections.length} section${schema.sections.length !== 1 ? "s" : ""}.`;
      }

      case "RENAME_FORM": {
        setFormName(action.newName);
        emit({ icon: "pencil", label: `Renamed to "${action.newName}"`, color: "amber" });
        return `Form renamed to "${action.newName}".`;
      }

      case "DUPLICATE_FIELD": {
        for (const section of schema.sections) {
          const field = section.fields.find((f) =>
            f.label.toLowerCase().includes(action.targetLabel.toLowerCase())
          );
          if (field) {
            duplicateField(section.id, field.id);
            lastTouchedFieldRef.current = { label: field.label, sectionId: section.id, fieldId: field.id };
            emit({ icon: "copy", label: `Duplicated "${field.label}"`, color: "blue" });
            return `Duplicated "${field.label}" field.`;
          }
        }
        return `Couldn't find "${action.targetLabel}".`;
      }

      // F2: repeat the last added field type N times
      case "REPEAT_LAST_FIELD": {
        const ft = lastAddedFieldTypeRef.current;
        if (!ft) return "I don't know what field to repeat — add a field first.";
        const count = Math.min(action.count ?? 1, 10);
        const results: string[] = [];
        for (let i = 0; i < count; i++) {
          const msg = await dispatchAction({ type: "ADD_FIELD", fieldType: ft });
          results.push(msg);
        }
        return count === 1 ? results[0] : `Added ${count} more ${ft} fields.`;
      }

      case "ANSWER": return action.text;

      // ── T2: Clone activity ────────────────────────────────────────────
      case "CLONE_ACTIVITY": {
        loadFromLocalStorage();
        const match = activitiesRef.current.find((a) =>
          a.name.toLowerCase().includes(action.name.toLowerCase())
        );
        if (!match) return `Can't find "${action.name}". Say "list activities" to see all.`;
        const newName = action.newName || `${match.name} (Copy)`;
        const cloned = addActivity(newName, (match as any).description || "");
        updateActivitySchema(cloned.id, match.schema);
        toast.success(`"${newName}" created`);
        emit({ icon: "copy", label: `Cloned as "${newName}"`, color: "blue" });
        return `Cloned "${match.name}" as "${newName}". Want to open it and customize the fields?`;
      }

      // ── T2: Suggest fields from template ─────────────────────────────
      case "SUGGEST_FIELDS": {
        const sections = schemaRef.current.sections;
        if (!sections.length) return "No sections found. Add a section first.";
        const sectionId = sections[0].id;
        const topic = (action.topic || schemaRef.current.formName || "").toLowerCase();

        type FieldTemplate = { fieldType: FieldType; label: string };
        const TEMPLATES: Record<string, FieldTemplate[]> = {
          outlet:  [
            { fieldType: "text",     label: "Outlet Name" },
            { fieldType: "location", label: "GPS Location" },
            { fieldType: "camera",   label: "Outlet Photo" },
            { fieldType: "dropdown", label: "Outlet Category" },
          ],
          sales:   [
            { fieldType: "text",     label: "Customer Name" },
            { fieldType: "tel",      label: "Phone Number" },
            { fieldType: "number",   label: "Order Quantity" },
            { fieldType: "dropdown", label: "Product" },
            { fieldType: "date",     label: "Delivery Date" },
          ],
          stock:   [
            { fieldType: "text",     label: "Product Name" },
            { fieldType: "number",   label: "Stock Count" },
            { fieldType: "camera",   label: "Shelf Photo" },
            { fieldType: "dropdown", label: "Category" },
          ],
          survey:  [
            { fieldType: "text",     label: "Respondent Name" },
            { fieldType: "radio",    label: "Overall Rating" },
            { fieldType: "textarea", label: "Comments" },
            { fieldType: "checkbox", label: "Consent Given" },
          ],
          merchandising: [
            { fieldType: "camera",   label: "Shelf Photo" },
            { fieldType: "dropdown", label: "Display Type" },
            { fieldType: "number",   label: "Facings Count" },
            { fieldType: "checkbox", label: "Planogram Compliant" },
            { fieldType: "textarea", label: "Remarks" },
          ],
        };

        const key = Object.keys(TEMPLATES).find((k) => topic.includes(k)) || "outlet";
        const fields = TEMPLATES[key];
        for (const f of fields) {
          addField(sectionId, f.fieldType);
          // label update via store read after tick
        }
        // Apply labels after batch add
        setTimeout(() => {
          const updated = useFormBuilderStore.getState().schema.sections;
          const sec = updated.find((s) => s.id === sectionId);
          if (!sec) return;
          const addedFields = sec.fields.slice(-fields.length);
          addedFields.forEach((field, idx) => {
            updateField(sectionId, field.id, { label: fields[idx].label });
          });
          // Highlight the section (bulk add) and the last field
          uiCallbacksRef?.current?.onVoiceSectionHighlight?.(sectionId);
          const last = addedFields[addedFields.length - 1];
          if (last) uiCallbacksRef?.current?.onVoiceFieldAdded?.(last.id);
        }, 100);

        emit({ icon: "wand", label: `Added ${fields.length} suggested fields`, color: "purple" });
        const fieldNames = fields.map((f) => f.label).join(", ");
        return `Added ${fields.length} fields: ${fieldNames}. Does this look good? Say "yes save it", "make all required", or tell me what to change.`;
      }

      // ── T2: Validate form before save ────────────────────────────────
      case "VALIDATE_FORM": {
        const allFields = schemaRef.current.sections.flatMap((s) => s.fields);
        if (!allFields.length) return "Form has no fields. Add some fields first.";
        const noOptions = allFields.filter(
          (f) =>
            (f.type === "dropdown" || f.type === "radio" || f.type === "multiselect") &&
            (!f.options || (f.options as any[]).length === 0)
        );
        if (noOptions.length)
          return `${noOptions.length} choice field(s) have no options: ${noOptions.map((f) => f.label).join(", ")}. Say "add option to <field>" to fix.`;
        return `Form looks good! ${allFields.length} field${allFields.length > 1 ? "s" : ""} across ${schemaRef.current.sections.length} section${schemaRef.current.sections.length > 1 ? "s" : ""} — ready to save.`;
      }

      // ── Report Config screen (RC_*) ──────────────────────────────────
      // Delegate to the ReportConfigPage callback registered via registerUICallbacks.
      default: {
        if (typeof action.type === "string" && action.type.startsWith("RC_")) {
          // Emit feed pill for key RC actions
          if (action.type === "RC_CREATE_REPORT")
            emit({ icon: "bar-chart", label: "Report created", color: "blue" });
          else if (action.type === "RC_SAVE_CONFIG")
            emit({ icon: "check", label: "Report config saved", color: "emerald" });
          else if (action.type === "RC_SUGGEST_CONFIG")
            emit({ icon: "wand", label: "Config suggestions applied", color: "purple" });
          else if (action.type === "RC_TOGGLE_FLAG")
            emit({ icon: "toggle", label: `${action.flag} ${action.value ? "enabled" : "disabled"}`, color: "amber" });
          else if (action.type === "RC_CLONE_REPORT")
            emit({ icon: "copy", label: `Cloned report`, color: "blue" });

          const fn = uiCallbacksRef?.current?.reportConfigDispatch;
          // Only call the stored callback when report-config is the active screen.
          // Without this check a stale callback from a previous visit would be
          // called after the component unmounted, silently doing nothing and
          // skipping the queue so the action is lost on the second visit.
          if (fn && stageRef.current === "report-config") return fn(action);
          // Not on report-config — queue and navigate
          pendingRCActionsRef.current.push(action);
          if (window.location.pathname !== "/report-preview" && window.location.pathname !== "/report-config") {
            setTimeout(() => navigate("/report-preview"), 700);
            return "Navigating to reports. I'll execute that once we arrive.";
          }
          return "Report config is loading, please wait a moment.";
        }
        if (typeof action.type === "string" && action.type.startsWith("RP_")) {
          // Emit feed pill for key RP actions
          if (action.type === "RP_PREVIEW")
            emit({ icon: "filter", label: "Showing report data", color: "blue" });
          else if (action.type === "RP_RESET_FILTERS")
            emit({ icon: "rotate-ccw", label: "Filters cleared", color: "slate" });
          else if (action.type === "RP_FILTER")
            emit({ icon: "filter", label: `Filter: ${action.dimension} = ${action.value}`, color: "blue" });
          else if (action.type === "RP_SELECT_REPORT")
            emit({ icon: "bar-chart", label: `Switched to "${action.name}"`, color: "slate" });

          const fn = uiCallbacksRef?.current?.reportPreviewDispatch;
          // Same stale-callback guard as RC_* above — only call if on the right screen.
          if (fn && stageRef.current === "report-preview") return fn(action);
          // Not on preview page yet — queue and navigate; flush fires when page mounts
          pendingRPActionsRef.current.push(action);
          if (window.location.pathname !== "/report-preview") {
            setTimeout(() => navigate("/report-preview"), 700);
            return "Navigating to report preview. I'll execute that once we arrive.";
          }
          return "Report preview is loading, please wait a moment.";
        }
        return "Didn't catch that. Try 'add text field and image picker', 'edit merchandising form', or 'show JSON'.";
      }
    }
  }, [
    addActivity, toggleActivity, removeActivity,
    addField, removeField, updateField, duplicateField, moveField, addSection, removeSection, renameSection,
    setMode, setFormName, exportSchema, importSchema, undo, redo, resetForm,
    updateActivitySchema, loadFromLocalStorage, navigate, toggleTheme, updateState, uiCallbacksRef,
    // new T2/T3 actions also depend on these — included above already
  ]);

  // Stable ref so the flush effect below doesn't need dispatchAction in its deps
  const dispatchActionRef = useRef(dispatchAction);
  useEffect(() => { dispatchActionRef.current = dispatchAction; });

  // Flush pending form-edit actions when FormBuilder mounts (setStage("building") fires).
  // 450ms delay lets FormBuilder's importSchema useEffect run before we add fields.
  useEffect(() => {
    if (state.stage !== "building") return;
    const pending = pendingFormActionsRef.current.splice(0);
    if (!pending.length) return;
    const timer = setTimeout(async () => {
      for (const a of pending) {
        await dispatchActionRef.current(a);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [state.stage]);

  // Flush pending RP_* actions when ReportPreviewPage mounts (setStage("report-preview") fires).
  // 450ms delay lets reportPreviewDispatch register before we dispatch.
  useEffect(() => {
    if (state.stage !== "report-preview") return;
    const pending = pendingRPActionsRef.current.splice(0);
    if (!pending.length) return;
    const timer = setTimeout(async () => {
      for (const a of pending) {
        await dispatchActionRef.current(a);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [state.stage]);

  // ─── Convai integration ────────────────────────────────────────────────────

  const { convaiState, startConvai, stopConvai, sendContextUpdate } = useConvaiAgent(dispatchAction, buildContext);

  // Use a ref so the mirroring effect always has the latest value without
  // a stale closure — avoids the "usingConvai is false during connection" race.
  const usingConvaiRef = useRef(false);

  // Mirror convai state into VoiceAgentState whenever it changes
  useEffect(() => {
    console.log("[VoiceAgent] convaiState changed:", convaiState, "| usingConvaiRef:", usingConvaiRef.current);
    if (!usingConvaiRef.current) return;
    updateState({
      isListening:  convaiState.mode === "listening" && convaiState.status === "connected",
      isSpeaking:   convaiState.mode === "speaking",
      isProcessing: convaiState.status === "connecting",
      transcript:   convaiState.transcript,
      agentMessage: convaiState.agentMessage,
      convaiStatus: convaiState.status,
    });
  }, [convaiState, updateState]);

  // ─── Fallback: speak helper ────────────────────────────────────────────────

  const listenContinuouslyRef = useRef<() => void>(() => {});

  const agentSay = useCallback(async (message: string) => {
    updateState({ agentMessage: message, isSpeaking: true, isListening: false });
    if (vadAbortRef.current) { vadAbortRef.current(); vadAbortRef.current = null; }

    if (hasElevenLabsKey()) {
      try {
        await speakWithElevenLabs(message);
      } catch {
        browserSpeak(message, { rate: 1.05 });
        await new Promise((r) => setTimeout(r, Math.max(1500, message.length * 60)));
      }
    } else {
      browserSpeak(message, { rate: 1.05 });
      await new Promise((r) => setTimeout(r, Math.max(1500, message.length * 60)));
    }

    if (!isMountedRef.current) return;
    updateState({ isSpeaking: false });

    if (shouldListenRef.current) {
      setTimeout(() => {
        if (shouldListenRef.current && isMountedRef.current) {
          listenContinuouslyRef.current();
        }
      }, 300);
    }
  }, [updateState]);

  const stopAll = useCallback(() => {
    stopElevenLabsSpeech();
    browserStop();
  }, []);

  // ─── Fallback: listen loop (VAD → STT → parse → dispatch) ─────────────────

  const listenContinuously = useCallback(async () => {
    if (!shouldListenRef.current || !isMountedRef.current) return;
    if (state.isSpeaking || state.isProcessing) return;

    try {
      updateState({ isListening: true, transcript: "" });

      const { result, abort } = await startRecordingWithVAD({
        silenceThreshold: 0.01,
        silenceDuration: 1200,
        maxDuration: 15000,
        minDuration: 400,
      });

      vadAbortRef.current = abort;
      const { blob } = await result;
      vadAbortRef.current = null;

      if (!shouldListenRef.current || !isMountedRef.current) return;

      updateState({ isListening: false, isProcessing: true, transcript: "Transcribing…" });

      const text = await transcribeWithElevenLabs(blob);

      if (!text || !shouldListenRef.current) {
        updateState({ isProcessing: false, transcript: "" });
        if (shouldListenRef.current) {
          setTimeout(() => listenContinuouslyRef.current(), 500);
        }
        return;
      }

      updateState({ transcript: text });

      const authCookie = localStorage.getItem("auth_cookie");
      const token = authCookie ? JSON.parse(authCookie).token : null;
      const authToken = token || localStorage.getItem("auth_token") || null;

      // F10: intercept "yes/no" for pending destructive confirmation
      if (pendingConfirmationRef.current) {
        const isYes = /\b(yes|yeah|yep|confirm|do it|go ahead|ok|sure)\b/i.test(text);
        const isNo  = /\b(no|nope|cancel|stop|nevermind|never mind)\b/i.test(text);
        if (isYes) {
          const { action: pendingAction } = pendingConfirmationRef.current;
          pendingConfirmationRef.current = null;
          updateState({ isProcessing: false });
          const msg = await dispatchAction(pendingAction);
          await agentSay(msg);
          return;
        }
        if (isNo) {
          pendingConfirmationRef.current = null;
          updateState({ isProcessing: false });
          await agentSay("Cancelled. What would you like to do?");
          return;
        }
        // Not yes/no — cancel pending, process normally
        pendingConfirmationRef.current = null;
      }

      const context = buildContext();
      const actions = await parseIntentWithLLM(text, context, authToken);
      updateState({ isProcessing: false });

      if (actions.length === 1) {
        // F10: intercept destructive single-action commands for fallback confirmation
        const act = actions[0];
        const destructivePrompt = getDestructiveConfirmPrompt(act, schemaRef.current, activitiesRef.current);
        if (destructivePrompt) {
          pendingConfirmationRef.current = { action: act, description: destructivePrompt };
          await agentSay(destructivePrompt);
          return;
        }
        const msg = await dispatchAction(act);
        await agentSay(msg);
      } else {
        // F3: narrate the plan for multi-step commands
        if (actions.length >= 3) {
          await agentSay(`Got it — I'll do this in ${actions.length} steps.`);
        }
        const messages: string[] = [];
        for (const act of actions) {
          const msg = await dispatchAction(act);
          if (msg) messages.push(msg);
        }
        await agentSay(messages.join(" ") || "Done!");
      }

    } catch (err: any) {
      if (!isMountedRef.current) return;
      updateState({ isListening: false, isProcessing: false, transcript: "" });

      if (err.message === "not-allowed") {
        shouldListenRef.current = false;
        await agentSay("Microphone access denied. Please allow mic access in browser settings.");
      } else if (err.message === "audio-capture") {
        shouldListenRef.current = false;
        await agentSay("No microphone found. Please connect a microphone.");
      } else if (shouldListenRef.current) {
        setTimeout(() => listenContinuouslyRef.current(), 1000);
      }
    }
  }, [updateState, dispatchAction, agentSay, buildContext, state.isSpeaking, state.isProcessing]);

  listenContinuouslyRef.current = listenContinuously;

  // ─── Panel controls ────────────────────────────────────────────────────────

  const openPanel = useCallback(async () => {
    updateState({ isOpen: true, usingElevenLabs: hasElevenLabsKey() });

    // If convai is already connected, just re-show the panel — no reconnect needed
    if (usingConvaiRef.current && convaiState.status === "connected") {
      console.log("[VoiceAgent] openPanel — reusing existing convai session");
      return;
    }

    // Mark convai active BEFORE connecting so the mirroring effect
    // captures every state update (connecting → connected → first message).
    usingConvaiRef.current = true;
    updateState({ usingConvai: true, convaiStatus: "connecting" });

    try {
      await startConvai();
      updateState({ convaiStatus: "connected" });
    } catch (err) {
      console.error("[VoiceAgent] startConvai failed, falling back to VAD:", err);
      usingConvaiRef.current = false;
      updateState({ usingConvai: false, convaiStatus: "disconnected" });
      shouldListenRef.current = true;

      const greeting =
        initialStage === "idle" || initialStage === "manage-forms"
          ? "Hi! Tell me what form you'd like to create."
          : "I'm listening. Add fields, toggle dark mode, or ask me anything.";

      await agentSay(greeting);
    }
  }, [initialStage, agentSay, startConvai, updateState, convaiState.status]);

  const closePanel = useCallback(() => {
    // Just hide the panel — keep convai session alive to avoid reconnect latency.
    // Session is only truly ended on component unmount (see cleanup useEffect below).
    if (!usingConvaiRef.current) {
      shouldListenRef.current = false;
      if (vadAbortRef.current) { vadAbortRef.current(); vadAbortRef.current = null; }
      stopAll();
    }
    updateState({ isOpen: false });
  }, [stopAll, updateState]);

  // Fallback manual mic controls (no-ops in convai mode)
  const startListening = useCallback(() => {
    if (state.usingConvai) return;
    shouldListenRef.current = true;
    listenContinuouslyRef.current();
  }, [state.usingConvai]);

  const stopListening = useCallback(() => {
    if (state.usingConvai) return;
    shouldListenRef.current = false;
    if (vadAbortRef.current) { vadAbortRef.current(); vadAbortRef.current = null; }
    updateState({ isListening: false });
  }, [state.usingConvai, updateState]);

  const toggleListening = useCallback(() => {
    if (state.usingConvai) return; // managed by convai
    if (state.isListening) stopListening();
    else startListening();
  }, [state.usingConvai, state.isListening, startListening, stopListening]);

  const setStage = useCallback((stage: AgentStage) => {
    updateState({ stage });
    stageRef.current = stage;
    // Re-send context so the agent knows which screen it's on.
    // For "building": delay 500ms so importSchema has time to populate the
    // store before we snapshot form fields. Without the delay the context
    // would show an empty field list because the new form hasn't loaded yet.
    if (usingConvaiRef.current) {
      const mappedStage = stage === "preview" ? "building" : stage;
      const contextDelay = stage === "building" ? 500 : 0;
      setTimeout(() => {
        if (!isMountedRef.current) return;
        const ctx = { ...buildContext(), stage: mappedStage as ParseContext["stage"] };
        sendContextUpdate(buildContextUpdate(ctx));
      }, contextDelay);
    }
  }, [updateState, buildContext, sendContextUpdate]);

  // ── Cleanup ─────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (vadAbortRef.current) vadAbortRef.current();
      stopAll();
      if (usingConvaiRef.current) stopConvai();
    };
  }, [stopAll, stopConvai]);

  return {
    state,
    actions: {
      startListening,
      stopListening,
      toggleListening,
      openPanel,
      closePanel,
      setStage,
    } satisfies VoiceAgentActions,
  };
}
