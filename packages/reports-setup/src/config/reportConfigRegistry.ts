/**
 * reportConfigRegistry.ts
 *
 * Authoritative knowledge base of every action the voice agent can take
 * on the Report Configuration screen.
 *
 * Mirrors the role that widgetRegistry.ts plays for the form builder —
 * this file is the single source of truth fed into the ElevenLabs agent
 * prompt so the AI understands all available operations, their aliases,
 * and the exact JSON shape to dispatch.
 */

// ─── Action definitions ────────────────────────────────────────────────────────

export interface ReportConfigActionDef {
  type: string;
  displayName: string;
  /** Natural-language phrases a user might say to trigger this action */
  aliases: string[];
  description: string;
  /** Example dispatch_form_action payload */
  example: Record<string, unknown>;
  /** Whether this action requires explicit user confirmation before executing */
  requiresConfirm?: boolean;
}

export const REPORT_CONFIG_ACTIONS: ReportConfigActionDef[] = [
  // ── Navigation ──────────────────────────────────────────────────────────────
  {
    type: "RC_SELECT_REPORT",
    displayName: "Select Report",
    aliases: ["select", "open", "edit", "go to", "switch to", "show me"],
    description: "Select a report from the left panel by name to edit it",
    example: { type: "RC_SELECT_REPORT", name: "Outlet Master" },
  },
  {
    type: "RC_CREATE_REPORT",
    displayName: "Create New Report",
    aliases: ["create report", "add report", "new report", "add new"],
    description: "Append a new blank report card to the list",
    example: { type: "RC_CREATE_REPORT" },
  },
  {
    type: "RC_DELETE_REPORT",
    displayName: "Delete Report",
    aliases: ["delete", "remove", "drop report"],
    description: "Delete a non-mandatory report (mandatory reports cannot be deleted)",
    example: { type: "RC_DELETE_REPORT", name: "Old Report" },
    requiresConfirm: true,
  },
  {
    type: "RC_GO_TO_SECTION",
    displayName: "Jump to Section",
    aliases: ["go to section", "open section", "scroll to", "show section"],
    description: "Scroll the editor to a specific configuration section",
    example: { type: "RC_GO_TO_SECTION", section: "behavior" },
  },

  // ── Basic info ───────────────────────────────────────────────────────────────
  {
    type: "RC_SET_DISPLAY_NAME",
    displayName: "Set Display Name",
    aliases: ["set name", "rename report", "change name", "display name is", "call it"],
    description: "Set the human-readable display name for the selected report",
    example: { type: "RC_SET_DISPLAY_NAME", value: "Outlet Master Report" },
  },
  {
    type: "RC_SET_REPORT_KEY",
    displayName: "Set Report Key",
    aliases: ["set key", "report key", "internal name", "set report name", "backend key"],
    description: "Set the internal reportName key used in API calls",
    example: { type: "RC_SET_REPORT_KEY", value: "outlet_master_report" },
  },

  // ── Boolean flag toggles ────────────────────────────────────────────────────
  {
    type: "RC_TOGGLE_FLAG",
    displayName: "Toggle Feature Flag",
    aliases: ["enable", "disable", "turn on", "turn off", "toggle", "activate", "deactivate"],
    description: "Enable or disable a specific behavior flag on the selected report",
    example: { type: "RC_TOGGLE_FLAG", flag: "isLiveReport", value: true },
  },

  // ── Numeric / string values ──────────────────────────────────────────────────
  {
    type: "RC_SET_VALUE",
    displayName: "Set Config Value",
    aliases: ["set", "change to", "update to", "set value"],
    description: "Set a numeric or string config field on the selected report",
    example: { type: "RC_SET_VALUE", field: "dateRangeAllowed", value: 180 },
  },

  // ── Actions ──────────────────────────────────────────────────────────────────
  {
    type: "RC_SAVE_CONFIG",
    displayName: "Save Configuration",
    aliases: ["save", "save config", "apply changes", "confirm", "submit"],
    description: "Persist all modified report configurations",
    example: { type: "RC_SAVE_CONFIG" },
    requiresConfirm: true,
  },
  {
    type: "RC_LIST_REPORTS",
    displayName: "List Reports",
    aliases: ["list reports", "show all reports", "what reports", "list all"],
    description: "Read out all report names in the current configuration",
    example: { type: "RC_LIST_REPORTS" },
  },
];

// ─── Behavior flag alias dictionary ──────────────────────────────────────────

/**
 * Maps spoken aliases → the exact field path in ReportBehaviorConfig.
 * Nested fields use dot notation: "salesHierarchyFilter.enabled"
 */
export const BEHAVIOR_FLAG_ALIASES: Record<string, string> = {
  // Report type
  "live report":              "isLiveReport",
  "live":                     "isLiveReport",
  "pdf report":               "isPDFReport",
  "pdf":                      "isPDFReport",
  "gstr report":              "isGSTRReport",
  "gstr":                     "isGSTRReport",
  "custom download":          "customDownload",
  // Date controls
  "date range":               "dateRangeFilter",
  "date range filter":        "dateRangeFilter",
  "period filter":            "periodFilter",
  "period":                   "periodFilter",
  "last 7 days":              "showLast7DaysFilter",
  "7 days":                   "showLast7DaysFilter",
  "last 3 months":            "showLast3MonthsFilter",
  "3 months":                 "showLast3MonthsFilter",
  "custom date":              "shouldShowCustomDateFilter",
  "custom date filter":       "shouldShowCustomDateFilter",
  // Filters
  "custom filters":           "shouldShowCustomFilters",
  "additional filters":       "showAdditionalFilters",
  // Metadata
  "send metadata":            "sendMetadata",
  "metadata":                 "sendMetadata",
  // Hierarchy
  "sales hierarchy":          "salesHierarchyFilter.enabled",
  "sales":                    "salesHierarchyFilter.enabled",
  "geo hierarchy":            "geographicalHierarchyFilter.enabled",
  "geographical hierarchy":   "geographicalHierarchyFilter.enabled",
  "geo":                      "geographicalHierarchyFilter.enabled",
  // Distributor
  "distributor filter":       "distributorFilter.enabled",
  "distributor":              "distributorFilter.enabled",
  "distributor type":         "distributorFilter.enabled",
  "dist type":                "distributorFilter.enabled",
  "distributor type filter":  "distributorFilter.enabled",
};

// ─── Section IDs ──────────────────────────────────────────────────────────────

export type ReportConfigSection = "basic" | "behavior" | "hierarchy" | "filters" | "metadata";

export const SECTION_ALIASES: Record<string, ReportConfigSection> = {
  "basic":          "basic",
  "basic info":     "basic",
  "name":           "basic",
  "behavior":       "behavior",
  "toggles":        "behavior",
  "flags":          "behavior",
  "type":           "behavior",
  "hierarchy":      "hierarchy",
  "filters":        "hierarchy",
  "sales":          "hierarchy",
  "custom":         "filters",
  "custom filters": "filters",
  "merged":         "filters",
  "metadata":       "metadata",
  "meta":           "metadata",
};
