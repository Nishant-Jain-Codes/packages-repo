import { useState } from "react";
import { useVoiceHighlight } from "../../voice/VoiceHighlightContext";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  Check,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormSection } from "../../types";
import { useFormBuilderStore } from "../../hooks/useFormBuilderStore";
import { FieldBlock } from "./FieldBlock";
import { cn } from "@/lib/utils";

interface SectionBlockProps {
  section: FormSection;
  index: number;
}

export function SectionBlock({ section, index }: SectionBlockProps) {
  const {
    toggleSectionCollapse,
    renameSection,
    removeSection,
    addField,
    schema,
  } = useFormBuilderStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const { highlightedSectionId, removingSectionId } = useVoiceHighlight();
  const isSectionHighlighted = highlightedSectionId === section.id;
  const isSectionRemoving    = removingSectionId    === section.id;

  // Main section droppable — this is what palette items target
  const { setNodeRef, isOver } = useDroppable({
    id: `section-${section.id}`,
    data: {
      type: "SECTION",
      sectionId: section.id,
    },
  });

  const handleRename = () => {
    if (editTitle.trim()) {
      renameSection(section.id, editTitle.trim());
    } else {
      setEditTitle(section.title);
    }
    setIsEditing(false);
  };

  const canDelete = schema.sections.length > 1;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card transition-all duration-200",
        isOver && "ring-2 ring-primary/40 border-primary/50 bg-primary/5",
        isSectionHighlighted && "animate-voice-ring",
        isSectionRemoving    && "animate-voice-remove"
      )}
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30 rounded-t-xl">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => toggleSectionCollapse(section.id)}
        >
          {section.collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRename();
            }}
            className="flex items-center gap-1.5 flex-1"
          >
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="h-7 text-sm font-semibold"
              autoFocus
              onBlur={handleRename}
            />
            <Button type="submit" variant="ghost" size="icon" className="h-6 w-6">
              <Check className="h-3.5 w-3.5" />
            </Button>
          </form>
        ) : (
          <h3
            className="text-sm font-semibold flex-1 cursor-pointer hover:text-primary transition-colors"
            onDoubleClick={() => {
              setEditTitle(section.title);
              setIsEditing(true);
            }}
          >
            {section.title}
          </h3>
        )}

        <div className="flex items-center gap-0.5">
          <FieldCount count={section.fields.length} />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setEditTitle(section.title);
              setIsEditing(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => removeSection(section.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Section Content — entire area is the drop target */}
      {!section.collapsed && (
        <div ref={setNodeRef} className="p-3 min-h-[80px]">
          {section.fields.length > 0 ? (
            <SortableContext
              items={section.fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {section.fields.map((field, fieldIndex) => (
                  <FieldBlock
                    key={field.id}
                    field={field}
                    sectionId={section.id}
                    index={fieldIndex}
                  />
                ))}
              </div>
            </SortableContext>
          ) : (
            <div
              className={cn(
                "flex flex-col items-center justify-center h-28 border-2 border-dashed rounded-lg transition-all",
                isOver
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-muted-foreground/20 text-muted-foreground"
              )}
            >
              <Inbox className={cn("h-6 w-6 mb-1.5", isOver && "animate-bounce")} />
              <p className="text-sm font-medium">
                {isOver ? "Drop here!" : "Drag fields here"}
              </p>
              <p className="text-xs mt-0.5 opacity-70">or click + below to add</p>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 border border-dashed border-border/60 text-primary/80 hover:text-primary hover:border-primary/40 hover:bg-primary/10 dark:text-muted-foreground dark:hover:text-sky-300 dark:hover:border-sky-300/70 dark:hover:bg-sky-400/10 h-9"
            onClick={() => addField(section.id, "text")}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Field
          </Button>
        </div>
      )}
    </div>
  );
}

function FieldCount({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
      {count}
    </span>
  );
}
