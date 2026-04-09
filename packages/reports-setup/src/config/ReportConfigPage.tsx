/**
 * ReportConfigPage.tsx  —  T1 + T2 + T3 enhanced
 *
 * T1  Unsaved-changes dot · Auto-generate report key · Voice highlight on toggles · Role switcher
 * T2  Clone report · Bulk-set voice op · Diff modal before save · Inline validation
 * T3  AI config suggestion (rule-based) · Undo stack (cardHistory) · Voice onboarding hint
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus, Trash2, ChevronLeft, Save, Mic2,
  BarChart2, Settings2, Filter, Database, SlidersHorizontal,
  AlertCircle, Shield, Copy, Wand2, RotateCcw, GitCompare, Eye,
} from "lucide-react";

import { Button }      from "@/components/ui/button";
import { Input }       from "@/components/ui/input";
import { Badge }       from "@/components/ui/badge";
import { Switch }      from "@/components/ui/switch";
import { Label }       from "@/components/ui/label";
import { Separator }   from "@/components/ui/separator";
import { ScrollArea }  from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useVoiceAgentContext } from "@/features/form-builder/voice/VoiceAgentContext";

import {
  type ReportCard,
  type ReportBehaviorConfig,
  type MergedFilterSource,
  makeNewCard,
} from "./types";
import { BEHAVIOR_FLAG_ALIASES, SECTION_ALIASES } from "./reportConfigRegistry";
import { saveReportConfig, loadReportConfig, saveReportConfigLocal } from "./reportConfigService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const MAX_HISTORY = 20;

/** Rule-based config suggestion based on report name keywords */
function suggestConfig(card: ReportCard): { flags: Record<string, boolean>; message: string } {
  const text = `${card.name} ${card.newReportConfig.reportName}`.toLowerCase();
  const flags: Record<string, boolean> = {};
  const hints: string[] = [];

  if (text.includes("live")) {
    flags.isLiveReport = true;
    hints.push("Live Report");
  }
  if (text.includes("pdf")) {
    flags.isPDFReport = true;
    hints.push("PDF Report");
  }
  if (text.includes("gstr") || text.includes("gst")) {
    flags.isGSTRReport = true;
    hints.push("GSTR Report");
  }
  if (text.includes("sales") || text.includes("asm") || text.includes("rsm")) {
    flags["salesHierarchyFilter.enabled"] = true;
    hints.push("Sales Hierarchy");
  }
  if (text.includes("geo") || text.includes("region") || text.includes("territory")) {
    flags["geographicalHierarchyFilter.enabled"] = true;
    hints.push("Geo Hierarchy");
  }
  if (text.includes("dist")) {
    flags["distributorFilter.enabled"] = true;
    hints.push("Distributor Filter");
  }
  if (!flags.isGSTRReport) {
    flags.dateRangeFilter = true;
    flags.showLast7DaysFilter = true;
    hints.push("Date Range", "Last 7 Days");
  }

  const message = hints.length
    ? `Suggested: ${hints.join(", ")} — based on report name.`
    : "No specific flags suggested. Enabled Date Range as default.";

  return { flags, message };
}

// ─── Inner page ───────────────────────────────────────────────────────────────

function ReportConfigInner() {
  const navigate = useNavigate();
  const { registerUICallbacks, actions: { setStage } } = useVoiceAgentContext();
  useEffect(() => { setStage("report-config"); }, []);

  // ── Core state ─────────────────────────────────────────────────────────────
  const [cards, setCards]             = useState<ReportCard[]>([]);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState("basic");

  // T1 – Role switcher
  const [rolePrefix, setRolePrefix]   = useState<string>("generic");

  // T1 – Unsaved changes tracking
  const [savedCards, setSavedCards]   = useState<ReportCard[]>([]);

  // T1 – Voice highlight on last-changed toggle path (e.g. "isLiveReport")
  const [voiceHighlightPath, setVoiceHighlightPath] = useState<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // T2 – Diff modal
  const [showDiffModal, setShowDiffModal] = useState(false);

  // T3 – Undo stack
  const [cardHistory, setCardHistory] = useState<ReportCard[][]>([]);

  const cardsRef = useRef(cards);
  cardsRef.current = cards;

  // Tracks selectedId synchronously — setSelectedId is async (re-render), so closures
  // inside voiceDispatch (e.g. RC_SET_DISPLAY_NAME right after RC_CREATE_REPORT) must
  // read from this ref to get the ID that was just set in the same callback tick.
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;

  const selectedCard = cards.find((c) => c.id === selectedId) ?? null;

  // T1 – unsaved card IDs (compare JSON)
  const unsavedIds = new Set(
    cards
      .filter((c) => {
        const saved = savedCards.find((s) => s.id === c.id);
        return !saved || JSON.stringify(saved) !== JSON.stringify(c);
      })
      .map((c) => c.id)
  );
  const hasUnsavedChanges = unsavedIds.size > 0 || cards.length !== savedCards.length;

  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadReportConfig(rolePrefix).then((loaded) => {
      setCards(loaded.length ? loaded : []);
      setSavedCards(loaded.length ? JSON.parse(JSON.stringify(loaded)) : []);
      setLoading(false);
    });
  }, [rolePrefix]);

  // ── Auto-save to localStorage on every cards change (after initial load) ───
  // Ensures voice-created reports survive navigation and appear in preview.
  useEffect(() => {
    if (!loading) saveReportConfigLocal(cards, rolePrefix);
  }, [cards, loading, rolePrefix]);

  // ── Push to history before a batch mutation ───────────────────────────────
  const pushHistory = useCallback(() => {
    setCardHistory((prev) => {
      const next = [...prev, JSON.parse(JSON.stringify(cardsRef.current))];
      return next.slice(-MAX_HISTORY);
    });
  }, []);

  // ── Card updaters ─────────────────────────────────────────────────────────
  const updateCard = useCallback((id: string, patch: Partial<Omit<ReportCard, "newReportConfig">>) => {
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c));
  }, []);

  const updateConfig = useCallback((id: string, patch: Partial<ReportBehaviorConfig>) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, newReportConfig: { ...c.newReportConfig, ...patch } } : c
      )
    );
  }, []);

  const updateNestedConfig = useCallback((id: string, fieldPath: string, value: boolean) => {
    const [top, sub] = fieldPath.split(".");
    if (!sub) { updateConfig(id, { [top]: value } as any); return; }
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const topObj = (c.newReportConfig as any)[top] ?? {};
        return { ...c, newReportConfig: { ...c.newReportConfig, [top]: { ...topObj, [sub]: value } } };
      })
    );
  }, [updateConfig]);

  // T1 – voice highlight helper
  const flashHighlight = useCallback((path: string) => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    setVoiceHighlightPath(path);
    highlightTimerRef.current = setTimeout(() => setVoiceHighlightPath(null), 1800);
  }, []);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addCard = useCallback(() => {
    pushHistory();
    const card = makeNewCard();
    setCards((prev) => [...prev, card]);
    setSelectedId(card.id);
    setActiveTab("basic");
  }, [pushHistory]);

  const deleteCard = useCallback((id: string) => {
    const card = cardsRef.current.find((c) => c.id === id);
    if (!card) return;
    if (card.isMandatory) { toast.error(`"${card.name}" is mandatory and cannot be deleted.`); return; }
    pushHistory();
    setCards((prev) => prev.filter((c) => c.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
    toast.success(`"${card.name}" removed.`);
  }, [pushHistory]);

  // T2 – Clone
  const cloneCard = useCallback((id: string) => {
    const card = cardsRef.current.find((c) => c.id === id);
    if (!card) return;
    pushHistory();
    const cloned = makeNewCard({
      name: `${card.name} (Copy)`,
      isMandatory: false,
      newReportConfig: { ...card.newReportConfig, reportName: `${card.newReportConfig.reportName}_copy` },
    });
    setCards((prev) => [...prev, cloned]);
    setSelectedId(cloned.id);
    toast.success(`Cloned "${card.name}"`);
  }, [pushHistory]);

  // ── Validation ────────────────────────────────────────────────────────────
  const validateCards = useCallback((): string[] => {
    const errors: string[] = [];
    cardsRef.current.forEach((c) => {
      if (!c.newReportConfig.reportName?.trim()) {
        errors.push(`"${c.name}" is missing a Report Key.`);
      }
      if (c.name === "New Report") {
        errors.push(`A report still has the default name "New Report" — please rename it.`);
      }
    });
    return errors;
  }, []);

  // ── Save ─────────────────────────────────────────────────────────────────
  const doSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveReportConfig(cardsRef.current, rolePrefix);
      setSavedCards(JSON.parse(JSON.stringify(cardsRef.current)));
      toast.success("Report configuration saved!");
    } catch {
      toast.error("Save failed — please try again.");
    } finally {
      setSaving(false);
      setShowDiffModal(false);
    }
  }, [rolePrefix]);

  const handleSave = useCallback(async () => {
    const errors = validateCards();
    if (errors.length) {
      errors.forEach((e) => toast.error(e));
      return;
    }
    if (hasUnsavedChanges) {
      setShowDiffModal(true);
    } else {
      await doSave();
    }
  }, [validateCards, hasUnsavedChanges, doSave]);

  // ── Voice dispatch ────────────────────────────────────────────────────────
  const voiceDispatch = useCallback((action: any): string => {
    const all = cardsRef.current;

    switch (action.type) {
      case "RC_SELECT_REPORT": {
        const card = all.find((c) => c.name.toLowerCase().includes((action.name ?? "").toLowerCase()));
        if (card) { setSelectedId(card.id); setActiveTab("basic"); return `Selected "${card.name}".`; }
        return `Report "${action.name}" not found. Available: ${all.map((c) => c.name).join(", ") || "none"}.`;
      }

      case "RC_CREATE_REPORT": {
        pushHistory();
        const card = makeNewCard();
        setCards((prev) => [...prev, card]);
        setSelectedId(card.id);
        selectedIdRef.current = card.id; // update ref immediately so RC_SET_DISPLAY_NAME in same tick can see it
        setActiveTab("basic");
        return "New report created. Please set the display name and report key.";
      }

      case "RC_DELETE_REPORT": {
        const card = all.find((c) => c.name.toLowerCase().includes((action.name ?? "").toLowerCase()));
        if (!card) return `Report "${action.name}" not found.`;
        if (card.isMandatory) return `"${card.name}" is mandatory and cannot be deleted.`;
        deleteCard(card.id);
        return `"${card.name}" deleted.`;
      }

      case "RC_GO_TO_SECTION": {
        const section = SECTION_ALIASES[action.section?.toLowerCase()] ?? action.section;
        if (section) { setActiveTab(section); return `Jumped to ${section} section.`; }
        return `Unknown section "${action.section}".`;
      }

      case "RC_SET_DISPLAY_NAME": {
        const targetId = selectedIdRef.current; // use ref — state may not have propagated yet
        if (!targetId) return "No report selected. Say 'select <report name>' first.";
        const val = String(action.value);
        updateCard(targetId, { name: val });
        // T1: auto-generate key if still default
        const autoKey = slugify(val);
        updateConfig(targetId, { reportName: autoKey });
        return `Display name set to "${val}". Report key auto-set to "${autoKey}".`;
      }

      case "RC_SET_REPORT_KEY": {
        if (!selectedId) return "No report selected.";
        updateConfig(selectedId, { reportName: String(action.value) });
        return `Report key set to "${action.value}".`;
      }

      case "RC_TOGGLE_FLAG": {
        if (!selectedId) return "No report selected.";
        const rawFlag: string = action.flag ?? "";
        const fieldPath = BEHAVIOR_FLAG_ALIASES[rawFlag.toLowerCase()] ?? rawFlag;
        const value = Boolean(action.value);
        pushHistory();
        updateNestedConfig(selectedId, fieldPath, value);
        flashHighlight(fieldPath);
        // Jump to the relevant tab
        if (fieldPath.includes("Hierarchy") || fieldPath.includes("distributor")) setActiveTab("hierarchy");
        else if (fieldPath.includes("metadata") || fieldPath === "sendMetadata") setActiveTab("metadata");
        else if (fieldPath.includes("Filter") && !fieldPath.includes("dateRange")) setActiveTab("filters");
        else setActiveTab("behavior");
        return `${rawFlag || fieldPath} ${value ? "enabled" : "disabled"}.`;
      }

      case "RC_SET_VALUE": {
        if (!selectedId) return "No report selected.";
        updateConfig(selectedId, { [action.field]: action.value } as any);
        return `${action.field} set to ${action.value}.`;
      }

      case "RC_SAVE_CONFIG":
        // Call doSave directly — voice intent is already confirmed, skip the diff modal
        doSave();
        return "Saving configuration now.";

      case "RC_LIST_REPORTS":
        if (!all.length) return "No reports configured yet. Say 'create report' to add one.";
        return `${all.length} report${all.length > 1 ? "s" : ""}: ${all.map((c) => c.name).join(", ")}.`;

      // T2 – Clone
      case "RC_CLONE_REPORT": {
        const src = all.find((c) => c.name.toLowerCase().includes((action.name ?? "").toLowerCase()));
        if (!src) return `Report "${action.name}" not found.`;
        const newName = action.newName || `${src.name} (Copy)`;
        const cloned = makeNewCard({
          name: newName,
          isMandatory: false,
          newReportConfig: { ...src.newReportConfig, reportName: `${src.newReportConfig.reportName}_copy` },
        });
        pushHistory();
        setCards((prev) => [...prev, cloned]);
        setSelectedId(cloned.id);
        return `Cloned "${src.name}" as "${newName}".`;
      }

      // T3 – AI suggest config
      case "RC_SUGGEST_CONFIG": {
        if (!selectedId) return "No report selected. Say 'select <report name>' first.";
        const card = all.find((c) => c.id === selectedId);
        if (!card) return "Report not found.";
        pushHistory();
        const { flags, message } = suggestConfig(card);
        Object.entries(flags).forEach(([path, val]) => updateNestedConfig(selectedId, path, val));
        setActiveTab("behavior");
        return message;
      }

      // T2 – Bulk set flag across ALL reports
      case "RC_BULK_SET": {
        const rawFlag: string = action.flag ?? "";
        const fieldPath = BEHAVIOR_FLAG_ALIASES[rawFlag.toLowerCase()] ?? rawFlag;
        const value = Boolean(action.value);
        pushHistory();
        all.forEach((c) => updateNestedConfig(c.id, fieldPath, value));
        return `${rawFlag} ${value ? "enabled" : "disabled"} on all ${all.length} reports.`;
      }

      // T3 – Undo
      case "RC_UNDO": {
        if (!cardHistory.length) return "Nothing to undo.";
        const prev = cardHistory[cardHistory.length - 1];
        setCardHistory((h) => h.slice(0, -1));
        setCards(prev);
        return "Undone.";
      }

      default:
        return "Unknown report config action.";
    }
  }, [
    selectedId, updateCard, updateConfig, updateNestedConfig,
    deleteCard, handleSave, doSave, cloneCard, pushHistory, cardHistory, flashHighlight,
  ]);

  // Only register (and flush pending RC actions) after loadReportConfig has resolved.
  // Registering while loading=true causes the flush to run before setCards(loaded),
  // so the loaded data would overwrite the just-created report card.
  useEffect(() => {
    if (loading) return;
    registerUICallbacks({ reportConfigDispatch: voiceDispatch });
  }, [loading, voiceDispatch, registerUICallbacks]);

  const cfg = selectedCard?.newReportConfig;

  // ── Diff summary for T2 modal ─────────────────────────────────────────────
  const diffLines: string[] = [];
  cards.forEach((c) => {
    if (!savedCards.find((s) => s.id === c.id)) {
      diffLines.push(`• "${c.name}" — NEW`);
    } else if (unsavedIds.has(c.id)) {
      diffLines.push(`• "${c.name}" — modified`);
    }
  });
  savedCards.forEach((s) => {
    if (!cards.find((c) => c.id === s.id)) {
      diffLines.push(`• "${s.name}" — DELETED`);
    }
  });

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3 bg-card border-b shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <BarChart2 className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg">Report Configuration</span>
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {cards.length} report{cards.length !== 1 ? "s" : ""}
          </Badge>
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-400/50 bg-amber-50 dark:bg-amber-950/20">
              Unsaved changes
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* T1 – Role switcher */}
          <Select value={rolePrefix} onValueChange={setRolePrefix}>
            <SelectTrigger className="h-8 text-xs w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="generic">Generic</SelectItem>
              <SelectItem value="asm">ASM</SelectItem>
              <SelectItem value="rsm">RSM</SelectItem>
              <SelectItem value="nse">NSE</SelectItem>
            </SelectContent>
          </Select>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
                  <Mic2 className="h-3.5 w-3.5" />
                  Voice-assisted
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-[260px]">
                  "select outlet master" · "enable pdf" · "clone sales report" · "suggest config" · "save config"
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* T3 – Undo */}
          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 text-muted-foreground"
            disabled={cardHistory.length === 0}
            onClick={() => {
              if (!cardHistory.length) return;
              const prev = cardHistory[cardHistory.length - 1];
              setCardHistory((h) => h.slice(0, -1));
              setCards(prev);
              toast.success("Undone");
            }}
            title="Undo last change"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            variant="outline" size="sm"
            onClick={() => navigate("/report-preview")}
            disabled={!cards.length}
            title="Switch to report preview"
          >
            <Eye className="h-4 w-4 mr-1.5" />
            Preview
          </Button>

          <Button onClick={handleSave} disabled={saving || !cards.length} size="sm" className="relative">
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? "Saving…" : "Save All"}
            {hasUnsavedChanges && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400 border border-background" />
            )}
          </Button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left panel ───────────────────────────────────────────────── */}
        <aside className="w-72 flex flex-col border-r bg-card/40">
          <div className="px-4 py-3 border-b">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Reports</p>
          </div>

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading…</div>
            ) : cards.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <BarChart2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
                No reports yet.<br />Add one below or say "create report".
              </div>
            ) : (
              <div className="py-1">
                {cards.map((card) => (
                  <ReportListItem
                    key={card.id}
                    card={card}
                    isSelected={card.id === selectedId}
                    isDirty={unsavedIds.has(card.id)}
                    onSelect={() => { setSelectedId(card.id); setActiveTab("basic"); }}
                    onDelete={() => deleteCard(card.id)}
                    onClone={() => cloneCard(card.id)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="p-3 border-t">
            <Button variant="outline" size="sm" className="w-full" onClick={addCard}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add New Report
            </Button>
          </div>
        </aside>

        {/* ── Right panel ──────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {!selectedCard ? (
            <EmptyEditor />
          ) : (
            <>
              <ScrollArea className="flex-1">
                <div className="p-6 max-w-3xl mx-auto w-full">
                  {/* T2 – AI suggest strip */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-muted/40 rounded-lg border border-dashed">
                    <p className="text-xs text-muted-foreground">
                      Smart suggestions based on report name &amp; key
                    </p>
                    <Button
                      variant="outline" size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => {
                        const { flags, message } = suggestConfig(selectedCard);
                        pushHistory();
                        Object.entries(flags).forEach(([path, val]) =>
                          updateNestedConfig(selectedCard.id, path, val)
                        );
                        setActiveTab("behavior");
                        toast.success(message);
                      }}
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                      Auto-suggest
                    </Button>
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-6 w-full grid grid-cols-5 h-auto">
                      {[
                        { id: "basic",     icon: <Settings2 className="h-3.5 w-3.5 mr-1" />,          label: "Basic" },
                        { id: "behavior",  icon: <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />,  label: "Behavior" },
                        { id: "hierarchy", icon: <Shield className="h-3.5 w-3.5 mr-1" />,             label: "Hierarchy" },
                        { id: "filters",   icon: <Filter className="h-3.5 w-3.5 mr-1" />,             label: "Filters" },
                        { id: "metadata",  icon: <Database className="h-3.5 w-3.5 mr-1" />,           label: "Metadata" },
                      ].map((tab) => (
                        <TabsTrigger key={tab.id} value={tab.id} className="text-xs py-2 flex items-center justify-center">
                          {tab.icon}{tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {/* ── Basic Info ─────────────────────────────────────────── */}
                    <TabsContent value="basic">
                      <SectionCard title="Basic Info">
                        <FieldRow label="Display Name" hint="Shown to users in the report list">
                          <Input
                            value={selectedCard.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateCard(selectedCard.id, { name: val });
                              // T1: auto-generate key
                              updateConfig(selectedCard.id, { reportName: slugify(val) });
                            }}
                            placeholder="e.g. Outlet Master Report"
                          />
                        </FieldRow>
                        <FieldRow label="Report Key" hint="Internal key used in API calls (snake_case)" className="mt-3">
                          <Input
                            value={cfg?.reportName ?? ""}
                            onChange={(e) => updateConfig(selectedCard.id, { reportName: e.target.value })}
                            className="font-mono"
                            placeholder="e.g. outlet_master_report"
                          />
                          {/* T2 – Inline validation */}
                          {!cfg?.reportName?.trim() && (
                            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                              <AlertCircle className="h-3 w-3" />
                              Report key is required before saving.
                            </p>
                          )}
                        </FieldRow>
                        <FieldRow label="API Endpoint" hint="GET endpoint for report data" className="mt-3">
                          <Input
                            value={cfg?.getAPI ?? ""}
                            onChange={(e) => updateConfig(selectedCard.id, { getAPI: e.target.value })}
                            className="font-mono text-sm"
                            placeholder="/rpt-generic/search?"
                          />
                        </FieldRow>
                        <div className="flex items-center gap-3 pt-3">
                          <Switch
                            id={`mandatory-${selectedCard.id}`}
                            checked={!!selectedCard.isMandatory}
                            onCheckedChange={(v) => updateCard(selectedCard.id, { isMandatory: v })}
                          />
                          <Label htmlFor={`mandatory-${selectedCard.id}`} className="text-sm cursor-pointer">
                            Mandatory report (cannot be deleted)
                          </Label>
                        </div>
                      </SectionCard>
                    </TabsContent>

                    {/* ── Behavior ──────────────────────────────────────────── */}
                    <TabsContent value="behavior">
                      <SectionCard title="Report Type">
                        <div className="grid grid-cols-2 gap-3">
                          <VoiceToggleRow id="isLiveReport" label="Live Report"
                            checked={!!cfg?.isLiveReport}
                            onChange={(v) => { pushHistory(); updateConfig(selectedCard.id, { isLiveReport: v }); }}
                            hint="Preview disabled; data is real-time"
                            highlighted={voiceHighlightPath === "isLiveReport"} />
                          <VoiceToggleRow id="isPDFReport" label="PDF Report"
                            checked={!!cfg?.isPDFReport}
                            onChange={(v) => { pushHistory(); updateConfig(selectedCard.id, { isPDFReport: v }); }}
                            hint="Only PDF download available"
                            highlighted={voiceHighlightPath === "isPDFReport"} />
                          <VoiceToggleRow id="isGSTRReport" label="GSTR Report"
                            checked={!!cfg?.isGSTRReport}
                            onChange={(v) => { pushHistory(); updateConfig(selectedCard.id, { isGSTRReport: v }); }}
                            hint="GSTR-specific year range selector"
                            highlighted={voiceHighlightPath === "isGSTRReport"} />
                          <VoiceToggleRow id="customDownload" label="Custom Download"
                            checked={!!cfg?.customDownload}
                            onChange={(v) => { pushHistory(); updateConfig(selectedCard.id, { customDownload: v }); }}
                            hint="Non-standard download handler"
                            highlighted={voiceHighlightPath === "customDownload"} />
                        </div>
                      </SectionCard>

                      <SectionCard title="Date Controls" className="mt-4">
                        <div className="grid grid-cols-2 gap-3">
                          <VoiceToggleRow id="dateRangeFilter" label="Date Range Filter"
                            checked={!!cfg?.dateRangeFilter}
                            onChange={(v) => { pushHistory(); updateConfig(selectedCard.id, { dateRangeFilter: v }); }}
                            highlighted={voiceHighlightPath === "dateRangeFilter"} />
                          <VoiceToggleRow id="periodFilter" label="Period Filter"
                            checked={!!cfg?.periodFilter}
                            onChange={(v) => { pushHistory(); updateConfig(selectedCard.id, { periodFilter: v }); }}
                            highlighted={voiceHighlightPath === "periodFilter"} />
                          <VoiceToggleRow id="showLast7Days" label="Last 7 Days Quick"
                            checked={!!cfg?.showLast7DaysFilter}
                            onChange={(v) => { pushHistory(); updateConfig(selectedCard.id, { showLast7DaysFilter: v }); }}
                            highlighted={voiceHighlightPath === "showLast7DaysFilter"} />
                          <VoiceToggleRow id="showLast3Months" label="Last 3 Months Quick"
                            checked={!!cfg?.showLast3MonthsFilter}
                            onChange={(v) => { pushHistory(); updateConfig(selectedCard.id, { showLast3MonthsFilter: v }); }}
                            highlighted={voiceHighlightPath === "showLast3MonthsFilter"} />
                          <VoiceToggleRow id="customDate" label="Custom Date Filter"
                            checked={!!cfg?.shouldShowCustomDateFilter}
                            onChange={(v) => { pushHistory(); updateConfig(selectedCard.id, { shouldShowCustomDateFilter: v }); }}
                            highlighted={voiceHighlightPath === "shouldShowCustomDateFilter"} />
                        </div>
                        <Separator className="my-4" />
                        <div className="grid grid-cols-2 gap-4">
                          <FieldRow label="Date Range Allowed (days)">
                            <Input type="number" value={cfg?.dateRangeAllowed ?? 90}
                              onChange={(e) => updateConfig(selectedCard.id, { dateRangeAllowed: Number(e.target.value) })} />
                          </FieldRow>
                          <FieldRow label="GSTR Years Range">
                            <Input type="number" value={cfg?.gstrYearsRange ?? 2}
                              onChange={(e) => updateConfig(selectedCard.id, { gstrYearsRange: Number(e.target.value) })} />
                          </FieldRow>
                        </div>
                      </SectionCard>
                    </TabsContent>

                    {/* ── Hierarchy ─────────────────────────────────────────── */}
                    <TabsContent value="hierarchy">
                      <SectionCard title="Sales Hierarchy Filter">
                        <VoiceToggleRow id="salesEnabled" label="Enable Sales Hierarchy"
                          checked={!!cfg?.salesHierarchyFilter?.enabled}
                          onChange={(v) => { pushHistory(); updateNestedConfig(selectedCard.id, "salesHierarchyFilter.enabled", v); }}
                          highlighted={voiceHighlightPath === "salesHierarchyFilter.enabled"} />
                        {cfg?.salesHierarchyFilter?.enabled && (
                          <FieldRow label="Level Filter Field" hint="API key for the level filter" className="mt-3">
                            <Input
                              value={cfg.salesHierarchyFilter.levelFilterField}
                              onChange={(e) => setCards((prev) => prev.map((c) =>
                                c.id === selectedCard.id
                                  ? { ...c, newReportConfig: { ...c.newReportConfig, salesHierarchyFilter: { ...c.newReportConfig.salesHierarchyFilter, levelFilterField: e.target.value } } }
                                  : c
                              ))}
                              className="font-mono" placeholder="e.g. salesLevel" />
                          </FieldRow>
                        )}
                      </SectionCard>

                      <SectionCard title="Geographical Hierarchy Filter" className="mt-4">
                        <VoiceToggleRow id="geoEnabled" label="Enable Geo Hierarchy"
                          checked={!!cfg?.geographicalHierarchyFilter?.enabled}
                          onChange={(v) => { pushHistory(); updateNestedConfig(selectedCard.id, "geographicalHierarchyFilter.enabled", v); }}
                          highlighted={voiceHighlightPath === "geographicalHierarchyFilter.enabled"} />
                        {cfg?.geographicalHierarchyFilter?.enabled && (
                          <FieldRow label="Level Filter Field" className="mt-3">
                            <Input
                              value={cfg.geographicalHierarchyFilter.levelFilterField}
                              onChange={(e) => setCards((prev) => prev.map((c) =>
                                c.id === selectedCard.id
                                  ? { ...c, newReportConfig: { ...c.newReportConfig, geographicalHierarchyFilter: { ...c.newReportConfig.geographicalHierarchyFilter, levelFilterField: e.target.value } } }
                                  : c
                              ))}
                              className="font-mono" placeholder="e.g. geoLevel" />
                          </FieldRow>
                        )}
                      </SectionCard>

                      <SectionCard title="Distributor Filter" className="mt-4">
                        <div className="flex flex-col gap-3">
                          <VoiceToggleRow id="distEnabled" label="Enable Distributor Filter"
                            checked={!!cfg?.distributorFilter?.enabled}
                            onChange={(v) => { pushHistory(); updateNestedConfig(selectedCard.id, "distributorFilter.enabled", v); }}
                            highlighted={voiceHighlightPath === "distributorFilter.enabled"} />
                          {cfg?.distributorFilter?.enabled && (
                            <VoiceToggleRow id="distRequired" label="Distributor Required (blocks preview if not selected)"
                              checked={!!cfg.distributorFilter.required}
                              onChange={(v) => setCards((prev) => prev.map((c) =>
                                c.id === selectedCard.id
                                  ? { ...c, newReportConfig: { ...c.newReportConfig, distributorFilter: { ...c.newReportConfig.distributorFilter, required: v } } }
                                  : c
                              ))}
                              highlighted={false} />
                          )}
                        </div>
                      </SectionCard>
                    </TabsContent>

                    {/* ── Filters ───────────────────────────────────────────── */}
                    <TabsContent value="filters">
                      <SectionCard title="Custom Filters">
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <VoiceToggleRow id="customFilters" label="Show Custom Filters"
                            checked={!!cfg?.shouldShowCustomFilters}
                            onChange={(v) => { pushHistory(); updateConfig(selectedCard.id, { shouldShowCustomFilters: v }); }}
                            highlighted={voiceHighlightPath === "shouldShowCustomFilters"} />
                          <VoiceToggleRow id="additionalFilters" label="Show Additional Filters"
                            checked={!!cfg?.showAdditionalFilters}
                            onChange={(v) => { pushHistory(); updateConfig(selectedCard.id, { showAdditionalFilters: v }); }}
                            highlighted={voiceHighlightPath === "showAdditionalFilters"} />
                        </div>
                      </SectionCard>

                      <SectionCard title="Merged Filters" className="mt-4">
                        <p className="text-xs text-muted-foreground mb-3">
                          Primary dropdown selection drives a dynamic secondary dropdown keyed as{" "}
                          <code className="bg-muted px-1 rounded text-xs">&lt;alias&gt;_dynamic</code>.
                        </p>
                        <MergedFilterEditor
                          filters={cfg?.mergedFilters ?? []}
                          onChange={(filters) => updateConfig(selectedCard.id, { mergedFilters: filters })}
                        />
                      </SectionCard>
                    </TabsContent>

                    {/* ── Metadata ──────────────────────────────────────────── */}
                    <TabsContent value="metadata">
                      <SectionCard title="Metadata Behavior">
                        <VoiceToggleRow id="sendMetadata" label="Send Metadata with Request"
                          checked={!!cfg?.sendMetadata}
                          onChange={(v) => { pushHistory(); updateConfig(selectedCard.id, { sendMetadata: v }); }}
                          highlighted={voiceHighlightPath === "sendMetadata"} />
                        {cfg?.sendMetadata && (
                          <FieldRow label="Metadata Fields (comma-separated)" className="mt-4">
                            <Input
                              value={cfg.metadataFields.join(", ")}
                              onChange={(e) => updateConfig(selectedCard.id, {
                                metadataFields: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                              })}
                              placeholder="e.g. userId, roleId, tenantId"
                            />
                          </FieldRow>
                        )}
                      </SectionCard>
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>

              <footer className="flex items-center justify-between px-6 py-3 border-t bg-card/60 shrink-0">
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setSelectedId(null)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to list
                </Button>
                <div className="flex items-center gap-2">
                  {/* T2 – Diff preview button */}
                  {hasUnsavedChanges && (
                    <Button variant="outline" size="sm" onClick={() => setShowDiffModal(true)}>
                      <GitCompare className="h-4 w-4 mr-1.5" />
                      Review Changes
                    </Button>
                  )}
                  <Button size="sm" onClick={handleSave} disabled={saving} className="relative">
                    <Save className="h-4 w-4 mr-1.5" />
                    {saving ? "Saving…" : "Save Config"}
                    {hasUnsavedChanges && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400 border border-background" />
                    )}
                  </Button>
                </div>
              </footer>
            </>
          )}
        </main>
      </div>

      {/* ── T2: Diff / Save confirmation modal ──────────────────────────── */}
      <Dialog open={showDiffModal} onOpenChange={setShowDiffModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-primary" />
              Confirm Save
            </DialogTitle>
            <DialogDescription>
              The following changes will be saved to <strong>{rolePrefix}</strong> config:
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/40 rounded-lg p-4 text-sm space-y-1 max-h-48 overflow-y-auto">
            {diffLines.length > 0
              ? diffLines.map((line, i) => <p key={i} className="text-foreground">{line}</p>)
              : <p className="text-muted-foreground italic">No changes detected.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiffModal(false)}>Cancel</Button>
            <Button onClick={doSave} disabled={saving}>
              {saving ? "Saving…" : "Save Anyway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReportListItem({ card, isSelected, isDirty, onSelect, onDelete, onClone }: {
  card: ReportCard;
  isSelected: boolean;
  isDirty: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onClone: () => void;
}) {
  const cfg = card.newReportConfig;
  return (
    <div
      className={`
        group flex items-center gap-2 px-3 py-2.5 mx-1 my-0.5 rounded-lg cursor-pointer
        transition-colors duration-100 border
        ${isSelected
          ? "bg-primary/10 border-primary/30 text-foreground"
          : "hover:bg-muted/60 border-transparent text-muted-foreground hover:text-foreground"}
      `}
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate">{card.name}</span>
          {/* T1 – unsaved dot */}
          {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {card.isMandatory  && <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 text-amber-600 border-amber-500/40">Mandatory</Badge>}
          {cfg.isLiveReport  && <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 text-green-600 border-green-500/40">Live</Badge>}
          {cfg.isPDFReport   && <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 text-red-600 border-red-500/40">PDF</Badge>}
          {cfg.isGSTRReport  && <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 text-purple-600 border-purple-500/40">GSTR</Badge>}
        </div>
      </div>

      {/* T2 – Clone + Delete action buttons */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
        <button
          className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
          onClick={(e) => { e.stopPropagation(); onClone(); }}
          title="Clone report"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        {!card.isMandatory && (
          <button
            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete report"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyEditor() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 p-8">
      <Settings2 className="h-12 w-12 text-muted-foreground/20" />
      <p className="text-lg font-medium text-muted-foreground">No report selected</p>
      <p className="text-sm text-muted-foreground">
        Pick a report from the left panel, or<br />
        say <span className="text-primary">"select [report name]"</span> to begin.
      </p>
      <p className="text-xs text-muted-foreground/60 mt-2">
        Try: "create report" · "suggest config" · "enable live report" · "clone outlet master"
      </p>
    </div>
  );
}

function SectionCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card border rounded-xl p-5 ${className ?? ""}`}>
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function FieldRow({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <div className="flex items-center gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        {hint && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertCircle className="h-3 w-3 text-muted-foreground/50 cursor-help" />
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">{hint}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {children}
    </div>
  );
}

/** Toggle row with T1 voice highlight ring */
function VoiceToggleRow({
  id, label, checked, onChange, hint, highlighted,
}: {
  id: string; label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string; highlighted: boolean;
}) {
  return (
    <div className={`
      flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2.5
      transition-all duration-150
      ${highlighted ? "animate-voice-ring" : ""}
    `}>
      <div className="flex items-center gap-1.5 min-w-0">
        <Label htmlFor={id} className="text-sm cursor-pointer truncate">{label}</Label>
        {hint && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertCircle className="h-3 w-3 text-muted-foreground/50 shrink-0 cursor-help" />
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">{hint}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </div>
  );
}

function MergedFilterEditor({ filters, onChange }: {
  filters: MergedFilterSource[];
  onChange: (f: MergedFilterSource[]) => void;
}) {
  const addFilter    = () => onChange([...filters, { alias: "", label: "", values: [] }]);
  const removeFilter = (i: number) => onChange(filters.filter((_, idx) => idx !== i));
  const updateFilter = (i: number, patch: Partial<MergedFilterSource>) =>
    onChange(filters.map((f, idx) => idx === i ? { ...f, ...patch } : f));

  return (
    <div className="flex flex-col gap-2">
      {filters.map((f, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
          <Input placeholder="alias (e.g. state)" value={f.alias}
            onChange={(e) => updateFilter(i, { alias: e.target.value })}
            className="font-mono text-xs" />
          <Input placeholder="values (comma-sep)" value={f.values.join(", ")}
            onChange={(e) => updateFilter(i, { values: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            className="text-xs" />
          <Button variant="ghost" size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => removeFilter(i)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="mt-1 self-start" onClick={addFilter}>
        <Plus className="h-4 w-4 mr-1" />
        Add Merged Filter
      </Button>
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function ReportConfigPage() {
  return <ReportConfigInner />;
}
