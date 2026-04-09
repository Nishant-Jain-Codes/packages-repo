import type { newReportConfig } from "@aditya-sharma-salescode/reports-ui";

/**
 * Dummy card config (mirrors generic_report / newReport UI shape) until API wiring exists.
 * Runtime groups tiles by optional `type` (see reports-ui bundle).
 */
export const DUMMY_REPORT_CARDS: (newReportConfig & { type?: string })[] = [
  {
    id: "sales_details_report",
    name: "Sales Details Report",
    type: "Delivery",
    description: "Sales Details Report",
    getAPI: "",
    templateUrl: "",
    reportName: "sales_details_report",
    isDistributorView: false,
    isLiveReport: false,
    dateRangeFilter: true,
    distributorFilter: {
      field: "distributor_code",
      label: "Select Distributor",
      enabled: true,
    },
    salesHierarchyFilter: {
      enabled: true,
      hierarchyOrder: [
        "saleshead",
        "nsm",
        "rsm",
        "zm",
        "asm",
        "tsm",
        "tgo",
        "sde",
        "supplier",
      ],
      levelFilterField: "salesLevel",
      levelFilterLabel: "Select Level",
      valueFilterField: "salesValue",
      valueFilterLabel: "Select Value",
    },
    shouldShowCustomFilters: true,
    geographicalHierarchyFilter: {
      enabled: true,
      levelFilterField: "geographicalLevel",
      levelFilterLabel: "Select Geographical Level",
      valueFilterField: "geographicalValue",
      valueFilterLabel: "Select Geographical Value",
    },
  },
];
