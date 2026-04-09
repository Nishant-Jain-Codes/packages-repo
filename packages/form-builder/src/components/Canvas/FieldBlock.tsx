import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Copy, Asterisk } from "lucide-react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FormField } from "../../types";
import { getFieldDefinition } from "../../fields";
import { useFormBuilderStore } from "../../hooks/useFormBuilderStore";
import { useVoiceHighlight } from "../../voice/VoiceHighlightContext";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Type: Icons.Type,
  AlignLeft: Icons.AlignLeft,
  Mail: Icons.Mail,
  Hash: Icons.Hash,
  Phone: Icons.Phone,
  Link: Icons.Link,
  ChevronDown: Icons.ChevronDown,
  ListChecks: Icons.ListChecks,
  CheckSquare: Icons.CheckSquare,
  Circle: Icons.Circle,
  Calendar: Icons.Calendar,
  CalendarRange: Icons.CalendarRange,
  SlidersHorizontal: Icons.SlidersHorizontal,
  Camera: Icons.Camera,
  MapPin: Icons.MapPin,
};

interface FieldBlockProps {
  field: FormField;
  sectionId: string;
  index: number;
}

export function FieldBlock({ field, sectionId, index }: FieldBlockProps) {
  const { selectedFieldId, selectField, removeField, duplicateField } =
    useFormBuilderStore();
  const { highlightedFieldId } = useVoiceHighlight();
  const isSelected = selectedFieldId === field.id;
  const isVoiceHighlighted = highlightedFieldId === field.id;
  const definition = getFieldDefinition(field.type);
  const Icon = definition ? iconMap[definition.icon] || Icons.HelpCircle : Icons.HelpCircle;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
    data: {
      type: "CANVAS_FIELD",
      fieldId: field.id,
      sectionId,
      index,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-field-id={field.id}
      className={cn(
        "group relative flex items-center gap-2 px-3 py-3 rounded-lg border transition-all duration-150",
        "bg-background hover:bg-accent/30 dark:hover:bg-sky-400/10",
        isSelected
          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
          : "border-border/60 hover:border-primary/40 dark:hover:border-sky-300/70",
        isDragging && "opacity-40 z-50 shadow-lg",
        isVoiceHighlighted && "animate-voice-ring"
      )}
      onClick={(e) => {
        e.stopPropagation();
        selectField(field.id, sectionId);
      }}
    >
      {/* Drag handle */}
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Field icon */}
      <div className="flex items-center justify-center w-7 h-7 rounded bg-primary/10 text-primary shrink-0">
        <Icon className="w-3.5 h-3.5" />
      </div>

      {/* Field info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate">{field.label}</span>
          {field.required && (
            <Asterisk className="h-3 w-3 text-destructive shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
            {definition?.label || field.type}
          </Badge>
          {field.placeholder && (
            <span className="text-[11px] text-muted-foreground truncate">
              {field.placeholder}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className={cn(
          "flex items-center gap-0.5 shrink-0 transition-opacity",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            duplicateField(sectionId, field.id);
          }}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            removeField(sectionId, field.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
