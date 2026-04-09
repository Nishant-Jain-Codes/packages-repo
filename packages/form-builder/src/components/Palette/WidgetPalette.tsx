import { useState } from "react";
import { Search, PanelLeftClose, PanelLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { getFieldsByCategory } from "../../fields";
import { PaletteItem } from "./PaletteItem";
import { useFormBuilderStore } from "../../hooks/useFormBuilderStore";
import { cn } from "@/lib/utils";

export function WidgetPalette() {
  const [search, setSearch] = useState("");
  const { isPaletteCollapsed, togglePalette } = useFormBuilderStore();
  const categories = getFieldsByCategory();

  const filteredCategories = Object.entries(categories)
    .map(([key, cat]) => ({
      key,
      label: cat.label,
      fields: cat.fields.filter(
        (f) =>
          f.label.toLowerCase().includes(search.toLowerCase()) ||
          f.description.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.fields.length > 0);

  if (isPaletteCollapsed) {
    return (
      <div className="w-12 border-r bg-card/50 flex flex-col items-center pt-3">
        <Button variant="ghost" size="icon" onClick={togglePalette} className="h-8 w-8">
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-[280px] border-r bg-card/50 flex flex-col shrink-0">
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Fields</h3>
          <Button variant="ghost" size="icon" onClick={togglePalette} className="h-7 w-7">
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search fields..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {filteredCategories.map((cat) => (
            <div key={cat.key}>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {cat.label}
              </p>
              <div className="space-y-1.5">
                {cat.fields.map((field) => (
                  <PaletteItem key={field.type} definition={field} />
                ))}
              </div>
            </div>
          ))}
          {filteredCategories.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No fields match "{search}"
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
