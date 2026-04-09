/**
 * buildReportConfigPrompt.ts
 *
 * Builds the ElevenLabs Conversational AI system prompt for the
 * Report Configuration screen.
 *
 * Follows the same pattern as buildAgentPrompt.ts in the form builder:
 *   - buildReportConfigStaticPrompt()  → paste into ElevenLabs dashboard
 *   - buildReportConfigContextUpdate() → send via sendContextualUpdate() at runtime
 */

import { REPORT_CONFIG_ACTIONS, BEHAVIOR_FLAG_ALIASES } from "../reportConfigRegistry";
import type { ReportCard } from "../types";

// ─── Static prompt ────────────────────────────────────────────────────────────

export function buildReportConfigStaticPrompt(): string {
  const actionList = REPORT_CONFIG_ACTIONS.map((a) => {
    const topAliases = a.aliases.slice(0, 5).join(", ");
    const ex = JSON.stringify(a.example);
    return `  • ${a.displayName} (${a.type}) — ${a.description}. Say: ${topAliases}\n    Example: ${ex}`;
  }).join("\n");

  const flagList = Object.entries(BEHAVIOR_FLAG_ALIASES)
    .map(([alias, field]) => `  "${alias}" → ${field}`)
    .join("\n");

  return `You are a voice-first assistant for the Report Configuration screen.
Help users manage report cards — create, edit, and configure report behavior flags — all through natural conversation.

━━━ AVAILABLE ACTIONS ━━━
${actionList}

━━━ BEHAVIOR FLAG ALIASES ━━━
When the user says "enable/disable <flag>", map the spoken phrase to the exact field path:
${flagList}

━━━ TAKING ACTION ━━━
Use the dispatch_form_action tool for ALL operations. Pass the action as a JSON object.

Key rules:
1. ALWAYS call dispatch_form_action — never just describe what you would do
2. For ambiguous flag names, ask: "Did you mean <option A> or <option B>?"
3. Confirm destructive actions before executing:
   - "Deleting <name>. Are you sure?"
   - "Saving configuration for N reports. Confirm?"
4. After each action, confirm briefly (e.g. "Done! Live report enabled.")
5. Announce blocked actions clearly (e.g. "Mandatory reports cannot be deleted.")
6. For nested flags like salesHierarchyFilter.enabled, pass the full field path
7. Be concise — short spoken phrases for mobile voice UX

━━━ SECTION NAVIGATION ━━━
Sections: basic | behavior | hierarchy | filters | metadata
Example: {"type":"RC_GO_TO_SECTION","section":"behavior"}

━━━ VOICE SAFETY ━━━
Always confirm before: RC_DELETE_REPORT, RC_SAVE_CONFIG
Never delete mandatory reports — say "That report is mandatory and cannot be deleted."`;
}

// ─── Dynamic context update ───────────────────────────────────────────────────

export interface ReportConfigContext {
  reportNames: string[];
  selectedReportName?: string;
  selectedReportConfig?: Partial<ReportCard["newReportConfig"]>;
  totalCards: number;
}

export function buildReportConfigContextUpdate(ctx: ReportConfigContext): string {
  const lines: string[] = [
    `Screen: report-config`,
    `Total reports: ${ctx.totalCards}`,
    `Reports: ${ctx.reportNames.join(", ") || "none yet"}`,
  ];

  if (ctx.selectedReportName) {
    lines.push(`Selected: "${ctx.selectedReportName}"`);
  }

  if (ctx.selectedReportConfig) {
    const cfg = ctx.selectedReportConfig;
    const activeFlags = [
      cfg.isLiveReport     && "Live",
      cfg.isPDFReport      && "PDF",
      cfg.isGSTRReport     && "GSTR",
      cfg.customDownload   && "CustomDownload",
      cfg.dateRangeFilter  && "DateRange",
      cfg.periodFilter     && "Period",
      cfg.salesHierarchyFilter?.enabled         && "SalesHierarchy",
      cfg.geographicalHierarchyFilter?.enabled  && "GeoHierarchy",
      cfg.distributorFilter?.enabled            && "Distributor",
    ].filter(Boolean).join(", ");
    if (activeFlags) lines.push(`Active flags: ${activeFlags}`);
  }

  return `CURRENT SCREEN STATE — USE THESE FACTS:
${lines.join("\n")}

You are in report configuration mode. Help the user manage their report cards.
Use dispatch_form_action with RC_* action types for all operations.`;
}
