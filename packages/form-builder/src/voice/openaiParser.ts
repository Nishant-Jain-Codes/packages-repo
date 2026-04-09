/**
 * openaiParser.ts
 *
 * Uses local Ollama (qwen2.5:7b) for intent parsing.
 * Ollama exposes an OpenAI-compatible API at http://localhost:11434/v1
 * — no API key needed, runs fully offline.
 *
 * Always returns VoiceAction[] (array) so multi-step commands work.
 */

import type { VoiceAction, ParseContext } from "./intentParser";

const OLLAMA_BASE_URL = "http://localhost:11434/v1";
const OLLAMA_MODEL = "qwen2.5:7b";

export function hasOpenAIKey(): boolean {
  return true; // Ollama runs locally — always available to try
}

export function setOpenAIKey(_key: string) {}

// ─── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a voice assistant embedded in a drag-and-drop form builder application.
Convert the user's natural language command into a JSON array of actions.
ALWAYS return a JSON array — even for a single action. Never return a plain object.

Available field types: text, textarea, email, number, tel, url, date, date-range, dropdown, multiselect, checkbox, radio, slider, camera, location

━━━ ACTION SCHEMAS ━━━

Add one or more form fields (use multiple objects for multiple fields):
{"type":"ADD_FIELD","fieldType":"<type>","label":"<optional>","options":["<opt>"],"required":true}

Create a new activity/form:
{"type":"CREATE_ACTIVITY","name":"<name>","description":"<short description>"}

Open/edit an existing activity by name:
{"type":"OPEN_ACTIVITY","name":"<activity name>"}

Enable or disable an existing activity:
{"type":"TOGGLE_ACTIVITY","name":"<activity name>"}

Delete an existing activity:
{"type":"DELETE_ACTIVITY","name":"<activity name>"}

List all activities:
{"type":"LIST_ACTIVITIES"}

Update a field property:
{"type":"UPDATE_FIELD_PROP","prop":"required","value":true,"targetLabel":"<field label>"}
{"type":"UPDATE_FIELD_PROP","prop":"label","value":"<new label>","targetLabel":"<current label>"}
{"type":"UPDATE_FIELD_PROP","prop":"placeholder","value":"<text>","targetLabel":"<field label>"}
{"type":"UPDATE_FIELD_PROP","prop":"hintText","value":"<text>","targetLabel":"<field label>"}

Remove a field by name:
{"type":"REMOVE_FIELD","targetLabel":"<field label>"}

Duplicate a field:
{"type":"DUPLICATE_FIELD","targetLabel":"<field label>"}

Add a new section:
{"type":"ADD_SECTION","title":"<optional title>"}

Rename a section:
{"type":"RENAME_SECTION","currentTitle":"<current>","newTitle":"<new>"}

Rename the form:
{"type":"RENAME_FORM","newName":"<new name>"}

Switch view mode:
{"type":"SET_MODE","mode":"preview"}
{"type":"SET_MODE","mode":"build"}

Save the form:
{"type":"SAVE"}

Undo / redo:
{"type":"UNDO"}
{"type":"REDO"}

Reset/clear the form:
{"type":"RESET_FORM"}

Show JSON schema dialog:
{"type":"SHOW_JSON"}

Copy JSON to clipboard:
{"type":"COPY_JSON"}

Download form JSON:
{"type":"DOWNLOAD_FORM"}

List fields in the form (answer only, no UI change):
{"type":"LIST_FIELDS"}

Count fields/sections:
{"type":"COUNT_FIELDS"}

Navigate to a page:
{"type":"NAVIGATE","route":"/manage-forms"}
{"type":"NAVIGATE","route":"/form-builder"}

Toggle dark/light theme:
{"type":"TOGGLE_THEME"}

Go back to previous page:
{"type":"GO_BACK"}

Open report configuration:
{"type":"SETUP_REPORT"}

Skip report setup:
{"type":"SKIP_REPORT"}

Answer a question using the form context provided:
{"type":"ANSWER","text":"<answer using form context>"}

Cannot understand:
{"type":"UNKNOWN"}

━━━ MULTI-ACTION EXAMPLES ━━━

"create a merchandising form with a text field and an image picker"
→ [{"type":"CREATE_ACTIVITY","name":"Merchandising","description":"Merchandising activity"},{"type":"ADD_FIELD","fieldType":"text"},{"type":"ADD_FIELD","fieldType":"camera"}]

"add an email field and a phone field"
→ [{"type":"ADD_FIELD","fieldType":"email"},{"type":"ADD_FIELD","fieldType":"tel"}]

"rename the form to Store Audit and add a date field"
→ [{"type":"RENAME_FORM","newName":"Store Audit"},{"type":"ADD_FIELD","fieldType":"date"}]

"make email required and add a remarks field"
→ [{"type":"UPDATE_FIELD_PROP","prop":"required","value":true,"targetLabel":"email"},{"type":"ADD_FIELD","fieldType":"textarea","label":"Remarks"}]

━━━ ANSWER EXAMPLES (use form context) ━━━

If user asks "is email required?" and context shows email field as required:
→ [{"type":"ANSWER","text":"Yes, the Email field is marked as required."}]

If user asks "what fields do I have?" and context lists fields:
→ [{"type":"ANSWER","text":"Your form has 3 fields: Name (text, required), Email (email, required), and Photo (camera, optional)."}]

If user asks "how many sections?" and context shows 2 sections:
→ [{"type":"ANSWER","text":"Your form has 2 sections: Section 1 and Details."}]

━━━ RULES ━━━
- ALWAYS return a valid JSON array, never null, never a plain object
- For multi-step commands connected by "and", "also", "then", "plus" → return multiple actions
- Field type mapping: "image picker"/"photo"/"camera" → camera | "text box"/"text" → text | "remarks"/"notes"/"long text" → textarea | "phone"/"mobile" → tel
- "required"/"mandatory" → required:true | "optional" → required:false
- Navigation: "manage forms"/"activities"/"home" → /manage-forms | "form builder"/"build" → /form-builder
- Use ANSWER (with content from the form context) for questions about the current form state
- Use ANSWER for general app questions
- Use UNKNOWN only if truly unrelated to form building`;

// ─── Context builder ──────────────────────────────────────────────────────────

function buildContextNote(context: ParseContext): string {
  const lines: string[] = [`Current screen: ${context.stage}`];

  if (context.activityName) {
    lines.push(`Form name: "${context.activityName}"`);
  }

  if (context.sectionTitles?.length) {
    lines.push(`Sections (${context.sectionTitles.length}): ${context.sectionTitles.join(", ")}`);
  }

  if (context.existingFields?.length) {
    const fieldSummary = context.existingFields
      .map((f) => `"${f.label}" (${f.type}, ${f.required ? "required" : "optional"})${f.section ? ` [${f.section}]` : ""}`)
      .join(", ");
    lines.push(`Fields (${context.existingFields.length}): ${fieldSummary}`);
  } else {
    lines.push("Fields: none yet");
  }

  if (context.activityNames?.length) {
    lines.push(`Available activities: ${context.activityNames.join(", ")}`);
  }

  return lines.join("\n");
}

// ─── LLM call ─────────────────────────────────────────────────────────────────

export async function parseWithOpenAI(
  transcript: string,
  context: ParseContext
): Promise<VoiceAction[]> {
  const contextNote = buildContextNote(context);

  const response = await fetch(`${OLLAMA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 400,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Form context:\n${contextNote}\n\nUser said: "${transcript}"\n\nReturn a JSON array of actions.`,
        },
      ],
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(`Ollama error ${response.status}: ${body?.error?.message ?? response.statusText}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content ?? "[]";

  try {
    const parsed = JSON.parse(raw);

    // Handle both array and accidentally-plain-object responses
    const actions: VoiceAction[] = Array.isArray(parsed)
      ? parsed
      : parsed?.actions
        ? parsed.actions          // {actions: [...]}
        : parsed?.type
          ? [parsed]              // single plain object fallback
          : [];

    if (!actions.length) return [{ type: "UNKNOWN" }];

    // Validate each action has a type
    const valid = actions.filter((a: any) => typeof a?.type === "string");
    return valid.length ? (valid as VoiceAction[]) : [{ type: "UNKNOWN" }];
  } catch {
    console.warn("[VoiceAgent] LLM returned unparseable JSON:", raw);
    return [{ type: "UNKNOWN" }];
  }
}
