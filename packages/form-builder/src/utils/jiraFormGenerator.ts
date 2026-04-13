import { v4 as uuidv4 } from "uuid";
import type { FormSchema, FormSection, FormField, FieldType } from "../types";

interface JiraIssueData {
  key: string;
  summary: string;
  description: string;
  issueType: string;
  labels: string[];
}

// Keywords → field type mappings for intelligent generation
const fieldPatterns: Array<{
  keywords: string[];
  type: FieldType;
  label: string;
  extra?: Partial<FormField>;
}> = [
  // Photo / Image
  {
    keywords: ["photo", "image", "picture", "camera", "capture", "selfie", "snapshot", "screenshot"],
    type: "camera",
    label: "Photo",
    extra: { allowCamera: true, allowGallery: true },
  },
  // Location / GPS
  {
    keywords: ["location", "gps", "geolocation", "coordinates", "lat", "lng", "geo", "address", "place"],
    type: "location",
    label: "Location",
    extra: { displayMode: "coordinates" },
  },
  // Date range
  {
    keywords: ["date range", "start date", "end date", "from date", "to date", "period", "duration"],
    type: "date-range",
    label: "Date Range",
    extra: { showDifference: true },
  },
  // Date
  {
    keywords: ["date", "when", "scheduled", "deadline", "expiry", "expiration"],
    type: "date",
    label: "Date",
  },
  // Dropdown / Select
  {
    keywords: ["select", "choose", "dropdown", "type", "category", "status", "priority", "brand", "sku"],
    type: "dropdown",
    label: "Select",
    extra: { options: ["Option 1", "Option 2", "Option 3"] },
  },
  // Multi-select
  {
    keywords: ["multi select", "multiple", "tags", "multi-select"],
    type: "multiselect",
    label: "Multi Select",
    extra: { options: ["Option 1", "Option 2", "Option 3"], maxSelections: 5 },
  },
  // Checkbox
  {
    keywords: ["checkbox", "checklist", "check", "tick", "verify", "confirm", "compliance", "completed"],
    type: "checkbox",
    label: "Checklist",
    extra: { options: ["Item 1", "Item 2", "Item 3"] },
  },
  // Radio
  {
    keywords: ["radio", "yes/no", "yes or no", "single choice", "one of"],
    type: "radio",
    label: "Selection",
    extra: { options: ["Yes", "No"] },
  },
  // Slider / Range
  {
    keywords: ["slider", "range", "rating", "score", "scale", "percentage", "level"],
    type: "slider",
    label: "Rating",
    extra: { sliderMin: 0, sliderMax: 10, sliderStep: 1 },
  },
  // Number
  {
    keywords: ["quantity", "count", "number", "amount", "total", "price", "cost", "stock", "inventory", "units"],
    type: "number",
    label: "Quantity",
  },
  // Email
  {
    keywords: ["email", "e-mail"],
    type: "email",
    label: "Email",
  },
  // Phone
  {
    keywords: ["phone", "mobile", "contact number", "tel"],
    type: "tel",
    label: "Phone Number",
  },
  // URL
  {
    keywords: ["url", "link", "website", "web address"],
    type: "url",
    label: "URL",
  },
  // Textarea / Comments
  {
    keywords: ["comment", "remarks", "notes", "description", "details", "observation", "feedback", "reason", "explanation"],
    type: "textarea",
    label: "Comments",
  },
];

// Activity type → suggested sections and fields
const activityTemplates: Record<string, Array<{ sectionTitle: string; fields: Array<{ type: FieldType; label: string; required: boolean; extra?: Partial<FormField> }> }>> = {
  merchandising: [
    {
      sectionTitle: "Store Details",
      fields: [
        { type: "text", label: "Store Name", required: true },
        { type: "text", label: "Store Code", required: true },
        { type: "location", label: "Store Location", required: true, extra: { displayMode: "coordinates" } },
      ],
    },
    {
      sectionTitle: "Product Display",
      fields: [
        { type: "dropdown", label: "Product Category", required: true, extra: { options: ["Beverages", "Snacks", "Personal Care", "Household", "Other"] } },
        { type: "checkbox", label: "Display Compliance", required: true, extra: { options: ["Shelf placement correct", "Price tag visible", "Stock facing done", "POP material placed", "Competitor audit done"] } },
        { type: "camera", label: "Shelf Photo", required: true, extra: { allowCamera: true, allowGallery: true } },
        { type: "slider", label: "Display Score", required: false, extra: { sliderMin: 1, sliderMax: 10, sliderStep: 1 } },
        { type: "textarea", label: "Remarks", required: false },
      ],
    },
  ],
  "stock inventory": [
    {
      sectionTitle: "Location Info",
      fields: [
        { type: "text", label: "Warehouse / Store Name", required: true },
        { type: "date", label: "Inventory Date", required: true },
        { type: "location", label: "Location", required: false, extra: { displayMode: "coordinates" } },
      ],
    },
    {
      sectionTitle: "Stock Details",
      fields: [
        { type: "text", label: "SKU / Product Name", required: true },
        { type: "dropdown", label: "Product Category", required: true, extra: { options: ["Category A", "Category B", "Category C"] } },
        { type: "number", label: "Opening Stock", required: true },
        { type: "number", label: "Closing Stock", required: true },
        { type: "number", label: "Damaged / Expired Units", required: false },
        { type: "camera", label: "Stock Photo", required: false, extra: { allowCamera: true, allowGallery: true } },
        { type: "textarea", label: "Notes", required: false },
      ],
    },
  ],
  "stock return": [
    {
      sectionTitle: "Return Info",
      fields: [
        { type: "text", label: "Return Reference No.", required: true },
        { type: "date", label: "Return Date", required: true },
        { type: "text", label: "Store / Outlet Name", required: true },
        { type: "dropdown", label: "Return Reason", required: true, extra: { options: ["Expired", "Damaged", "Wrong Delivery", "Quality Issue", "Other"] } },
      ],
    },
    {
      sectionTitle: "Product Details",
      fields: [
        { type: "text", label: "Product Name / SKU", required: true },
        { type: "number", label: "Quantity Returned", required: true },
        { type: "number", label: "Unit Price", required: false },
        { type: "camera", label: "Product Photo", required: true, extra: { allowCamera: true, allowGallery: true } },
        { type: "textarea", label: "Additional Remarks", required: false },
      ],
    },
  ],
};

function detectActivity(text: string): string | null {
  const lower = text.toLowerCase();
  for (const key of Object.keys(activityTemplates)) {
    if (lower.includes(key)) return key;
  }
  return null;
}

function extractFieldsFromText(text: string): Array<{ type: FieldType; label: string; required: boolean; extra?: Partial<FormField> }> {
  const lower = text.toLowerCase();
  const fields: Array<{ type: FieldType; label: string; required: boolean; extra?: Partial<FormField> }> = [];
  const usedTypes = new Set<string>();

  for (const pattern of fieldPatterns) {
    for (const kw of pattern.keywords) {
      if (lower.includes(kw) && !usedTypes.has(pattern.type + pattern.label)) {
        // Try to derive a more specific label from the context
        const idx = lower.indexOf(kw);
        const surroundingText = text.substring(Math.max(0, idx - 30), Math.min(text.length, idx + kw.length + 30));

        fields.push({
          type: pattern.type,
          label: capitalizeLabel(kw, surroundingText),
          required: lower.includes("required") || lower.includes("mandatory"),
          extra: pattern.extra,
        });
        usedTypes.add(pattern.type + pattern.label);
        break;
      }
    }
  }

  return fields;
}

function capitalizeLabel(keyword: string, _context: string): string {
  return keyword
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function buildField(def: { type: FieldType; label: string; required: boolean; extra?: Partial<FormField> }): FormField {
  return {
    id: uuidv4(),
    type: def.type,
    label: def.label,
    hideLabel: false,
    required: def.required,
    validation: {},
    placeholder: def.type === "text" || def.type === "textarea" || def.type === "email" || def.type === "tel" || def.type === "url" || def.type === "number"
      ? `Enter ${def.label.toLowerCase()}...`
      : undefined,
    options: def.extra?.options,
    maxSelections: def.extra?.maxSelections,
    sliderMin: def.extra?.sliderMin,
    sliderMax: def.extra?.sliderMax,
    sliderStep: def.extra?.sliderStep,
    showDifference: def.extra?.showDifference,
    allowCamera: def.extra?.allowCamera,
    allowGallery: def.extra?.allowGallery,
    captureLocationWithImage: false,
    linkedLatFieldId: "",
    linkedLngFieldId: "",
    displayMode: def.extra?.displayMode as any,
    defaultValue: null,
    condition: null,
  };
}

export function generateFormFromJira(data: JiraIssueData): FormSchema {
  const fullText = `${data.summary} ${data.description}`.trim();

  // 1. Check if it matches a known activity template
  const activity = detectActivity(fullText);
  if (activity && activityTemplates[activity]) {
    const template = activityTemplates[activity];
    return {
      formId: uuidv4(),
      formName: data.summary || `${activity} Form`,
      version: "1.0",
      sections: template.map((sec) => ({
        id: uuidv4(),
        title: sec.sectionTitle,
        collapsed: false,
        fields: sec.fields.map(buildField),
      })),
      meta: {
        submitLabel: "Submit",
        submitEndpoint: "/api/forms/submit",
        createdAt: new Date().toISOString(),
      },
    };
  }

  // 2. Otherwise, extract fields from description text
  const extractedFields = extractFieldsFromText(fullText);

  // Always add a basic text name field if nothing else was extracted
  if (extractedFields.length === 0) {
    extractedFields.push(
      { type: "text", label: "Name", required: true },
      { type: "textarea", label: "Description", required: false },
    );
  }

  return {
    formId: uuidv4(),
    formName: data.summary || "Generated Form",
    version: "1.0",
    sections: [
      {
        id: uuidv4(),
        title: "Details",
        collapsed: false,
        fields: extractedFields.map(buildField),
      },
    ],
    meta: {
      submitLabel: "Submit",
      submitEndpoint: "/api/forms/submit",
      createdAt: new Date().toISOString(),
    },
  };
}
