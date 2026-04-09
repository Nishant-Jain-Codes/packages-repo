import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFormBuilderStore } from "../../hooks/useFormBuilderStore";
import { SectionBlock } from "./SectionBlock";

export function Canvas() {
  const { schema, addSection, clearSelection } = useFormBuilderStore();

  return (
    <div className="flex-1 flex flex-col min-w-0" onClick={() => clearSelection()}>
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto p-6 space-y-4">
          {schema.sections.map((section, index) => (
            <SectionBlock key={section.id} section={section} index={index} />
          ))}

          <Button
            variant="outline"
            className="w-full border-dashed h-12 text-primary/80 hover:text-primary hover:border-primary/40 hover:bg-primary/10 dark:text-muted-foreground dark:hover:text-sky-300 dark:hover:border-sky-300/70 dark:hover:bg-sky-400/10"
            onClick={(e) => {
              e.stopPropagation();
              addSection();
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
