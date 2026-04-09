import {
  Camera,
  MapPin,
  Signal,
  Wifi,
  Battery,
  ChevronLeft,
  Database,
} from "lucide-react";
import type { FormField, FormSchema } from "../../types";
import { cn } from "@/lib/utils";

function FieldRenderer({ field }: { field: FormField }) {
  switch (field.type) {
    case "text":
    case "email":
    case "tel":
    case "url":
    case "number":
      return (
        <input
          readOnly
          placeholder={field.placeholder}
          className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm placeholder:text-gray-400"
        />
      );
    case "textarea":
      return (
        <textarea
          readOnly
          placeholder={field.placeholder}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm placeholder:text-gray-400 resize-none"
        />
      );
    case "dropdown":
      return (
        <div className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white flex items-center justify-between text-sm">
          <span className="text-gray-400">{field.placeholder || "Select..."}</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      );
    case "multiselect":
    case "checkbox":
      return (
        <div className="space-y-2.5">
          {(field.options || []).slice(0, 3).map((opt) => (
            <label key={opt} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded border-2 border-gray-300 shrink-0" />
              <span className="text-sm text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      );
    case "radio":
      return (
        <div className="space-y-2.5">
          {(field.options || []).slice(0, 3).map((opt, i) => (
            <label key={opt} className="flex items-center gap-2.5">
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center",
                  i === 0 ? "border-emerald-500" : "border-gray-300"
                )}
              >
                {i === 0 && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
              </div>
              <span className="text-sm text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      );
    case "date":
      return (
        <div className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white flex items-center justify-between text-sm">
          <span className="text-gray-400">Select date</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      );
    case "date-range":
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-10 px-3 rounded-lg border border-gray-200 bg-white flex items-center text-sm">
            <span className="text-gray-400">Start</span>
          </div>
          <span className="text-gray-400 text-xs">to</span>
          <div className="flex-1 h-10 px-3 rounded-lg border border-gray-200 bg-white flex items-center text-sm">
            <span className="text-gray-400">End</span>
          </div>
        </div>
      );
    case "slider":
      return (
        <div className="space-y-2 pt-1">
          <div className="relative h-5 flex items-center">
            <div className="absolute inset-x-0 h-1 bg-gray-200 rounded-full" />
            <div className="absolute left-0 h-1 bg-emerald-500 rounded-full" style={{ width: "30%" }} />
            <div className="absolute w-5 h-5 bg-emerald-500 rounded-full shadow-md" style={{ left: "30%", transform: "translateX(-50%)" }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{field.sliderMin ?? 0}</span>
            <span>{field.sliderMax ?? 100}</span>
          </div>
        </div>
      );
    case "camera":
      return (
        <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-1.5">
              <Camera className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-[11px] text-gray-500 font-medium">Tap to capture</p>
          </div>
        </div>
      );
    case "location":
      return (
        <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-1.5">
              <MapPin className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-[11px] text-gray-500 font-medium">Get location</p>
          </div>
        </div>
      );
    default:
      return (
        <input
          readOnly
          placeholder={field.placeholder}
          className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm"
        />
      );
  }
}

interface ActivityPreviewProps {
  schema: FormSchema;
}

export function ActivityPreview({ schema }: ActivityPreviewProps) {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-semibold text-emerald-600 tracking-wide uppercase mb-4">
        Live Preview
      </h3>

      {/* Phone frame */}
      <div className="relative w-[300px] h-[600px] bg-black rounded-[40px] shadow-2xl p-2.5 flex flex-col">
        <div className="flex-1 bg-white rounded-[32px] overflow-hidden flex flex-col">
          {/* Status bar */}
          <div className="flex items-center justify-between px-7 pt-3 pb-1">
            <span className="text-[11px] font-semibold text-gray-900">{time}</span>
            <div className="flex items-center gap-1">
              <Signal className="h-3 w-3 text-gray-900" />
              <Wifi className="h-3 w-3 text-gray-900" />
              <Battery className="h-3 w-3 text-gray-900" />
            </div>
          </div>

          {/* Dynamic Island */}
          <div className="flex justify-center -mt-0.5 mb-1">
            <div className="w-24 h-6 bg-black rounded-full" />
          </div>

          {/* App header */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-gray-100">
            <ChevronLeft className="h-4.5 w-4.5 text-emerald-600" />
            <h1 className="text-sm font-semibold text-gray-900 flex-1 truncate">
              {schema.formName}
            </h1>
          </div>

          {/* Form content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-3 space-y-5">
              {schema.sections.map((section) => (
                <div key={section.id}>
                  {schema.sections.length > 1 && (
                    <div className="mb-2.5">
                      <h2 className="text-xs font-semibold text-gray-900">
                        {section.title}
                      </h2>
                      <div className="h-0.5 w-6 bg-emerald-500 rounded-full mt-0.5" />
                    </div>
                  )}
                  <div className="space-y-3.5">
                    {section.fields.map((field) => (
                      <div key={field.id}>
                        <div className="flex items-center gap-1 mb-1">
                          <label className="text-xs font-medium text-gray-700">
                            {field.label}
                          </label>
                          {field.required && (
                            <span className="text-red-500 text-[10px]">*</span>
                          )}
                        </div>
                        <FieldRenderer field={field} />
                      </div>
                    ))}
                    {section.fields.length === 0 && (
                      <p className="text-xs text-gray-400 italic text-center py-4">
                        No fields yet
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit button */}
          <div className="px-4 py-3 border-t border-gray-100 bg-white">
            <button className="w-full h-11 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25">
              {schema.meta.submitLabel}
            </button>
            <div className="flex justify-center mt-2.5">
              <div className="w-28 h-1 bg-gray-300 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
