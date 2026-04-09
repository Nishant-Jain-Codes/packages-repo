import type { FormSchema } from "../types";

export function exportSchemaAsJson(schema: FormSchema): string {
  return JSON.stringify(schema, null, 2);
}

export function downloadSchema(schema: FormSchema) {
  const json = exportSchemaAsJson(schema);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${schema.formName.replace(/\s+/g, "_").toLowerCase()}_schema.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseSchemaFromJson(jsonString: string): FormSchema | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (
      parsed &&
      typeof parsed.formId === "string" &&
      Array.isArray(parsed.sections)
    ) {
      return parsed as FormSchema;
    }
    return null;
  } catch {
    return null;
  }
}

export function importSchemaFromFile(): Promise<FormSchema | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const text = await file.text();
        resolve(parseSchemaFromJson(text));
      } catch {
        resolve(null);
      }
    };
    input.click();
  });
}
