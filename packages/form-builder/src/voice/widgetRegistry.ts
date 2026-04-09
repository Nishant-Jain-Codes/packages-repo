/**
 * widgetRegistry.ts
 *
 * Comprehensive knowledge base of all form field types.
 * Serves as the authoritative reference for the ElevenLabs Conversational AI
 * system prompt — so the agent understands what fields exist, their aliases,
 * properties, and typical use cases.
 */

export interface WidgetProperty {
  name: string;
  type: "string" | "boolean" | "number" | "string[]";
  description: string;
  example?: string;
}

export interface WidgetDefinition {
  fieldType: string;
  displayName: string;
  /** Natural-language phrases a user might say to refer to this field type */
  aliases: string[];
  description: string;
  useCase: string;
  properties: WidgetProperty[];
}

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    fieldType: "text",
    displayName: "Text",
    aliases: [
      "text", "text box", "text field", "text input",
      "single line", "short text", "name field", "single-line text",
    ],
    description: "Single-line free-text input for short answers",
    useCase: "Names, titles, codes, short descriptions",
    properties: [
      { name: "label",       type: "string",  description: "Visible field label",        example: "Customer Name" },
      { name: "placeholder", type: "string",  description: "Placeholder hint text" },
      { name: "hintText",    type: "string",  description: "Help text shown below the field" },
      { name: "required",    type: "boolean", description: "Whether the field must be filled" },
    ],
  },

  {
    fieldType: "textarea",
    displayName: "Text Area",
    aliases: [
      "textarea", "text area", "long text", "multi line", "multiline",
      "remarks", "notes", "comment", "comments", "description field",
      "free text", "paragraph",
    ],
    description: "Multi-line free-text input for longer answers",
    useCase: "Remarks, observations, notes, detailed descriptions, comments",
    properties: [
      { name: "label",       type: "string",  description: "Field label",   example: "Remarks" },
      { name: "placeholder", type: "string",  description: "Placeholder text" },
      { name: "hintText",    type: "string",  description: "Help text" },
      { name: "required",    type: "boolean", description: "Required flag" },
    ],
  },

  {
    fieldType: "email",
    displayName: "Email",
    aliases: ["email", "e-mail", "email address", "mail", "email id"],
    description: "Email address input with built-in format validation",
    useCase: "Contact email, user registration, correspondence",
    properties: [
      { name: "label",       type: "string",  description: "Field label",       example: "Email Address" },
      { name: "placeholder", type: "string",  description: "Placeholder",       example: "user@example.com" },
      { name: "required",    type: "boolean", description: "Required flag" },
    ],
  },

  {
    fieldType: "number",
    displayName: "Number",
    aliases: [
      "number", "numeric", "quantity", "count", "amount",
      "integer", "decimal", "digit", "value", "score",
    ],
    description: "Numeric input field accepting integers or decimals",
    useCase: "Quantities, counts, prices, measurements, numeric scores",
    properties: [
      { name: "label",       type: "string",  description: "Field label",   example: "Quantity" },
      { name: "placeholder", type: "string",  description: "Placeholder" },
      { name: "required",    type: "boolean", description: "Required flag" },
    ],
  },

  {
    fieldType: "tel",
    displayName: "Phone",
    aliases: [
      "phone", "telephone", "mobile", "mobile number", "phone number",
      "contact number", "contact", "tel", "cell phone", "whatsapp number",
    ],
    description: "Phone / mobile number input",
    useCase: "Mobile numbers, landlines, WhatsApp numbers, emergency contacts",
    properties: [
      { name: "label",    type: "string",  description: "Field label",   example: "Mobile Number" },
      { name: "required", type: "boolean", description: "Required flag" },
    ],
  },

  {
    fieldType: "url",
    displayName: "URL",
    aliases: ["url", "website", "link", "web address", "webpage", "http link"],
    description: "URL / website address input",
    useCase: "Website links, social media profiles, document URLs",
    properties: [
      { name: "label",       type: "string",  description: "Field label",   example: "Website" },
      { name: "placeholder", type: "string",  description: "Placeholder",   example: "https://example.com" },
      { name: "required",    type: "boolean", description: "Required flag" },
    ],
  },

  {
    fieldType: "date",
    displayName: "Date Picker",
    aliases: [
      "date", "date picker", "calendar", "date field", "day",
      "day picker", "single date", "date selector",
    ],
    description: "Calendar-based single date selection",
    useCase: "Visit date, order date, deadline, birthday, inspection date",
    properties: [
      { name: "label",    type: "string",  description: "Field label",   example: "Visit Date" },
      { name: "required", type: "boolean", description: "Required flag" },
    ],
  },

  {
    fieldType: "date-range",
    displayName: "Date Range",
    aliases: [
      "date range", "date period", "from to date", "start end date",
      "date span", "period", "duration", "from date to date",
    ],
    description: "Start + end date picker for ranges / periods",
    useCase: "Leave requests, campaign periods, availability windows, project timelines",
    properties: [
      { name: "label",          type: "string",  description: "Field label",               example: "Leave Period" },
      { name: "showDifference", type: "boolean", description: "Show number of days between selected dates" },
      { name: "required",       type: "boolean", description: "Required flag" },
    ],
  },

  {
    fieldType: "dropdown",
    displayName: "Dropdown",
    aliases: [
      "dropdown", "drop down", "select", "picker", "choose one",
      "single select", "combobox", "selection", "drop-down list",
    ],
    description: "Single-choice selection from a dropdown list",
    useCase: "Region, category, status, priority — any single choice from a predefined list",
    properties: [
      { name: "label",    type: "string",   description: "Field label",     example: "Region" },
      { name: "options",  type: "string[]", description: "List of choices", example: "['North', 'South', 'East', 'West']" },
      { name: "required", type: "boolean",  description: "Required flag" },
    ],
  },

  {
    fieldType: "multiselect",
    displayName: "Multi-Select",
    aliases: [
      "multiselect", "multi select", "multiple selection", "multiple choice",
      "multi-select", "multi pick", "pick many", "tags",
    ],
    description: "Multiple-choice selection — user can pick more than one option",
    useCase: "Skills, product categories, features selected, applicable regions",
    properties: [
      { name: "label",         type: "string",   description: "Field label" },
      { name: "options",       type: "string[]", description: "List of choices" },
      { name: "maxSelections", type: "number",   description: "Maximum allowed selections" },
      { name: "required",      type: "boolean",  description: "Required flag" },
    ],
  },

  {
    fieldType: "checkbox",
    displayName: "Checkbox",
    aliases: [
      "checkbox", "check box", "tick box", "tick",
      "yes no", "yes/no", "boolean", "toggle",
    ],
    description: "Single yes/no checkbox",
    useCase: "Agreement, confirmation, binary flag (e.g. 'Is refrigerator plugged in?')",
    properties: [
      { name: "label",    type: "string",  description: "Checkbox label",   example: "Visited the store?" },
      { name: "required", type: "boolean", description: "Required flag" },
    ],
  },

  {
    fieldType: "radio",
    displayName: "Radio Group",
    aliases: [
      "radio", "radio group", "radio button", "single choice",
      "one of many", "pick one", "exclusive choice",
    ],
    description: "Mutually exclusive single-choice radio button group",
    useCase: "Gender, priority level, satisfaction rating — visible options where only one can be selected",
    properties: [
      { name: "label",    type: "string",   description: "Group label" },
      { name: "options",  type: "string[]", description: "Radio options" },
      { name: "required", type: "boolean",  description: "Required flag" },
    ],
  },

  {
    fieldType: "slider",
    displayName: "Slider",
    aliases: [
      "slider", "range slider", "scale", "rating scale",
      "rating", "score slider", "range input", "percentage",
    ],
    description: "Numeric range slider with configurable min/max/step",
    useCase: "Satisfaction score (1–10), temperature, coverage percentage, NPS rating",
    properties: [
      { name: "label",      type: "string",  description: "Field label",         example: "Satisfaction Score" },
      { name: "sliderMin",  type: "number",  description: "Minimum value",        example: "0" },
      { name: "sliderMax",  type: "number",  description: "Maximum value",        example: "10" },
      { name: "sliderStep", type: "number",  description: "Step increment",       example: "1" },
      { name: "required",   type: "boolean", description: "Required flag" },
    ],
  },

  {
    fieldType: "camera",
    displayName: "Image Picker",
    aliases: [
      "camera", "image picker", "photo", "picture", "image",
      "image upload", "capture", "photo picker", "attachment",
      "photo field", "take photo", "shelf photo",
    ],
    description: "Camera capture or image gallery picker",
    useCase: "Product shelf photos, store exterior, damaged goods evidence, delivery proof",
    properties: [
      { name: "label",        type: "string",  description: "Field label",             example: "Store Front Photo" },
      { name: "allowCamera",  type: "boolean", description: "Allow live camera (default true)" },
      { name: "allowGallery", type: "boolean", description: "Allow gallery picker (default true)" },
      { name: "required",     type: "boolean", description: "Required flag" },
    ],
  },

  {
    fieldType: "location",
    displayName: "Location",
    aliases: [
      "location", "gps", "map", "coordinates", "address",
      "geo location", "geolocation", "place", "geo", "lat long",
    ],
    description: "GPS / location capture from device",
    useCase: "Store GPS stamp, delivery point, field visit location, current address",
    properties: [
      { name: "label",       type: "string",  description: "Field label",                         example: "Store Location" },
      { name: "displayMode", type: "string",  description: "'map' | 'coordinates' | 'address'" },
      { name: "required",    type: "boolean", description: "Required flag" },
    ],
  },
];

/** Quick lookup by fieldType string */
export const WIDGET_MAP = new Map<string, WidgetDefinition>(
  WIDGET_REGISTRY.map((w) => [w.fieldType, w])
);
