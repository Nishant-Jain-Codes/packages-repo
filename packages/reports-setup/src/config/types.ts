/**
 * types.ts — Report Configuration data contracts
 *
 * Matches the persisted shape used in metadata domainValues so
 * save/load round-trips are lossless.
 */

export interface HierarchyConfig {
  enabled: boolean;
  levelFilterField: string;
}

export interface DistributorConfig {
  enabled: boolean;
  required: boolean;
}

export interface MergedFilterSource {
  alias: string;
  label: string;
  values: string[];
}

export interface ReportBehaviorConfig {
  reportName: string;

  // ── Report type ────────────────────────────────────────────────────────
  isLiveReport: boolean;
  isPDFReport: boolean;
  isGSTRReport: boolean;
  customDownload: boolean;

  // ── Date controls ──────────────────────────────────────────────────────
  dateRangeFilter: boolean;
  periodFilter: boolean;
  showLast7DaysFilter: boolean;
  showLast3MonthsFilter: boolean;
  shouldShowCustomDateFilter: boolean;
  dateRangeAllowed: number;
  gstrYearsRange: number;

  // ── Hierarchy / distributor ────────────────────────────────────────────
  salesHierarchyFilter: HierarchyConfig;
  geographicalHierarchyFilter: HierarchyConfig;
  distributorFilter: DistributorConfig;

  // ── Custom / merged filters ────────────────────────────────────────────
  shouldShowCustomFilters: boolean;
  showAdditionalFilters: boolean;
  mergedFilters: MergedFilterSource[];

  // ── Metadata ───────────────────────────────────────────────────────────
  sendMetadata: boolean;
  metadataFields: string[];

  // ── API ────────────────────────────────────────────────────────────────
  getAPI: string;
}

/**
 * One entry in domainValues — the exact shape written to / read from metadata.
 */
export interface ReportCard {
  id: string;
  name: string;
  type: "new";
  filter: "newFilter";
  isNewReport: true;
  isNewReportUi: true;
  isMandatory?: boolean;
  newReportConfig: ReportBehaviorConfig;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_BEHAVIOR_CONFIG: ReportBehaviorConfig = {
  reportName: "",
  isLiveReport: false,
  isPDFReport: false,
  isGSTRReport: false,
  customDownload: false,
  dateRangeFilter: true,
  periodFilter: false,
  showLast7DaysFilter: true,
  showLast3MonthsFilter: true,
  shouldShowCustomDateFilter: true,
  dateRangeAllowed: 90,
  gstrYearsRange: 2,
  salesHierarchyFilter: { enabled: true, levelFilterField: "" },
  geographicalHierarchyFilter: { enabled: true, levelFilterField: "" },
  distributorFilter: { enabled: true, required: false },
  shouldShowCustomFilters: false,
  showAdditionalFilters: false,
  mergedFilters: [],
  sendMetadata: false,
  metadataFields: [],
  getAPI: "/rpt-generic/search?",
};

export function makeNewCard(overrides?: Partial<ReportCard>): ReportCard {
  const id = crypto.randomUUID();
  return {
    id,
    name: "New Report",
    type: "new",
    filter: "newFilter",
    isNewReport: true,
    isNewReportUi: true,
    newReportConfig: {
      ...DEFAULT_BEHAVIOR_CONFIG,
      reportName: `report_${id.slice(0, 8)}`,
    },
    ...overrides,
  };
}
