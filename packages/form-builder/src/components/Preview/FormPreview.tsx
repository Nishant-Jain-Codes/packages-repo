import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  MapPin,
  CalendarRange,
  Wifi,
  Battery,
  Signal,
  ChevronLeft,
  Database,
} from "lucide-react";
import { useFormBuilderStore } from "../../hooks/useFormBuilderStore";
import type { FormField } from "../../types";
import { cn } from "@/lib/utils";

function FieldRenderer({ field }: { field: FormField }) {
  const [sliderValue, setSliderValue] = useState([field.sliderMin ?? 0]);

  switch (field.type) {
    case "text":
    case "email":
    case "tel":
    case "url":
    case "number":
      return (
        <input
          type={field.type === "text" ? "text" : field.type}
          placeholder={field.placeholder}
          className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
        />
      );

    case "textarea":
      return (
        <textarea
          placeholder={field.placeholder}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 resize-none"
        />
      );

    case "dropdown":
      return (
        <div className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between text-sm">
          <span className="text-gray-400">{field.placeholder || "Select..."}</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      );

    case "multiselect":
      return (
        <div className="space-y-2.5">
          {(field.options || []).map((opt) => (
            <label key={opt} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
            </label>
          ))}
          {field.maxSelections && (
            <p className="text-xs text-gray-400">Select up to {field.maxSelections}</p>
          )}
        </div>
      );

    case "checkbox":
      return (
        <div className="space-y-2.5">
          {(field.options || []).map((opt) => (
            <label key={opt} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
            </label>
          ))}
        </div>
      );

    case "radio":
      return (
        <div className="space-y-2.5">
          {(field.options || []).map((opt, i) => (
            <label key={opt} className="flex items-center gap-2.5">
              <div className={cn(
                "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center",
                i === 0 ? "border-primary" : "border-gray-300 dark:border-gray-600"
              )}>
                {i === 0 && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
            </label>
          ))}
        </div>
      );

    case "date":
      return (
        <div className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between text-sm">
          <span className="text-gray-400">Select date</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>
      );

    case "date-range":
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center text-sm">
            <span className="text-gray-400">Start</span>
          </div>
          <span className="text-gray-400 text-xs">to</span>
          <div className="flex-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center text-sm">
            <span className="text-gray-400">End</span>
          </div>
        </div>
      );

    case "slider":
      return (
        <div className="space-y-2 pt-1">
          <div className="relative h-5 flex items-center">
            <div className="absolute inset-x-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="absolute left-0 h-1 bg-primary rounded-full" style={{ width: "30%" }} />
            <div className="absolute w-5 h-5 bg-primary rounded-full shadow-md" style={{ left: "30%", transform: "translateX(-50%)" }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{field.sliderMin ?? 0}</span>
            <span>{field.sliderMax ?? 100}</span>
          </div>
        </div>
      );

    case "camera":
      return (
        <div className="flex items-center justify-center h-28 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-gray-500 font-medium">
              {field.allowCamera && field.allowGallery
                ? "Tap to capture or upload"
                : field.allowCamera
                ? "Tap to capture"
                : "Tap to upload"}
            </p>
          </div>
        </div>
      );

    case "location":
      return (
        <div className="flex items-center justify-center h-28 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-gray-500 font-medium">
              {field.displayMode === "map"
                ? "Tap to select on map"
                : field.displayMode === "address"
                ? "Enter address"
                : "Get current location"}
            </p>
          </div>
        </div>
      );

    default:
      return (
        <input
          placeholder={field.placeholder}
          className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
        />
      );
  }
}

function ApiBindingBadge({ field }: { field: FormField }) {
  if (!field.dataSource || field.dataSource.type === "static") return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-primary bg-primary/10 rounded px-1 py-0.5">
      <Database className="h-2.5 w-2.5" />
      API
    </span>
  );
}

export function FormPreview() {
  const { schema } = useFormBuilderStore();
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex-1 flex items-center justify-center bg-muted/30 p-4">
      {/* Phone frame */}
      <div className="relative w-[340px] h-[680px] bg-black rounded-[44px] shadow-2xl p-2.5 flex flex-col">
        {/* Phone inner bezel */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-[36px] overflow-hidden flex flex-col">
          {/* Status bar */}
          <div className="flex items-center justify-between px-8 pt-3 pb-1">
            <span className="text-xs font-semibold text-gray-900 dark:text-white">{time}</span>
            <div className="flex items-center gap-1">
              <Signal className="h-3.5 w-3.5 text-gray-900 dark:text-white" />
              <Wifi className="h-3.5 w-3.5 text-gray-900 dark:text-white" />
              <Battery className="h-3.5 w-3.5 text-gray-900 dark:text-white" />
            </div>
          </div>

          {/* Dynamic Island / Notch */}
          <div className="flex justify-center -mt-0.5 mb-1">
            <div className="w-28 h-7 bg-black rounded-full" />
          </div>

          {/* App header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <ChevronLeft className="h-5 w-5 text-primary" />
            <h1 className="text-base font-semibold text-gray-900 dark:text-white flex-1 truncate">
              {schema.formName}
            </h1>
          </div>

          {/* Form content — scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 py-4 space-y-6">
              {schema.sections.map((section) => (
                <div key={section.id}>
                  {schema.sections.length > 1 && (
                    <div className="mb-3">
                      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {section.title}
                      </h2>
                      <div className="h-0.5 w-8 bg-primary rounded-full mt-1" />
                    </div>
                  )}
                  <div className="space-y-4">
                    {section.fields.map((field) => (
                      <div key={field.id}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {field.label}
                          </label>
                          {field.required && (
                            <span className="text-red-500 text-xs">*</span>
                          )}
                          <ApiBindingBadge field={field} />
                        </div>
                        <FieldRenderer field={field} />
                        {field.hintText && (
                          <p className="text-[11px] text-gray-400 mt-1">{field.hintText}</p>
                        )}
                      </div>
                    ))}
                    {section.fields.length === 0 && (
                      <p className="text-sm text-gray-400 italic text-center py-6">
                        No fields yet
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit button — fixed at bottom */}
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <button className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-sm active:scale-[0.98] transition-transform shadow-lg shadow-primary/25">
              {schema.meta.submitLabel}
            </button>
            {/* Home indicator */}
            <div className="flex justify-center mt-3">
              <div className="w-32 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
