import { useState } from "react";
import { Plus, X, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface OptionListEditorProps {
  options: string[];
  onChange: (options: string[]) => void;
}

export function OptionListEditor({ options, onChange }: OptionListEditorProps) {
  const [newOption, setNewOption] = useState("");

  const addOption = () => {
    const trimmed = newOption.trim();
    if (trimmed && !options.includes(trimmed)) {
      onChange([...options, trimmed]);
      setNewOption("");
    }
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">Options</label>
      <div className="space-y-1.5">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            <Input
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              className="h-8 text-sm flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeOption(i)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addOption();
        }}
        className="flex items-center gap-1.5"
      >
        <Input
          placeholder="Add option..."
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          className="h-8 text-sm flex-1"
        />
        <Button type="submit" variant="outline" size="sm" className="h-8 shrink-0">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}
