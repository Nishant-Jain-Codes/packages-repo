import { Settings, Camera, MapPin, Type, AlignLeft, Hash, ChevronDown, ListChecks, CheckSquare, Circle, Calendar, CalendarRange, SlidersHorizontal, Phone, Mail, Link, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { Activity, FieldType } from "../../types";
import { cn } from "@/lib/utils";

const fieldIconMap: Record<FieldType, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  text: { icon: Type, label: "Text" },
  textarea: { icon: AlignLeft, label: "Text Area" },
  email: { icon: Mail, label: "Email" },
  number: { icon: Hash, label: "Number" },
  tel: { icon: Phone, label: "Phone" },
  url: { icon: Link, label: "URL" },
  date: { icon: Calendar, label: "Date" },
  "date-range": { icon: CalendarRange, label: "Date Range" },
  dropdown: { icon: ChevronDown, label: "Dropdown" },
  multiselect: { icon: ListChecks, label: "Multi Select" },
  checkbox: { icon: CheckSquare, label: "Checkbox" },
  radio: { icon: Circle, label: "Radio" },
  slider: { icon: SlidersHorizontal, label: "Slider" },
  camera: { icon: Camera, label: "Photo" },
  location: { icon: MapPin, label: "Location" },
};

interface ActivityCardProps {
  activity: Activity;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ActivityCard({ activity, isSelected, onSelect, onToggle, onEdit, onDelete }: ActivityCardProps) {
  const allFields = activity.schema.sections.flatMap((s) => s.fields);
  const fieldCount = allFields.length;

  // Get unique field types for tag display (max 3)
  const uniqueFieldTypes: FieldType[] = [];
  const seen = new Set<FieldType>();
  for (const field of allFields) {
    if (!seen.has(field.type)) {
      seen.add(field.type);
      uniqueFieldTypes.push(field.type);
    }
    if (uniqueFieldTypes.length >= 3) break;
  }

  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative border rounded-xl p-5 transition-all duration-200 cursor-pointer group",
        isSelected
          ? "border-primary/50 bg-primary/[0.03] shadow-sm ring-1 ring-primary/20"
          : "border-border hover:border-primary/30 hover:shadow-sm",
        !activity.enabled && "opacity-60"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Toggle */}
        <div className="pt-0.5">
          <Switch
            checked={activity.enabled}
            onCheckedChange={(e) => {
              e; // consume
              onToggle();
            }}
            onClick={(e) => e.stopPropagation()}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground leading-tight">
            {activity.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {activity.description}
          </p>

          {/* Field tags */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">
              {fieldCount} field{fieldCount !== 1 ? "s" : ""}
            </span>
            {uniqueFieldTypes.map((type) => {
              const info = fieldIconMap[type];
              if (!info) return null;
              const Icon = info.icon;
              return (
                <span
                  key={type}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 rounded-full px-2.5 py-0.5"
                >
                  <Icon className="h-3 w-3" />
                  {info.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title="Edit form"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete form"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
