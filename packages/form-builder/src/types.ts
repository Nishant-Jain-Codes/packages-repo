export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "number"
  | "tel"
  | "url"
  | "date"
  | "date-range"
  | "dropdown"
  | "multiselect"
  | "checkbox"
  | "radio"
  | "slider"
  | "camera"
  | "location";

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  patternMessage?: string;
}

export interface FieldDataSource {
  type: "static" | "api";
  apiEndpoint?: string;
  method?: "GET" | "POST";
  responseKey?: string;   // key in response that holds the array, e.g. "data.items"
  labelKey?: string;      // which property to use as display label, e.g. "name"
  valueKey?: string;      // which property to use as value, e.g. "id"
  headers?: Record<string, string>;
  dependsOn?: string;     // parent field id for cascading dropdowns
  optionsFormat?: string; // e.g. "stringList", "objectList"
}

export interface FieldPrefill {
  apiEndpoint?: string;
  method?: "GET" | "POST";
  responseKey?: string;   // path to value in response, e.g. "data.storeName"
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  hideLabel?: boolean;
  placeholder?: string;
  hintText?: string;
  required: boolean;
  validation: FieldValidation;
  options?: string[];
  defaultValue?: string | number | boolean | string[] | null;
  // API / Data binding
  columnName?: string;          // maps to DB column / API payload key
  dataSource?: FieldDataSource; // where options come from (static or API)
  prefill?: FieldPrefill;       // API to prefill this field's value
  // dropdown/multiselect
  maxSelections?: number;
  // slider
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  // date-range
  showDifference?: boolean;
  // camera
  allowGallery?: boolean;
  allowCamera?: boolean;
  captureLocationWithImage?: boolean;
  linkedLatFieldId?: string;
  linkedLngFieldId?: string;
  // location
  displayMode?: "map" | "coordinates" | "address";
  // conditional logic (future)
  condition?: FieldCondition | null;
}

export interface FieldCondition {
  fieldId: string;
  operator: "equals" | "not_equals" | "contains" | "not_empty";
  value: string;
}

export interface FormSection {
  id: string;
  title: string;
  collapsed?: boolean;
  fields: FormField[];
}

export interface FormSchema {
  formId: string;
  formName: string;
  version: string;
  sections: FormSection[];
  meta: {
    submitLabel: string;
    submitEndpoint: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface FieldDefinition {
  type: FieldType;
  label: string;
  icon: string;
  category: "text" | "choice" | "date" | "media" | "advanced";
  description: string;
  defaultConfig: Partial<FormField>;
}

export interface DragItem {
  type: "PALETTE_ITEM" | "CANVAS_FIELD";
  fieldType?: FieldType;
  fieldId?: string;
  sectionId?: string;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  schema: FormSchema;
  createdAt: string;
  updatedAt: string;
}
