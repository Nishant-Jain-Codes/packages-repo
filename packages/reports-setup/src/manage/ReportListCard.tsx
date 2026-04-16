/**
 * ReportListCard.tsx — one row in the ManageReports grid
 *
 * Shows: [doc icon]  Report Name  [settings icon]  [toggle]
 * Matches the visual style of the screenshot (compact, two-column grid).
 */

import { Settings, FileText } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ViewMetaReport } from "./types";

interface ReportListCardProps {
  report: ViewMetaReport;
  enabled: boolean;
  onToggle: () => void;
  onEdit: () => void;
}

export function ReportListCard({
  report,
  enabled,
  onToggle,
  onEdit,
}: ReportListCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border bg-card",
        "transition-all duration-200",
        "hover:shadow-sm",
        enabled
          ? "border-l-[3px] border-l-emerald-500 border-emerald-200/60 bg-emerald-50/30"
          : "border-muted-foreground/15 text-muted-foreground",
      )}
    >
      {/* Doc icon */}
      <FileText
        className={cn(
          "h-4 w-4 shrink-0",
          enabled ? "text-emerald-600" : "text-muted-foreground/60",
        )}
      />

      {/* Report name */}
      <span
        className={cn(
          "flex-1 text-sm font-medium leading-tight truncate",
          enabled ? "text-foreground" : "text-muted-foreground/80",
        )}
        title={report.name}
      >
        {report.name}
      </span>

      {/* Settings icon — opens the config editor for this report */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7 shrink-0",
          enabled
            ? "text-muted-foreground hover:text-emerald-700 hover:bg-emerald-100/50"
            : "text-muted-foreground/50 hover:text-foreground",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        title="Configure report"
      >
        <Settings className="h-3.5 w-3.5" />
      </Button>

      {/* Toggle */}
      <Switch
        checked={enabled}
        onCheckedChange={() => onToggle()}
        onClick={(e) => e.stopPropagation()}
        className="data-[state=checked]:bg-emerald-500 shrink-0"
      />
    </div>
  );
}
