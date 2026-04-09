/**
 * VoiceActionFeed.tsx
 *
 * Floating overlay (bottom-left) that shows a stack of voice action pills.
 * Each pill slides in from the left, stays 3 s, then fades out.
 * Purely visual — no interaction needed.
 */

import {
  Check, Plus, Trash2, Copy, Wand2, FilePlus, Pencil,
  LayoutTemplate, BarChart2, ToggleLeft, Filter, RotateCcw,
  ArrowRight, Save, List, Database, Shield, Zap, GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceActionFeed, type FeedEntry } from "./VoiceActionFeedContext";

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  check:        Check,
  plus:         Plus,
  trash:        Trash2,
  copy:         Copy,
  wand:         Wand2,
  "file-plus":  FilePlus,
  pencil:       Pencil,
  layout:       LayoutTemplate,
  "bar-chart":  BarChart2,
  toggle:       ToggleLeft,
  filter:       Filter,
  "rotate-ccw": RotateCcw,
  "arrow-right":ArrowRight,
  save:         Save,
  list:         List,
  database:     Database,
  shield:       Shield,
  zap:          Zap,
  "git-branch": GitBranch,
};

// ─── Color map ────────────────────────────────────────────────────────────────

const COLOR_CLASSES: Record<FeedEntry["color"], { bg: string; border: string; text: string; icon: string }> = {
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/60", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-800 dark:text-emerald-200", icon: "text-emerald-600" },
  blue:    { bg: "bg-blue-50 dark:bg-blue-950/60",       border: "border-blue-200 dark:border-blue-800",       text: "text-blue-800 dark:text-blue-200",       icon: "text-blue-600" },
  red:     { bg: "bg-red-50 dark:bg-red-950/60",         border: "border-red-200 dark:border-red-800",         text: "text-red-800 dark:text-red-200",         icon: "text-red-600" },
  amber:   { bg: "bg-amber-50 dark:bg-amber-950/60",     border: "border-amber-200 dark:border-amber-800",     text: "text-amber-800 dark:text-amber-200",     icon: "text-amber-600" },
  purple:  { bg: "bg-purple-50 dark:bg-purple-950/60",   border: "border-purple-200 dark:border-purple-800",   text: "text-purple-800 dark:text-purple-200",   icon: "text-purple-600" },
  slate:   { bg: "bg-slate-50 dark:bg-slate-900/60",     border: "border-slate-200 dark:border-slate-700",     text: "text-slate-700 dark:text-slate-300",     icon: "text-slate-500" },
};

// ─── Single pill ──────────────────────────────────────────────────────────────

function FeedPill({ entry }: { entry: FeedEntry }) {
  const colors = COLOR_CLASSES[entry.color];
  const IconComponent = ICON_MAP[entry.icon] ?? Check;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm",
      "text-xs font-medium max-w-[260px] backdrop-blur-sm",
      colors.bg, colors.border, colors.text,
      entry.exiting ? "animate-feed-exit" : "animate-feed-enter",
    )}>
      <IconComponent className={cn("h-3.5 w-3.5 shrink-0", colors.icon)} />
      <span className="truncate">{entry.label}</span>
    </div>
  );
}

// ─── Feed overlay ─────────────────────────────────────────────────────────────

export function VoiceActionFeed() {
  const { entries } = useVoiceActionFeed();

  if (!entries.length) return null;

  return (
    <div className="fixed bottom-6 left-4 z-50 flex flex-col gap-2 pointer-events-none">
      {entries.map((entry) => (
        <FeedPill key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
