import { useDraggable } from "@dnd-kit/core";
import * as Icons from "lucide-react";
import type { FieldDefinition } from "../../types";
import { cn } from "@/lib/utils";

interface PaletteItemProps {
  definition: FieldDefinition;
}

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

export function PaletteItem({ definition }: PaletteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${definition.type}`,
    data: {
      type: "PALETTE_ITEM",
      fieldType: definition.type,
    },
  });

  const Icon = iconMap[definition.icon] || Icons.HelpCircle;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border/50",
        "bg-card hover:bg-accent/50 hover:border-primary/30",
        "cursor-grab active:cursor-grabbing transition-all duration-150",
        "select-none group",
        isDragging && "opacity-40 scale-95"
      )}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight truncate">
          {definition.label}
        </p>
        <p className="text-[11px] text-muted-foreground leading-tight truncate">
          {definition.description}
        </p>
      </div>
    </div>
  );
}
