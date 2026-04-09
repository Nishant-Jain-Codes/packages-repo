import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import {
  Undo2,
  Redo2,
  Eye,
  Pencil,
  Download,
  Upload,
  RotateCcw,
  Save,
  Code,
  ArrowLeft,
  Sun,
  Moon,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useFormBuilderStore } from "./hooks/useFormBuilderStore";
import { WidgetPalette } from "./components/Palette/WidgetPalette";
import { Canvas } from "./components/Canvas/Canvas";
import { FieldEditor } from "./components/FieldEditor/FieldEditor";
import { FormPreview } from "./components/Preview/FormPreview";
import { AiPromptBar } from "./components/AI/AiPromptBar";
import { downloadSchema, importSchemaFromFile, exportSchemaAsJson } from "./utils/schema";
import { generateFormFromJira } from "./utils/jiraFormGenerator";
import type { FieldType } from "./types";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "react-router-dom";
import { ApiConstants } from "@/services/apiConstants";
import { useActivityStore } from "./hooks/useActivityStore";
import { useVoiceAgentContext } from "./voice/VoiceAgentContext";
import { VoiceHighlightProvider, useVoiceHighlight } from "./voice/VoiceHighlightContext";

// Custom collision detection: prefer pointerWithin for better drop accuracy,
// fallback to rectIntersection so drops always register
const customCollision: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return rectIntersection(args);
};

export function FormBuilder() {
  const navigate = useNavigate();
  const { activityId } = useParams<{ activityId?: string }>();
  const { getActivity, updateActivitySchema, loadFromLocalStorage: loadActivities } = useActivityStore();
  const {
    schema,
    mode,
    setMode,
    setFormName,
    addField,
    moveField,
    reorderField,
    undo,
    redo,
    canUndo,
    canRedo,
    exportSchema,
    importSchema,
    resetForm,
    saveToLocalStorage,
    loadFromLocalStorage,
  } = useFormBuilderStore();

  const { actions: { setStage } } = useVoiceAgentContext();
  useEffect(() => { setStage("building"); }, []);

  const { saveButtonFlash } = useVoiceHighlight();

  const [showJsonDialog, setShowJsonDialog] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeDragData, setActiveDragData] = useState<any>(null);
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const savedSchemaRef = useRef<string>("");

  // Jira + AI state
  const [jiraLoading, setJiraLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [loadedTicket, setLoadedTicket] = useState<{ key: string; summary: string } | null>(null);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  // Load: either from activity store (if editing an activity) or localStorage
  useEffect(() => {
    if (activityId) {
      loadActivities();
      const activity = getActivity(activityId);
      if (activity) {
        importSchema(activity.schema);
      }
    } else {
      loadFromLocalStorage();
    }
  }, [activityId]);

  // Save: debounced auto-save back to correct store
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (activityId) {
        updateActivitySchema(activityId, schema);
      } else {
        saveToLocalStorage();
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [schema]);

  // Track unsaved changes: mark dirty whenever schema diverges from last explicit save
  useEffect(() => {
    const current = JSON.stringify(schema);
    if (savedSchemaRef.current && current !== savedSchemaRef.current) {
      setHasUnsavedChanges(true);
    }
  }, [schema]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (isMod && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if (isMod && e.key === "s") {
        e.preventDefault();
        if (activityId) {
          updateActivitySchema(activityId, schema);
        } else {
          saveToLocalStorage();
        }
        toast.success("Form saved");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, saveToLocalStorage]);

  // DnD sensors — distance:8 to avoid accidental drags on click
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragData(event.active.data.current);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragData(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;
    const overId = over.id as string;

    // --- Palette → Canvas drop ---
    if (activeData?.type === "PALETTE_ITEM") {
      let targetSectionId: string | null = null;
      let targetIndex: number | undefined;

      if (overData?.type === "SECTION") {
        targetSectionId = overData.sectionId;
      } else if (overData?.type === "CANVAS_FIELD") {
        targetSectionId = overData.sectionId;
        targetIndex = overData.index;
      } else if (overId.startsWith("section-")) {
        // Fallback: match droppable ID pattern
        targetSectionId = overId.replace("section-", "");
      }

      if (!targetSectionId && schema.sections.length > 0) {
        targetSectionId = schema.sections[0].id;
      }

      if (targetSectionId) {
        addField(targetSectionId, activeData.fieldType as FieldType, targetIndex);
      }
      return;
    }

    // --- Canvas reorder / cross-section move ---
    if (activeData?.type === "CANVAS_FIELD") {
      const fromSectionId = activeData.sectionId;
      const fieldId = activeData.fieldId;

      if (overData?.type === "CANVAS_FIELD") {
        const toSectionId = overData.sectionId;
        const toIndex = overData.index;
        if (fromSectionId === toSectionId) {
          reorderField(fromSectionId, activeData.index, toIndex);
        } else {
          moveField(fromSectionId, toSectionId, fieldId, toIndex);
        }
      } else if (overData?.type === "SECTION" || overId.startsWith("section-")) {
        const toSectionId = overData?.sectionId || overId.replace("section-", "");
        if (fromSectionId !== toSectionId) {
          const targetSection = schema.sections.find((s) => s.id === toSectionId);
          moveField(fromSectionId, toSectionId, fieldId, targetSection?.fields.length || 0);
        }
      }
    }
  };

  // --- Jira fetch handler ---
  const handleFetchJira = async (issueKey: string) => {
    setJiraLoading(true);
    setLoadedTicket(null);

    let issueData: { key: string; summary: string; description: string; issueType: string; labels: string[] } | null = null;

    try {
      const authCookie = localStorage.getItem("auth_cookie");
      const token = authCookie ? JSON.parse(authCookie).token : null;
      const authToken = token || localStorage.getItem("auth_token") || null;

      const response = await fetch(
        `${ApiConstants.MarketplaceEndpoint}/api/jira/issue/${encodeURIComponent(issueKey)}`,
        {
        method: "GET",
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        }
      );

      if (!response.ok) {
        let message = `Jira proxy returned ${response.status}`;
        try {
          const body = await response.json();
          if (body?.error) message = body.error;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      issueData = await response.json();
    } catch (err: any) {
      console.error("Jira fetch error:", err);
      toast.error(`Failed to fetch Jira issue: ${err.message}`);
      setJiraLoading(false);
      return;
    }

    setJiraLoading(false);
    setAiGenerating(true);

    try {
      // Try Ollama AI generation first
      const authCookie = localStorage.getItem("auth_cookie");
      const token = authCookie ? JSON.parse(authCookie).token : null;
      const authToken = token || localStorage.getItem("auth_token") || null;

      const aiResponse = await fetch("/api/ai/generate-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: authToken } : {}),
        },
        body: JSON.stringify(issueData),
      });

      if (aiResponse.ok) {
        const aiSchema = await aiResponse.json();
        importSchema(aiSchema);
        setLoadedTicket({ key: issueData.key, summary: issueData.summary });
        toast.success(`AI form generated from ${issueData.key}`);
        return;
      }

      // Non-503 errors (model missing, bad JSON) — show warning but fall through
      if (aiResponse.status !== 503) {
        const body = await aiResponse.json().catch(() => ({}));
        console.warn("AI generation failed:", body?.error);
        toast.warning("AI generation failed, using keyword-based fallback");
      }
    } catch {
      // Ollama unreachable — silent fallback
    } finally {
      setAiGenerating(false);
    }

    // Fallback: keyword-based generation
    const generatedSchema = generateFormFromJira(issueData);
    importSchema(generatedSchema);
    setLoadedTicket({ key: issueData.key, summary: issueData.summary });
    toast.success(`Form generated from ${issueData.key}: ${issueData.summary}`);
  };

  const handleImport = async () => {
    const imported = await importSchemaFromFile();
    if (imported) {
      importSchema(imported);
      toast.success("Form imported successfully");
    } else {
      toast.error("Failed to import form — invalid JSON schema");
    }
  };

  const handleExport = () => {
    downloadSchema(exportSchema());
    toast.success("Schema downloaded");
  };

  return (
    <VoiceHighlightProvider>
    <div className="h-screen flex flex-col bg-background">
      {/* Top Toolbar */}
      <div className="border-b bg-card/80 backdrop-blur-sm px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => activityId ? navigate("/manage-forms") : navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Input
            value={schema.formName}
            onChange={(e) => setFormName(e.target.value)}
            className="border-0 shadow-none h-8 text-sm font-semibold w-[200px] px-2 hover:bg-accent/50 focus-visible:ring-1"
          />

          <div className="flex-1" />

          {/* Jira Prompt Bar - centered */}
          <div className="w-[440px] hidden lg:block">
            <AiPromptBar
              onFetchJira={handleFetchJira}
              isLoading={jiraLoading}
              aiGenerating={aiGenerating}
              loadedTicket={loadedTicket}
            />
          </div>

          <div className="flex-1" />

          {/* Mode toggle */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as "build" | "preview")}>
            <TabsList className="h-8">
              <TabsTrigger value="build" className="text-xs px-3 h-6 gap-1">
                <Pencil className="h-3 w-3" />
                Build
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs px-3 h-6 gap-1">
                <Eye className="h-3 w-3" />
                Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={undo}
              disabled={!canUndo()}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={redo}
              disabled={!canRedo()}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setShowJsonDialog(true)}
              title="View JSON"
            >
              <Code className="h-3.5 w-3.5" />
              JSON
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleImport} title="Import JSON">
              <Upload className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExport} title="Export JSON">
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => setShowResetConfirm(true)}
              title="Reset Form"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button
            size="sm"
            className={cn("h-8 text-xs gap-1.5 relative transition-all", saveButtonFlash && "scale-110 bg-emerald-100 dark:bg-emerald-900/40")}
            onClick={() => {
              if (activityId) {
                updateActivitySchema(activityId, schema);
              } else {
                saveToLocalStorage();
              }
              savedSchemaRef.current = JSON.stringify(schema);
              setHasUnsavedChanges(false);
              toast.success("Form saved!");
            }}
          >
            <Save className="h-3.5 w-3.5" />
            Save
            {hasUnsavedChanges && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400 border border-background" />
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={() => navigate("/report-preview")}
            title="View Reports"
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Report
          </Button>
        </div>

        {/* Jira bar for smaller screens */}
        <div className="lg:hidden mt-2">
          <AiPromptBar
            onFetchJira={handleFetchJira}
            isLoading={jiraLoading}
            loadedTicket={loadedTicket}
          />
        </div>
      </div>

      {/* Main Content */}
      <DndContext
        sensors={sensors}
        collisionDetection={customCollision}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex overflow-hidden">
          {mode === "build" ? (
            <>
              <WidgetPalette />
              <Canvas />
              <FieldEditor />
            </>
          ) : (
            <FormPreview />
          )}
        </div>

        {/* Drag overlay for visual feedback */}
        <DragOverlay dropAnimation={null}>
          {activeDragData && (
            <div className="px-4 py-2.5 rounded-lg border border-primary/50 bg-card shadow-lg text-sm font-medium opacity-90 pointer-events-none">
              {activeDragData.type === "PALETTE_ITEM"
                ? `+ ${activeDragData.fieldType}`
                : "Moving field..."}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* JSON Dialog */}
      <Dialog open={showJsonDialog} onOpenChange={setShowJsonDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Form Schema (JSON)</DialogTitle>
            <DialogDescription>
              Copy this JSON to use the form configuration elsewhere.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[60vh]">
            <pre className="bg-muted p-4 rounded-lg text-xs font-mono whitespace-pre-wrap break-all">
              {exportSchemaAsJson(exportSchema())}
            </pre>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(exportSchemaAsJson(exportSchema()));
                toast.success("JSON copied to clipboard");
              }}
            >
              Copy to Clipboard
            </Button>
            <Button size="sm" onClick={handleExport}>
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Form?</DialogTitle>
            <DialogDescription>
              This will clear all sections and fields. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                resetForm();
                setShowResetConfirm(false);
                toast.success("Form reset");
              }}
            >
              Reset
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>

      <VoiceBridge
        onOpenJson={() => setShowJsonDialog(true)}
        onDownload={handleExport}
        onCopyJson={async () => {
          await navigator.clipboard.writeText(exportSchemaAsJson(exportSchema()));
          toast.success("JSON copied to clipboard");
        }}
      />
    </VoiceHighlightProvider>
  );
}

// ─── VoiceBridge ─────────────────────────────────────────────────────────────
// Registers UI-level callbacks into the voice agent context.

interface VoiceBridgeProps {
  onOpenJson: () => void;
  onDownload: () => void;
  onCopyJson: () => Promise<void>;
}

function VoiceBridge({ onOpenJson, onDownload, onCopyJson }: VoiceBridgeProps) {
  const { registerUICallbacks } = useVoiceAgentContext();
  const { highlightField, highlightSection, startSectionRemoval, flashSaveButton } = useVoiceHighlight();
  useEffect(() => {
    registerUICallbacks({
      openJsonDialog: onOpenJson,
      downloadForm: onDownload,
      copyJsonToClipboard: onCopyJson,
      onVoiceFieldAdded:      (fieldId)    => highlightField(fieldId),
      onVoiceSectionHighlight:(sectionId)  => highlightSection(sectionId),
      onVoiceSectionRemove:   (sectionId)  => startSectionRemoval(sectionId),
      onVoiceSave:            ()           => flashSaveButton(),
    });
  }, [highlightField, highlightSection, startSectionRemoval, flashSaveButton]);
  return null;
}


// (Jira ADF parsing now happens server-side via /api/jira/issue/:issueKey)
