import type { FieldDefinition } from "../types";

export const fieldRegistry: FieldDefinition[] = [
  // Text inputs
  {
    type: "text",
    label: "Text Input",
    icon: "Type",
    category: "text",
    description: "Single-line text field",
    defaultConfig: {
      label: "Text Field",
      placeholder: "Enter text...",
      required: false,
      validation: { maxLength: 255 },
    },
  },
  {
    type: "textarea",
    label: "Text Area",
    icon: "AlignLeft",
    category: "text",
    description: "Multi-line text field",
    defaultConfig: {
      label: "Text Area",
      placeholder: "Enter detailed text...",
      required: false,
      validation: { maxLength: 1000 },
    },
  },
  {
    type: "email",
    label: "Email",
    icon: "Mail",
    category: "text",
    description: "Email address field with validation",
    defaultConfig: {
      label: "Email Address",
      placeholder: "name@example.com",
      required: false,
      validation: {
        pattern: "^[\\w.-]+@[\\w.-]+\\.\\w{2,}$",
        patternMessage: "Please enter a valid email address",
      },
    },
  },
  {
    type: "number",
    label: "Number",
    icon: "Hash",
    category: "text",
    description: "Numeric input field",
    defaultConfig: {
      label: "Number",
      placeholder: "0",
      required: false,
      validation: {},
    },
  },
  {
    type: "tel",
    label: "Phone",
    icon: "Phone",
    category: "text",
    description: "Phone number field",
    defaultConfig: {
      label: "Phone Number",
      placeholder: "+1 (555) 000-0000",
      required: false,
      validation: {},
    },
  },
  {
    type: "url",
    label: "URL",
    icon: "Link",
    category: "text",
    description: "URL/website field",
    defaultConfig: {
      label: "Website URL",
      placeholder: "https://example.com",
      required: false,
      validation: {
        pattern: "^https?://.*",
        patternMessage: "Please enter a valid URL",
      },
    },
  },

  // Choice fields
  {
    type: "dropdown",
    label: "Dropdown",
    icon: "ChevronDown",
    category: "choice",
    description: "Single-select dropdown",
    defaultConfig: {
      label: "Select Option",
      required: false,
      options: ["Option 1", "Option 2", "Option 3"],
      validation: {},
    },
  },
  {
    type: "multiselect",
    label: "Multi Select",
    icon: "ListChecks",
    category: "choice",
    description: "Multiple selection dropdown",
    defaultConfig: {
      label: "Select Multiple",
      required: false,
      options: ["Option 1", "Option 2", "Option 3"],
      maxSelections: 3,
      validation: {},
    },
  },
  {
    type: "checkbox",
    label: "Checkbox",
    icon: "CheckSquare",
    category: "choice",
    description: "Checkbox group",
    defaultConfig: {
      label: "Checkbox Group",
      required: false,
      options: ["Option 1", "Option 2", "Option 3"],
      validation: {},
    },
  },
  {
    type: "radio",
    label: "Radio Group",
    icon: "Circle",
    category: "choice",
    description: "Single-select radio buttons",
    defaultConfig: {
      label: "Radio Selection",
      required: false,
      options: ["Option 1", "Option 2", "Option 3"],
      validation: {},
    },
  },

  // Date fields
  {
    type: "date",
    label: "Date Picker",
    icon: "Calendar",
    category: "date",
    description: "Single date selection",
    defaultConfig: {
      label: "Select Date",
      required: false,
      validation: {},
    },
  },
  {
    type: "date-range",
    label: "Date Range",
    icon: "CalendarRange",
    category: "date",
    description: "Start and end date selection",
    defaultConfig: {
      label: "Date Range",
      required: false,
      showDifference: false,
      validation: {},
    },
  },

  // Advanced fields
  {
    type: "slider",
    label: "Slider",
    icon: "SlidersHorizontal",
    category: "advanced",
    description: "Range slider with min/max",
    defaultConfig: {
      label: "Slider",
      required: false,
      sliderMin: 0,
      sliderMax: 100,
      sliderStep: 1,
      validation: {},
    },
  },

  // Media fields
  {
    type: "camera",
    label: "Image Upload",
    icon: "Camera",
    category: "media",
    description: "Camera capture or image upload",
    defaultConfig: {
      label: "Upload Image",
      required: false,
      allowGallery: true,
      allowCamera: true,
      validation: {},
    },
  },
  {
    type: "location",
    label: "Location",
    icon: "MapPin",
    category: "media",
    description: "Geolocation with coordinates",
    defaultConfig: {
      label: "Location",
      required: false,
      displayMode: "coordinates",
      validation: {},
    },
  },
];

export const getFieldDefinition = (type: string): FieldDefinition | undefined =>
  fieldRegistry.find((f) => f.type === type);

export const getFieldsByCategory = () => {
  const categories = {
    text: { label: "Text Inputs", fields: [] as FieldDefinition[] },
    choice: { label: "Choice Fields", fields: [] as FieldDefinition[] },
    date: { label: "Date & Time", fields: [] as FieldDefinition[] },
    media: { label: "Media", fields: [] as FieldDefinition[] },
    advanced: { label: "Advanced", fields: [] as FieldDefinition[] },
  };

  fieldRegistry.forEach((field) => {
    categories[field.category].fields.push(field);
  });

  return categories;
};
