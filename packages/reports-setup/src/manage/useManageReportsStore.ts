/**
 * useManageReportsStore.ts — Zustand store for the ManageReports page
 *
 * Flow:
 *  1. Consumer passes `initialConfig` (full app JSON) and `onConfigUpdate` callback.
 *  2. `init()` reads `viewMeta.reports` (catalog) and
 *     `features.reports.config.report_list` (currently enabled).
 *  3. `toggleReport(id)`:
 *       - ON  → copy the entry from the catalog into report_list
 *       - OFF → delete the entire config object from report_list
 *  4. `updateReportConfig(id, updates)` → patch a single report's config in-place.
 *  5. After every mutation the store calls `onConfigUpdate(updatedConfig)` and
 *     also writes a fallback to localStorage under `manage_reports_config`.
 */

import { create } from "zustand";
import type { AppConfig, ViewMetaReport } from "./types";
import { buildUpdatedConfig } from "./types";

const LS_KEY = "manage_reports_config";

interface ManageReportsState {
  // ── Catalog (all available reports from viewMeta) ──────────────────────────
  viewMetaReports: ViewMetaReport[];

  // ── Active list (features.reports.config.report_list) ─────────────────────
  reportList: ViewMetaReport[];

  // ── Internals ──────────────────────────────────────────────────────────────
  _baseConfig: AppConfig;
  _onUpdate: ((config: AppConfig) => void) | undefined;

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Must be called once on mount (inside ManageReports useEffect).
   * Reads viewMeta + features.reports.config from the supplied config.
   */
  init: (config: AppConfig, onUpdate?: (config: AppConfig) => void) => void;

  /** Enable (add) or disable (delete) a report by ID. */
  toggleReport: (id: string) => void;

  /**
   * Patch the in-memory config for an already-enabled report.
   * Used when the settings editor saves back a change.
   */
  updateReportConfig: (id: string, updates: Partial<ViewMetaReport>) => void;

  /** True if the report with `id` is currently in report_list. */
  isEnabled: (id: string) => boolean;

  /**
   * Returns viewMetaReports grouped by the `type` field.
   * Reports without a `type` fall under the "" (empty string) key.
   */
  getGroupedReports: () => Record<string, ViewMetaReport[]>;
}

export const useManageReportsStore = create<ManageReportsState>((set, get) => ({
  viewMetaReports: [],
  reportList: [],
  _baseConfig: {},
  _onUpdate: undefined,

  // ── init ──────────────────────────────────────────────────────────────────

  init(config, onUpdate) {
    const viewMetaReports = config.viewMeta?.reports ?? [];
    const reportList = config.features?.reports?.config?.report_list ?? [];
    set({
      viewMetaReports,
      reportList,
      _baseConfig: config,
      _onUpdate: onUpdate,
    });
  },

  // ── toggleReport ──────────────────────────────────────────────────────────

  toggleReport(id) {
    const { viewMetaReports, reportList, _baseConfig, _onUpdate } = get();

    const currently = reportList.some((r) => r.id === id);
    let newList: ViewMetaReport[];

    if (currently) {
      // Disable → delete entire config object from the list
      newList = reportList.filter((r) => r.id !== id);
    } else {
      // Enable → copy from catalog
      const entry = viewMetaReports.find((r) => r.id === id);
      if (!entry) return;
      newList = [...reportList, entry];
    }

    set({ reportList: newList });
    _persist(buildUpdatedConfig(_baseConfig, newList), _onUpdate);
  },

  // ── updateReportConfig ────────────────────────────────────────────────────

  updateReportConfig(id, updates) {
    const { reportList, _baseConfig, _onUpdate } = get();
    const newList = reportList.map((r) =>
      r.id === id ? { ...r, ...updates } : r,
    );
    set({ reportList: newList });
    _persist(buildUpdatedConfig(_baseConfig, newList), _onUpdate);
  },

  // ── isEnabled ─────────────────────────────────────────────────────────────

  isEnabled(id) {
    return get().reportList.some((r) => r.id === id);
  },

  // ── getGroupedReports ─────────────────────────────────────────────────────

  getGroupedReports() {
    const { viewMetaReports, reportList } = get();

    // Catalog first, then any report_list entries not in catalog (orphans)
    const seen = new Set<string>(viewMetaReports.map((r) => r.id));
    const allReports = [
      ...viewMetaReports,
      ...reportList.filter((r) => !seen.has(r.id)),
    ];

    const groups: Record<string, ViewMetaReport[]> = {};
    for (const report of allReports) {
      const key = report.type ?? "";
      if (!groups[key]) groups[key] = [];
      groups[key].push(report);
    }
    return groups;
  },
}));

// ── helpers ───────────────────────────────────────────────────────────────────

function _persist(
  updatedConfig: AppConfig,
  onUpdate: ((config: AppConfig) => void) | undefined,
) {
  onUpdate?.(updatedConfig);
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(updatedConfig));
  } catch {
    /* storage quota – ignore */
  }
}
