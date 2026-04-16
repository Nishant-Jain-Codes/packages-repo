/**
 * ManageReports.tsx — Select & configure reports for the portal
 *
 * Usage:
 * ```tsx
 * <ReportsProvider
 *   config={{
 *     initialConfig: tenantJson,
 *     onConfigUpdate: (updated) => localStorage.setItem("config", JSON.stringify(updated)),
 *     onEditReport: (id) => navigate(`/report-config?reportId=${id}`),
 *   }}
 * >
 *   <ManageReports onBack={() => navigate(-1)} onContinue={() => navigate("/next")} />
 * </ReportsProvider>
 * ```
 *
 * Data flow:
 *  - viewMeta.reports     → catalog of ALL available reports (left-side source of truth)
 *  - features.reports.config.report_list → enabled reports (persisted shape)
 *  - Toggle ON  → copy entry from catalog into report_list
 *  - Toggle OFF → delete the entire config object from report_list
 *  - Every change fires onConfigUpdate(updatedConfig) and writes to localStorage
 */

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReportsConfig } from "../provider";
import { useManageReportsStore } from "./useManageReportsStore";
import { ReportListCard } from "./ReportListCard";

interface ManageReportsProps {
  /** Called when the user clicks the Back button. */
  onBack?: () => void;
  /** Called when the user clicks the Continue button. */
  onContinue?: () => void;
  /**
   * Override the provider's `onEditReport`.
   * Receives the report ID → consumer navigates to the config editor.
   */
  onEditReport?: (reportId: string) => void;
  /**
   * When true, hides header, search bar, and bottom navigation.
   * Use when embedding ManageReports inside another layout.
   */
  minimal?: boolean;
}

export function ManageReports({
  onBack,
  onContinue,
  onEditReport: onEditReportProp,
  minimal = false,
}: ManageReportsProps) {
  const { initialConfig, onConfigUpdate, onEditReport: onEditReportCtx } =
    useReportsConfig();

  const handleEditReport = onEditReportProp ?? onEditReportCtx;

  const { init, toggleReport, isEnabled, getGroupedReports } =
    useManageReportsStore();

  const [search, setSearch] = useState("");

  // ── Initialise store on mount ────────────────────────────────────────────
  useEffect(() => {
    init(initialConfig ?? {}, onConfigUpdate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Build grouped + filtered view ────────────────────────────────────────
  const grouped = getGroupedReports();
  const sectionKeys = Object.keys(grouped).sort((a, b) => {
    // Empty-key group (uncategorised) goes last
    if (!a) return 1;
    if (!b) return -1;
    return a.localeCompare(b);
  });

  const filteredGrouped: Record<string, typeof grouped[string]> = {};
  const q = search.toLowerCase();
  for (const key of sectionKeys) {
    const matches = grouped[key].filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q) ||
        (r.reportName ?? "").toLowerCase().includes(q),
    );
    if (matches.length > 0) filteredGrouped[key] = matches;
  }

  const totalReports = Object.values(grouped).reduce(
    (s, v) => s + v.length,
    0,
  );
  const enabledCount = Object.values(grouped)
    .flat()
    .filter((r) => isEnabled(r.id)).length;

  return (
    <div className={`flex flex-col bg-background ${minimal ? 'h-full' : 'h-screen'}`}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      {!minimal && (
      <div className="border-b bg-card/80 backdrop-blur-sm px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Manage Reports
              </h1>
              <p className="text-sm text-muted-foreground">
                Select reports to include in your app. Click{" "}
                <span className="inline-flex items-center gap-0.5 font-medium text-foreground">
                  ⚙
                </span>{" "}
                on a report to configure its filters.
              </p>
            </div>
          </div>

          {/* Badge: X / Y enabled */}
          <div className="text-sm text-muted-foreground tabular-nums">
            <span className="font-semibold text-foreground">{enabledCount}</span>
            {" / "}
            {totalReports} enabled
          </div>
        </div>
      </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-5 space-y-8">

          {/* Search */}
          {!minimal && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          )}

          {/* Sections */}
          {Object.keys(filteredGrouped).length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground">
                {search
                  ? "No reports match your search."
                  : "No reports found. Make sure viewMeta.reports is populated in your initialConfig."}
              </p>
            </div>
          ) : (
            Object.entries(filteredGrouped).map(([section, reports]) => (
              <div key={section || "__uncategorised__"}>
                {/* Section header */}
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs font-semibold tracking-widest uppercase text-emerald-700/70">
                    {section || "Reports"}
                  </p>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Two-column grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {reports.map((report) => (
                    <ReportListCard
                      key={report.id}
                      report={report}
                      enabled={isEnabled(report.id)}
                      onToggle={() => toggleReport(report.id)}
                      onEdit={() => handleEditReport?.(report.id)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Bottom navigation ────────────────────────────────────────────── */}
      {!minimal && (
      <div className="border-t bg-card/80 backdrop-blur-sm px-6 py-3 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            className="gap-2"
            onClick={onBack}
            disabled={!onBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={onContinue}
            disabled={!onContinue}
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      )}
    </div>
  );
}
