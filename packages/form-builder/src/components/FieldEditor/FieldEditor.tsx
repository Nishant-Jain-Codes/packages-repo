import { X, Database, Plug, ArrowDownToLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useFormBuilderStore } from "../../hooks/useFormBuilderStore";
import { OptionListEditor } from "./OptionListEditor";
import type { FormField, FieldDataSource, FieldPrefill } from "../../types";
import { cn } from "@/lib/utils";

const hasOptions = (type: string) =>
  ["dropdown", "multiselect", "checkbox", "radio"].includes(type);

export function FieldEditor() {
  const { schema, selectedFieldId, selectedSectionId, updateField, clearSelection } =
    useFormBuilderStore();

  const field = selectedSectionId
    ? schema.sections
        .find((s) => s.id === selectedSectionId)
        ?.fields.find((f) => f.id === selectedFieldId)
    : null;

  if (!field || !selectedSectionId) {
    return (
      <div className="w-[300px] border-l bg-card/50 flex items-center justify-center p-6 shrink-0">
        <p className="text-sm text-muted-foreground text-center">
          Select a field to edit its properties
        </p>
      </div>
    );
  }

  const update = (updates: Partial<FormField>) => {
    updateField(selectedSectionId, field.id, updates);
  };

  const updateDataSource = (updates: Partial<FieldDataSource>) => {
    update({ dataSource: { ...field.dataSource, type: field.dataSource?.type || "static", ...updates } });
  };

  const updatePrefill = (updates: Partial<FieldPrefill>) => {
    update({ prefill: { ...field.prefill, ...updates } });
  };

  const updateCondition = (updates: Partial<NonNullable<FormField["condition"]>>) => {
    update({
      condition: {
        fieldId: field.condition?.fieldId || "",
        operator: field.condition?.operator || "equals",
        value: field.condition?.value || "",
        ...updates,
      },
    });
  };

  const fieldOptions = schema.sections.flatMap((section) => section.fields);

  return (
    <div className="w-[300px] border-l bg-card/50 flex flex-col shrink-0">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="text-sm font-semibold">Field Properties</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearSelection}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Label */}
          <div className="space-y-1.5">
            <Label className="text-xs">Label</Label>
            <Input
              value={field.label}
              onChange={(e) => update({ label: e.target.value })}
              className="h-8 text-sm"
            />
          </div>

          {/* Placeholder */}
          {!["checkbox", "radio", "camera", "location", "slider"].includes(field.type) && (
            <div className="space-y-1.5">
              <Label className="text-xs">Placeholder</Label>
              <Input
                value={field.placeholder || ""}
                onChange={(e) => update({ placeholder: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          )}

          {/* Hint Text */}
          <div className="space-y-1.5">
            <Label className="text-xs">Hint Text</Label>
            <Input
              value={field.hintText || ""}
              onChange={(e) => update({ hintText: e.target.value })}
              className="h-8 text-sm"
              placeholder="Help text shown below the field"
            />
          </div>

          {/* Required */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">Required</Label>
            <Switch
              checked={field.required}
              onCheckedChange={(checked) => update({ required: checked })}
            />
          </div>

          {/* Hide Label */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">Hide Label</Label>
            <Switch
              checked={field.hideLabel || false}
              onCheckedChange={(checked) => update({ hideLabel: checked })}
            />
          </div>

          {/* Default Value */}
          {["text", "textarea", "email", "number", "tel", "url", "date", "date-range"].includes(field.type) && (
            <div className="space-y-1.5">
              <Label className="text-xs">Default Value</Label>
              <Input
                value={field.defaultValue == null ? "" : String(field.defaultValue)}
                onChange={(e) => update({ defaultValue: e.target.value })}
                className="h-8 text-sm"
                placeholder="Optional default value"
              />
            </div>
          )}

          <Separator />

          {/* Options for choice fields */}
          {hasOptions(field.type) && field.dataSource?.type !== "api" && (
            <OptionListEditor
              options={field.options || []}
              onChange={(options) => update({ options })}
            />
          )}

          {/* Max Selections for multiselect */}
          {field.type === "multiselect" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Max Selections</Label>
              <Input
                type="number"
                value={field.maxSelections || ""}
                onChange={(e) =>
                  update({ maxSelections: parseInt(e.target.value) || undefined })
                }
                className="h-8 text-sm"
                min={1}
              />
            </div>
          )}

          {/* Slider config */}
          {field.type === "slider" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Min</Label>
                  <Input
                    type="number"
                    value={field.sliderMin ?? 0}
                    onChange={(e) => update({ sliderMin: parseFloat(e.target.value) })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max</Label>
                  <Input
                    type="number"
                    value={field.sliderMax ?? 100}
                    onChange={(e) => update({ sliderMax: parseFloat(e.target.value) })}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Step</Label>
                <Input
                  type="number"
                  value={field.sliderStep ?? 1}
                  onChange={(e) => update({ sliderStep: parseFloat(e.target.value) })}
                  className="h-8 text-sm"
                  min={0.1}
                  step={0.1}
                />
              </div>
            </>
          )}

          {/* Date range config */}
          {field.type === "date-range" && (
            <div className="flex items-center justify-between">
              <Label className="text-xs">Show Day Difference</Label>
              <Switch
                checked={field.showDifference || false}
                onCheckedChange={(checked) => update({ showDifference: checked })}
              />
            </div>
          )}

          {/* Camera config */}
          {field.type === "camera" && (
            <>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Allow Camera</Label>
                <Switch
                  checked={field.allowCamera !== false}
                  onCheckedChange={(checked) => update({ allowCamera: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Allow Gallery</Label>
                <Switch
                  checked={field.allowGallery !== false}
                  onCheckedChange={(checked) => update({ allowGallery: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Capture Location With Image</Label>
                <Switch
                  checked={field.captureLocationWithImage || false}
                  onCheckedChange={(checked) => update({ captureLocationWithImage: checked })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Linked Lat Field ID</Label>
                  <Input
                    value={field.linkedLatFieldId || ""}
                    onChange={(e) => update({ linkedLatFieldId: e.target.value })}
                    className="h-8 text-sm"
                    placeholder="latitudeField"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Linked Lng Field ID</Label>
                  <Input
                    value={field.linkedLngFieldId || ""}
                    onChange={(e) => update({ linkedLngFieldId: e.target.value })}
                    className="h-8 text-sm"
                    placeholder="longitudeField"
                  />
                </div>
              </div>
            </>
          )}

          {/* Location config */}
          {field.type === "location" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Display Mode</Label>
              <Select
                value={field.displayMode || "coordinates"}
                onValueChange={(val) =>
                  update({ displayMode: val as "map" | "coordinates" | "address" })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coordinates">Coordinates</SelectItem>
                  <SelectItem value="map">Map</SelectItem>
                  <SelectItem value="address">Address</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          {/* ========== DATA BINDING SECTION ========== */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group">
              <Database className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground flex-1">Data Binding</span>
              <span className="text-[10px] text-muted-foreground group-data-[state=open]:hidden">expand</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              {/* Column Name / Payload Key */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <ArrowDownToLine className="h-3 w-3" />
                  Column / Payload Key
                </Label>
                <Input
                  value={field.columnName || ""}
                  onChange={(e) => update({ columnName: e.target.value })}
                  className="h-8 text-sm font-mono"
                  placeholder="e.g. store_name, product_sku"
                />
                <p className="text-[10px] text-muted-foreground">
                  Maps this field to a DB column or API payload key
                </p>
              </div>

              {/* Data Source — only for choice fields */}
              {hasOptions(field.type) && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1">
                      <Plug className="h-3 w-3" />
                      Options Source
                    </Label>
                    <Select
                      value={field.dataSource?.type || "static"}
                      onValueChange={(val) =>
                        updateDataSource({ type: val as "static" | "api" })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="static">Static (hardcoded)</SelectItem>
                        <SelectItem value="api">API (dynamic)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {field.dataSource?.type === "api" && (
                    <div className="space-y-2.5 pl-2 border-l-2 border-primary/20">
                      <div className="space-y-1.5">
                        <Label className="text-xs">API Endpoint</Label>
                        <Input
                          value={field.dataSource.apiEndpoint || ""}
                          onChange={(e) => updateDataSource({ apiEndpoint: e.target.value })}
                          className="h-8 text-sm font-mono"
                          placeholder="/api/products"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Method</Label>
                        <Select
                          value={field.dataSource.method || "GET"}
                          onValueChange={(val) =>
                            updateDataSource({ method: val as "GET" | "POST" })
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Response Key</Label>
                        <Input
                          value={field.dataSource.responseKey || ""}
                          onChange={(e) => updateDataSource({ responseKey: e.target.value })}
                          className="h-8 text-sm font-mono"
                          placeholder="data.items"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Path to the array in the API response
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Label Key</Label>
                          <Input
                            value={field.dataSource.labelKey || ""}
                            onChange={(e) => updateDataSource({ labelKey: e.target.value })}
                            className="h-8 text-sm font-mono"
                            placeholder="name"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Value Key</Label>
                          <Input
                            value={field.dataSource.valueKey || ""}
                            onChange={(e) => updateDataSource({ valueKey: e.target.value })}
                            className="h-8 text-sm font-mono"
                            placeholder="id"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Depends On Field ID</Label>
                        <Input
                          value={field.dataSource.dependsOn || ""}
                          onChange={(e) => updateDataSource({ dependsOn: e.target.value })}
                          className="h-8 text-sm font-mono"
                          placeholder="parentFieldId"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Options Format</Label>
                        <Input
                          value={field.dataSource.optionsFormat || ""}
                          onChange={(e) => updateDataSource({ optionsFormat: e.target.value })}
                          className="h-8 text-sm font-mono"
                          placeholder="stringList"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Headers (JSON)</Label>
                        <Input
                          value={field.dataSource.headers ? JSON.stringify(field.dataSource.headers) : ""}
                          onChange={(e) => {
                            const raw = e.target.value.trim();
                            if (!raw) {
                              updateDataSource({ headers: undefined });
                              return;
                            }
                            try {
                              const parsed = JSON.parse(raw) as Record<string, string>;
                              updateDataSource({ headers: parsed });
                            } catch {
                              // Keep current value until valid JSON is provided.
                            }
                          }}
                          className="h-8 text-sm font-mono"
                          placeholder='{"x-tenant":"tenant_slug"}'
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Prefill API */}
              <Collapsible>
                <CollapsibleTrigger className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  + Prefill from API (optional)
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2.5 pl-2 border-l-2 border-muted-foreground/20">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Prefill API Endpoint</Label>
                    <Input
                      value={field.prefill?.apiEndpoint || ""}
                      onChange={(e) => updatePrefill({ apiEndpoint: e.target.value })}
                      className="h-8 text-sm font-mono"
                      placeholder="/api/store/{id}"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Method</Label>
                    <Select
                      value={field.prefill?.method || "GET"}
                      onValueChange={(val) =>
                        updatePrefill({ method: val as "GET" | "POST" })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Response Key</Label>
                    <Input
                      value={field.prefill?.responseKey || ""}
                      onChange={(e) => updatePrefill({ responseKey: e.target.value })}
                      className="h-8 text-sm font-mono"
                      placeholder="data.storeName"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Path to the prefill value in the API response
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Conditional visibility */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
              <span className="text-xs font-semibold text-foreground">Conditional Visibility</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">When field</Label>
                <Select
                  value={field.condition?.fieldId || "__none__"}
                  onValueChange={(val) => {
                    if (val === "__none__") {
                      update({ condition: null });
                      return;
                    }
                    updateCondition({ fieldId: val });
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No condition</SelectItem>
                    {fieldOptions
                      .filter((candidate) => candidate.id !== field.id)
                      .map((candidate) => (
                        <SelectItem key={candidate.id} value={candidate.id}>
                          {candidate.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Operator</Label>
                  <Select
                    value={field.condition?.operator || "equals"}
                    onValueChange={(val) =>
                      updateCondition({
                        operator: val as "equals" | "not_equals" | "contains" | "not_empty",
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">equals</SelectItem>
                      <SelectItem value="not_equals">not_equals</SelectItem>
                      <SelectItem value="contains">contains</SelectItem>
                      <SelectItem value="not_empty">not_empty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Value</Label>
                  <Input
                    value={field.condition?.value || ""}
                    onChange={(e) => updateCondition({ value: e.target.value })}
                    className="h-8 text-sm"
                    placeholder="Leave"
                    disabled={(field.condition?.operator || "equals") === "not_empty"}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Validation */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
              <span className="text-xs font-semibold text-foreground">Validation</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              {["text", "textarea", "email", "tel", "url"].includes(field.type) && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Min Length</Label>
                      <Input
                        type="number"
                        value={field.validation.minLength ?? ""}
                        onChange={(e) =>
                          update({
                            validation: {
                              ...field.validation,
                              minLength: parseInt(e.target.value) || undefined,
                            },
                          })
                        }
                        className="h-8 text-sm"
                        min={0}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Max Length</Label>
                      <Input
                        type="number"
                        value={field.validation.maxLength ?? ""}
                        onChange={(e) =>
                          update({
                            validation: {
                              ...field.validation,
                              maxLength: parseInt(e.target.value) || undefined,
                            },
                          })
                        }
                        className="h-8 text-sm"
                        min={0}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Regex Pattern</Label>
                    <Input
                      value={field.validation.pattern || ""}
                      onChange={(e) =>
                        update({
                          validation: {
                            ...field.validation,
                            pattern: e.target.value || undefined,
                          },
                        })
                      }
                      className="h-8 text-sm font-mono"
                      placeholder="^[a-zA-Z]+$"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pattern Error Message</Label>
                    <Input
                      value={field.validation.patternMessage || ""}
                      onChange={(e) =>
                        update({
                          validation: {
                            ...field.validation,
                            patternMessage: e.target.value || undefined,
                          },
                        })
                      }
                      className="h-8 text-sm"
                      placeholder="Please enter a valid value"
                    />
                  </div>
                </>
              )}

              {field.type === "number" && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Min Value</Label>
                    <Input
                      type="number"
                      value={field.validation.min ?? ""}
                      onChange={(e) =>
                        update({
                          validation: {
                            ...field.validation,
                            min: parseFloat(e.target.value) || undefined,
                          },
                        })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Max Value</Label>
                    <Input
                      type="number"
                      value={field.validation.max ?? ""}
                      onChange={(e) =>
                        update({
                          validation: {
                            ...field.validation,
                            max: parseFloat(e.target.value) || undefined,
                          },
                        })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
}
