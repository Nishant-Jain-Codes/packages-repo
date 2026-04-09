/**
 * reportConfigService.ts — localStorage-only persistence (server wired later)
 */

import type { ReportCard } from "./types";

export const REPORT_DOMAIN_NAME       = "clientconfig";
export const BASE_REPORT_DOMAIN_TYPE  = "generic_report_configuration";

export function getRoleDomainType(rolePrefix?: string): string {
  return rolePrefix ? `${rolePrefix}_report_configuration` : BASE_REPORT_DOMAIN_TYPE;
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

const LOCAL_KEY_PREFIX = "report_configs_local_";

export function saveReportConfigLocal(cards: ReportCard[], rolePrefix?: string): void {
  try {
    localStorage.setItem(LOCAL_KEY_PREFIX + (rolePrefix || "generic"), JSON.stringify(cards));
  } catch { /* storage quota — ignore */ }
}

export function loadReportConfigLocal(rolePrefix?: string): ReportCard[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY_PREFIX + (rolePrefix || "generic"));
    return raw ? (JSON.parse(raw) as ReportCard[]) : [];
  } catch {
    return [];
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Persist to localStorage. Server save can be re-enabled here later. */
export async function saveReportConfig(
  cards: ReportCard[],
  rolePrefix?: string,
): Promise<void> {
  saveReportConfigLocal(cards, rolePrefix);
}

/** Load from localStorage. Server fetch can be added here later. */
export async function loadReportConfig(rolePrefix?: string): Promise<ReportCard[]> {
  return loadReportConfigLocal(rolePrefix);
}
