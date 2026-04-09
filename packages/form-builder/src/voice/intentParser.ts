/**
 * intentParser.ts
 *
 * Parses a voice transcript into a structured VoiceAction[].
 * Returns an ARRAY so a single utterance can produce multiple actions
 * (e.g. "add a text field and an image picker" → two ADD_FIELD actions).
 *
 * Priority:
 *   1. Keyword parser — instant, no network, handles all known patterns
 *   2. LLM (Ollama/OpenAI) — handles complex / ambiguous natural language
 */

import type { FieldType } from "../types";
import { parseWithOpenAI, hasOpenAIKey } from "./openaiParser";

// ─── Action Types ─────────────────────────────────────────────────────────────

export type VoiceAction =
  // Form fields
  | { type: "ADD_FIELD"; fieldType: FieldType; label?: string; options?: string[]; required?: boolean }
  | { type: "REMOVE_FIELD"; targetLabel: string }
  | { type: "DUPLICATE_FIELD"; targetLabel: string }
  | { type: "UPDATE_FIELD_PROP"; prop: string; value: string | boolean | number | null; targetLabel?: string }
  // Field settings — dedicated actions for nested/complex properties
  | { type: "SET_FIELD_OPTIONS"; targetLabel: string; options: string[] }
  | { type: "SET_FIELD_DATASOURCE"; targetLabel: string; source: "static" | "api"; apiEndpoint?: string; method?: "GET" | "POST"; responseKey?: string; labelKey?: string; valueKey?: string; headers?: Record<string, string> }
  | { type: "SET_FIELD_VALIDATION"; targetLabel: string; min?: number; max?: number; minLength?: number; maxLength?: number; step?: number; pattern?: string; patternMessage?: string }
  | { type: "SET_FIELD_PREFILL"; targetLabel: string; apiEndpoint: string; method?: "GET" | "POST"; responseKey?: string }
  | { type: "SET_FIELD_CONDITION"; targetLabel: string; conditionFieldLabel?: string; operator?: "equals" | "not_equals" | "contains" | "not_empty"; value?: string; clear?: boolean }
  // Form structure
  | { type: "ADD_SECTION"; title?: string }
  | { type: "REMOVE_SECTION"; title: string }
  | { type: "RENAME_SECTION"; currentTitle?: string; newTitle: string }
  | { type: "MOVE_FIELD_TO_SECTION"; fieldLabels: string[]; targetSectionTitle?: string; newSectionTitle?: string }
  // Activity management
  | { type: "CREATE_ACTIVITY"; name: string; description: string }
  | { type: "OPEN_ACTIVITY"; name: string }
  | { type: "TOGGLE_ACTIVITY"; name: string }
  | { type: "DELETE_ACTIVITY"; name: string }
  | { type: "LIST_ACTIVITIES" }
  // Form state
  | { type: "SET_MODE"; mode: "build" | "preview" }
  | { type: "SAVE" }
  | { type: "RESET_FORM" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RENAME_FORM"; newName: string }
  // JSON / Export
  | { type: "SHOW_JSON" }
  | { type: "COPY_JSON" }
  | { type: "DOWNLOAD_FORM" }
  // Info queries
  | { type: "LIST_FIELDS" }
  | { type: "COUNT_FIELDS" }
  // Navigation & UI
  | { type: "NAVIGATE"; route: string }
  | { type: "TOGGLE_THEME" }
  | { type: "GO_BACK" }
  // Report setup
  | { type: "SETUP_REPORT" }
  | { type: "SKIP_REPORT" }
  // Report configuration screen (RC_*)
  | { type: "RC_SELECT_REPORT"; name: string }
  | { type: "RC_CREATE_REPORT" }
  | { type: "RC_DELETE_REPORT"; name: string }
  | { type: "RC_GO_TO_SECTION"; section: string }
  | { type: "RC_SET_DISPLAY_NAME"; value: string }
  | { type: "RC_SET_REPORT_KEY"; value: string }
  | { type: "RC_TOGGLE_FLAG"; flag: string; value: boolean }
  | { type: "RC_SET_VALUE"; field: string; value: unknown }
  | { type: "RC_SAVE_CONFIG" }
  | { type: "RC_LIST_REPORTS" }
  | { type: "RC_CLONE_REPORT"; name: string; newName?: string }
  | { type: "RC_SUGGEST_CONFIG"; reportName?: string }
  | { type: "RC_BULK_SET"; flag: string; value: boolean }
  | { type: "RC_UNDO" }
  // Form builder T2/T3
  | { type: "CLONE_ACTIVITY"; name: string; newName?: string }
  | { type: "SUGGEST_FIELDS"; topic?: string }
  | { type: "VALIDATE_FORM" }
  // Report preview screen (RP_*)
  | { type: "RP_PREVIEW" }
  | { type: "RP_RESET_FILTERS" }
  | { type: "RP_DOWNLOAD" }
  | { type: "RP_FILTER"; dimension: string; value: string }
  | { type: "RP_SELECT_REPORT"; name: string }
  // Memory / repeat
  | { type: "REPEAT_LAST_FIELD"; count: number }
  // Conversational
  | { type: "ANSWER"; text: string }
  | { type: "UNKNOWN" };

// ─── Context ─────────────────────────────────────────────────────────────────

export interface FieldInfo {
  label: string;
  type: string;
  required: boolean;
  section: string;
}

export interface ParseContext {
  stage: "idle" | "manage-forms" | "building" | "report-config" | "report-preview";
  activityName?: string;
  sectionTitles?: string[];
  /** Full field details — type, required status, section — so LLM can answer questions */
  existingFields?: FieldInfo[];
  /** Legacy: just labels (kept for backward compat) */
  existingFieldLabels?: string[];
  /** All activity names (populated in manage-forms stage) */
  activityNames?: string[];
  /** Available report names (populated on report-preview stage) */
  reportNames?: string[];
  /** Label of the last field that was added or edited — for resolving "it"/"that" */
  lastTouchedFieldLabel?: string;
}

// ─── Field type keyword map ───────────────────────────────────────────────────

const FIELD_TYPE_KEYWORDS: Record<FieldType, string[]> = {
  text:        ["text box", "text field", "text input", "single line", "short text", "name field", "text"],
  textarea:    ["text area", "textarea", "long text", "multi line", "remarks", "notes", "description field"],
  email:       ["email", "e-mail", "email address"],
  number:      ["number", "numeric", "quantity", "count", "amount"],
  tel:         ["phone", "telephone", "mobile", "contact number"],
  url:         ["url", "website", "link", "web address"],
  date:        ["date picker", "date field", "calendar", "date"],
  "date-range":["date range", "date period"],
  dropdown:    ["dropdown", "drop down", "select", "picker", "choose one"],
  multiselect: ["multi select", "multiselect", "multiple selection", "multiple choice"],
  checkbox:    ["checkbox", "check box", "tick box"],
  radio:       ["radio", "radio group", "single choice"],
  slider:      ["slider", "range slider", "scale"],
  camera:      ["camera", "image picker", "photo", "picture", "image upload", "capture"],
  location:    ["location", "gps", "map", "coordinates", "address"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ");
}

function detectFieldType(text: string): FieldType | null {
  const norm = normalize(text);
  // Check longer keywords first to avoid partial matches (e.g. "image picker" before "image")
  const sorted = Object.entries(FIELD_TYPE_KEYWORDS) as [FieldType, string[]][];
  for (const [fieldType, keywords] of sorted) {
    for (const kw of keywords.sort((a, b) => b.length - a.length)) {
      if (norm.includes(kw)) return fieldType;
    }
  }
  return null;
}

function extractOptions(text: string): string[] | undefined {
  const match = text.match(/(?:with options?|options? are|choices?:?)\s+(.+)/i);
  if (!match) return undefined;
  return match[1].split(/,| and | or /).map((s) => s.trim()).filter(Boolean);
}

function extractLabel(text: string): string | undefined {
  const m = text.match(/(?:called|named|label(?:ed)?|titled?)\s+["']?([a-z0-9 &_-]+)["']?/i);
  return m ? m[1].trim() : undefined;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Multi-field "and" splitting ──────────────────────────────────────────────
// "add a text field and an image picker" → [ADD_FIELD text, ADD_FIELD camera]

function tryMultiFieldParse(norm: string, transcript: string): VoiceAction[] | null {
  // Only attempt if the utterance looks like "add/need/want ... and ..."
  if (!/\b(add|need|want|include|create|put)\b/.test(norm) || !/\band\b/.test(norm)) return null;

  // Split into segments around "and" / "also" / "plus"
  const segments = norm.split(/\b(?:and|also|plus)\b/);
  const actions: VoiceAction[] = [];

  for (const segment of segments) {
    const ft = detectFieldType(segment);
    if (ft) {
      actions.push({
        type: "ADD_FIELD",
        fieldType: ft,
        label: extractLabel(segment) || extractLabel(transcript),
        options: extractOptions(segment),
        required: /\b(required|mandatory)\b/i.test(segment) ? true
          : /\b(optional)\b/i.test(segment) ? false
          : undefined,
      });
    }
  }

  return actions.length >= 2 ? actions : null;
}

// ─── Keyword parser ───────────────────────────────────────────────────────────

export function parseIntent(transcript: string, context: ParseContext): VoiceAction[] {
  const norm = normalize(transcript);

  // ── Single-action fast-path checks ──────────────────────────────────────────

  if (/\b(go back|back|cancel|exit)\b/.test(norm)) return [{ type: "GO_BACK" }];
  if (/\b(dark mode|light mode|toggle theme|switch theme)\b/.test(norm)) return [{ type: "TOGGLE_THEME" }];
  if (/\b(manage forms?|home)\b/.test(norm) || (/\bactivities\b/.test(norm) && !/\b(list|show|what|tell|how many)\b/.test(norm))) return [{ type: "NAVIGATE", route: "/manage-forms" }];
  if (/\b(undo|undo that)\b/.test(norm)) return [{ type: "UNDO" }];
  if (/\b(redo)\b/.test(norm)) return [{ type: "REDO" }];

  // Repeat last field — "add two more like that", "same again", "add another one"
  const repeatMatch = norm.match(/\b(add|create|put)\b.{0,20}\b(another|more|same)\b.*?(\d+|one|two|three|four|five)?/);
  if (repeatMatch || /\b(same again|one more|few more like that)\b/.test(norm)) {
    const word = (repeatMatch?.[3] || "").trim();
    const countMap: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };
    const count = parseInt(word) || countMap[word] || 1;
    return [{ type: "REPEAT_LAST_FIELD", count }];
  }
  if (/\b(save|looks good|done|finish|all good)\b/.test(norm)) return [{ type: "SAVE" }];
  if (/\b(preview|show me the form|let me see the form)\b/.test(norm) && !/json|schema|fields|structure/.test(norm)) return [{ type: "SET_MODE", mode: "preview" }];
  if (/\b(build|edit mode|back to edit)\b/.test(norm)) return [{ type: "SET_MODE", mode: "build" }];
  if (/\b(reset form|clear form|start over)\b/.test(norm)) return [{ type: "RESET_FORM" }];

  // JSON / Export
  if (/\b(show|open|view|display|see)\b.*(json|schema|code)\b/.test(norm)) return [{ type: "SHOW_JSON" }];
  if (/\b(copy).*(json|schema|code)\b/.test(norm)) return [{ type: "COPY_JSON" }];
  if (/\b(download|export).*(form|json|schema)\b/.test(norm)) return [{ type: "DOWNLOAD_FORM" }];

  // Info queries
  if (/\b(list|show|what are|tell me).*(fields?|inputs?)\b/.test(norm)) return [{ type: "LIST_FIELDS" }];
  if (/\b(how many|count).*(fields?|inputs?|sections?)\b/.test(norm)) return [{ type: "COUNT_FIELDS" }];
  if (/\b(list|show|what are|tell me).*(activities|forms)\b/.test(norm)) return [{ type: "LIST_ACTIVITIES" }];

  // Rename form
  const renameFormMatch = transcript.match(/(?:rename|change|set)\s+(?:the\s+)?(?:form\s+)?(?:name|title)\s+to\s+["']?([a-z0-9 &_-]+)["']?/i);
  if (renameFormMatch) return [{ type: "RENAME_FORM", newName: renameFormMatch[1].trim() }];

  // Duplicate field
  const dupMatch = norm.match(/duplicate\s+(?:the\s+)?([a-z0-9 ]+?)\s*(?:field)?\s*$/);
  if (dupMatch) return [{ type: "DUPLICATE_FIELD", targetLabel: dupMatch[1].trim() }];

  // Report setup
  if (/\b(set ?up|configure|yes|yeah|sure|continue).*(report)\b/.test(norm) || /\b(go to|open)\s+report/.test(norm)) return [{ type: "SETUP_REPORT" }];
  if (/\b(skip|no|not now|later|cancel).*(report)\b/.test(norm)) return [{ type: "SKIP_REPORT" }];

  // ── Multi-field detection ──────────────────────────────────────────────────
  const multiFields = tryMultiFieldParse(norm, transcript);
  if (multiFields) return multiFields;

  // ── Open / edit existing activity ─────────────────────────────────────────
  const openMatch = norm.match(
    /(?:edit|open|go to|show|view|update|modify)\s+(?:the\s+)?([a-z0-9 &]+?)\s*(?:form|activity|builder)?\s*$/
  );
  if (openMatch && !/^(the|a|an|new|another)$/.test(openMatch[1].trim())) {
    return [{ type: "OPEN_ACTIVITY", name: openMatch[1].trim() }];
  }

  // Toggle activity on/off
  const toggleMatch = norm.match(
    /(?:enable|disable|turn on|turn off|activate|deactivate)\s+(?:the\s+)?([a-z0-9 &]+?)\s*(?:form|activity)?\s*$/
  );
  if (toggleMatch) return [{ type: "TOGGLE_ACTIVITY", name: toggleMatch[1].trim() }];

  // Delete activity
  const deleteActMatch = norm.match(
    /(?:delete|remove)\s+(?:the\s+)?([a-z0-9 &]+?)\s*(?:form|activity)\s*$/
  );
  if (deleteActMatch) return [{ type: "DELETE_ACTIVITY", name: deleteActMatch[1].trim() }];

  // ── Create activity ────────────────────────────────────────────────────────
  if (context.stage !== "building") {
    const m = transcript.match(/(?:create|make|build|new)\s+(?:a\s+)?(?:new\s+)?["']?([a-z0-9 &_-]+?)["']?\s*(?:form|activity)/i);
    if (m) {
      const name = capitalize(m[1].trim());
      return [{ type: "CREATE_ACTIVITY", name, description: `${name} activity` }];
    }
  }

  // ── Add section ───────────────────────────────────────────────────────────
  if (/\b(add|new)\s+section\b/.test(norm)) {
    const title = extractLabel(transcript);
    return [{ type: "ADD_SECTION", title }];
  }

  // ── Single field add ──────────────────────────────────────────────────────
  const fieldType = detectFieldType(norm);
  if (fieldType) {
    return [{
      type: "ADD_FIELD",
      fieldType,
      label: extractLabel(transcript),
      options: extractOptions(transcript),
      required: /\b(required|mandatory)\b/i.test(transcript) ? true
        : /\b(optional)\b/i.test(transcript) ? false
        : undefined,
    }];
  }

  // Remove field
  const removeMatch = norm.match(/remove\s+(?:the\s+)?([a-z0-9 ]+?)\s*(?:field)?\s*$/);
  if (removeMatch) return [{ type: "REMOVE_FIELD", targetLabel: removeMatch[1].trim() }];

  // Make field required/optional
  const reqMatch = transcript.match(/make\s+["']?([a-z0-9 ]+?)["']?\s+(required|mandatory|optional)/i);
  if (reqMatch) {
    return [{
      type: "UPDATE_FIELD_PROP",
      prop: "required",
      value: !/optional/i.test(reqMatch[2]),
      targetLabel: reqMatch[1].trim(),
    }];
  }

  // Help
  if (/what (fields?|can i|is available)|help/.test(norm)) {
    return [{
      type: "ANSWER",
      text: "You can add: text box, text area, email, number, phone, dropdown, multi-select, checkbox, radio group, date picker, date range, slider, image picker, and location. You can also say things like 'add a text field and an image picker', 'show JSON', 'list fields', 'edit merchandising form', 'rename form to X', 'how many fields', or 'set up report'.",
    }];
  }

  return [{ type: "UNKNOWN" }];
}

// ─── Primary parser: keyword first, LLM for unmatched ────────────────────────

export async function parseIntentWithLLM(
  transcript: string,
  context: ParseContext,
  _authToken?: string | null
): Promise<VoiceAction[]> {
  // Keyword parser runs first — instant, no network, handles all known patterns.
  const keywordResult = parseIntent(transcript, context);
  if (keywordResult.length > 0 && keywordResult[0].type !== "UNKNOWN") {
    return keywordResult;
  }

  // LLM handles complex / ambiguous queries that keywords couldn't parse.
  if (hasOpenAIKey()) {
    try {
      const actions = await parseWithOpenAI(transcript, context);
      return actions;
    } catch (err) {
      console.warn("[VoiceAgent] LLM parse failed, staying UNKNOWN:", err);
    }
  }

  return [{ type: "UNKNOWN" }];
}
