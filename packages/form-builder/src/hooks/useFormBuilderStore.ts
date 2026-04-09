import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { FormSchema, FormSection, FormField, FieldType } from "../types";
import { getFieldDefinition } from "../fields";

interface HistoryEntry {
  sections: FormSection[];
}

interface FormBuilderState {
  // Form data
  schema: FormSchema;
  // Selection
  selectedFieldId: string | null;
  selectedSectionId: string | null;
  // UI state
  mode: "build" | "preview";
  isPaletteCollapsed: boolean;
  // History for undo/redo
  history: HistoryEntry[];
  historyIndex: number;

  // Actions - Form metadata
  setFormName: (name: string) => void;
  setSubmitLabel: (label: string) => void;
  setSubmitEndpoint: (endpoint: string) => void;

  // Actions - Sections
  addSection: (title?: string) => void;
  removeSection: (sectionId: string) => void;
  renameSection: (sectionId: string, title: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  toggleSectionCollapse: (sectionId: string) => void;

  // Actions - Fields
  addField: (sectionId: string, fieldType: FieldType, index?: number) => void;
  removeField: (sectionId: string, fieldId: string) => void;
  updateField: (sectionId: string, fieldId: string, updates: Partial<FormField>) => void;
  moveField: (
    fromSectionId: string,
    toSectionId: string,
    fieldId: string,
    toIndex: number
  ) => void;
  reorderField: (sectionId: string, fromIndex: number, toIndex: number) => void;
  duplicateField: (sectionId: string, fieldId: string) => void;

  // Actions - Selection
  selectField: (fieldId: string | null, sectionId?: string | null) => void;
  clearSelection: () => void;

  // Actions - UI
  setMode: (mode: "build" | "preview") => void;
  togglePalette: () => void;

  // Actions - History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Actions - Import/Export
  exportSchema: () => FormSchema;
  importSchema: (schema: FormSchema) => void;
  resetForm: () => void;

  // Actions - Persistence
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
}

const createDefaultSchema = (): FormSchema => ({
  formId: uuidv4(),
  formName: "Untitled Form",
  version: "1.0",
  sections: [
    {
      id: uuidv4(),
      title: "Section 1",
      collapsed: false,
      fields: [],
    },
  ],
  meta: {
    submitLabel: "Submit",
    submitEndpoint: "/api/forms/submit",
    createdAt: new Date().toISOString(),
  },
});

const STORAGE_KEY = "formBuilderState";
const MAX_HISTORY = 50;

export const useFormBuilderStore = create<FormBuilderState>((set, get) => {
  const pushHistory = (sections: FormSection[]) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ sections: JSON.parse(JSON.stringify(sections)) });
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    return { history: newHistory, historyIndex: newHistory.length - 1 };
  };

  const updateSections = (
    updater: (sections: FormSection[]) => FormSection[]
  ) => {
    set((state) => {
      const newSections = updater(JSON.parse(JSON.stringify(state.schema.sections)));
      return {
        schema: { ...state.schema, sections: newSections, meta: { ...state.schema.meta, updatedAt: new Date().toISOString() } },
        ...pushHistory(newSections),
      };
    });
  };

  const defaultSchema = createDefaultSchema();

  return {
    schema: defaultSchema,
    selectedFieldId: null,
    selectedSectionId: null,
    mode: "build",
    isPaletteCollapsed: false,
    history: [{ sections: JSON.parse(JSON.stringify(defaultSchema.sections)) }],
    historyIndex: 0,

    // Form metadata
    setFormName: (name) =>
      set((state) => ({ schema: { ...state.schema, formName: name } })),
    setSubmitLabel: (label) =>
      set((state) => ({
        schema: { ...state.schema, meta: { ...state.schema.meta, submitLabel: label } },
      })),
    setSubmitEndpoint: (endpoint) =>
      set((state) => ({
        schema: {
          ...state.schema,
          meta: { ...state.schema.meta, submitEndpoint: endpoint },
        },
      })),

    // Sections
    addSection: (title) => {
      updateSections((sections) => [
        ...sections,
        { id: uuidv4(), title: title || `Section ${sections.length + 1}`, collapsed: false, fields: [] },
      ]);
    },

    removeSection: (sectionId) => {
      updateSections((sections) => sections.filter((s) => s.id !== sectionId));
      set({ selectedFieldId: null, selectedSectionId: null });
    },

    renameSection: (sectionId, title) => {
      updateSections((sections) =>
        sections.map((s) => (s.id === sectionId ? { ...s, title } : s))
      );
    },

    reorderSections: (fromIndex, toIndex) => {
      updateSections((sections) => {
        const result = [...sections];
        const [removed] = result.splice(fromIndex, 1);
        result.splice(toIndex, 0, removed);
        return result;
      });
    },

    toggleSectionCollapse: (sectionId) => {
      set((state) => ({
        schema: {
          ...state.schema,
          sections: state.schema.sections.map((s) =>
            s.id === sectionId ? { ...s, collapsed: !s.collapsed } : s
          ),
        },
      }));
    },

    // Fields
    addField: (sectionId, fieldType, index) => {
      const definition = getFieldDefinition(fieldType);
      if (!definition) return;

      const newField: FormField = {
        id: uuidv4(),
        type: fieldType,
        label: definition.defaultConfig.label || "New Field",
        placeholder: definition.defaultConfig.placeholder,
        hintText: definition.defaultConfig.hintText,
        required: definition.defaultConfig.required || false,
        validation: definition.defaultConfig.validation || {},
        options: definition.defaultConfig.options,
        defaultValue: definition.defaultConfig.defaultValue ?? null,
        maxSelections: definition.defaultConfig.maxSelections,
        sliderMin: definition.defaultConfig.sliderMin,
        sliderMax: definition.defaultConfig.sliderMax,
        sliderStep: definition.defaultConfig.sliderStep,
        showDifference: definition.defaultConfig.showDifference,
        allowGallery: definition.defaultConfig.allowGallery,
        allowCamera: definition.defaultConfig.allowCamera,
        displayMode: definition.defaultConfig.displayMode,
        columnName: "",
        dataSource: { type: "static" },
        prefill: undefined,
        condition: null,
      };

      updateSections((sections) =>
        sections.map((s) => {
          if (s.id !== sectionId) return s;
          const fields = [...s.fields];
          if (index !== undefined) {
            fields.splice(index, 0, newField);
          } else {
            fields.push(newField);
          }
          return { ...s, fields };
        })
      );

      set({ selectedFieldId: newField.id, selectedSectionId: sectionId });
    },

    removeField: (sectionId, fieldId) => {
      updateSections((sections) =>
        sections.map((s) =>
          s.id === sectionId
            ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) }
            : s
        )
      );
      set((state) => ({
        selectedFieldId: state.selectedFieldId === fieldId ? null : state.selectedFieldId,
        selectedSectionId: state.selectedFieldId === fieldId ? null : state.selectedSectionId,
      }));
    },

    updateField: (sectionId, fieldId, updates) => {
      updateSections((sections) =>
        sections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                fields: s.fields.map((f) =>
                  f.id === fieldId ? { ...f, ...updates } : f
                ),
              }
            : s
        )
      );
    },

    moveField: (fromSectionId, toSectionId, fieldId, toIndex) => {
      updateSections((sections) => {
        let movedField: FormField | null = null;
        const updated = sections.map((s) => {
          if (s.id === fromSectionId) {
            const field = s.fields.find((f) => f.id === fieldId);
            if (field) movedField = { ...field };
            return { ...s, fields: s.fields.filter((f) => f.id !== fieldId) };
          }
          return s;
        });

        if (!movedField) return sections;

        return updated.map((s) => {
          if (s.id === toSectionId) {
            const fields = [...s.fields];
            fields.splice(toIndex, 0, movedField!);
            return { ...s, fields };
          }
          return s;
        });
      });

      set({ selectedSectionId: toSectionId });
    },

    reorderField: (sectionId, fromIndex, toIndex) => {
      updateSections((sections) =>
        sections.map((s) => {
          if (s.id !== sectionId) return s;
          const fields = [...s.fields];
          const [removed] = fields.splice(fromIndex, 1);
          fields.splice(toIndex, 0, removed);
          return { ...s, fields };
        })
      );
    },

    duplicateField: (sectionId, fieldId) => {
      updateSections((sections) =>
        sections.map((s) => {
          if (s.id !== sectionId) return s;
          const idx = s.fields.findIndex((f) => f.id === fieldId);
          if (idx === -1) return s;
          const original = s.fields[idx];
          const duplicate: FormField = {
            ...JSON.parse(JSON.stringify(original)),
            id: uuidv4(),
            label: `${original.label} (copy)`,
          };
          const fields = [...s.fields];
          fields.splice(idx + 1, 0, duplicate);
          return { ...s, fields };
        })
      );
    },

    // Selection
    selectField: (fieldId, sectionId) =>
      set({ selectedFieldId: fieldId, selectedSectionId: sectionId ?? null }),
    clearSelection: () => set({ selectedFieldId: null, selectedSectionId: null }),

    // UI
    setMode: (mode) => set({ mode }),
    togglePalette: () => set((s) => ({ isPaletteCollapsed: !s.isPaletteCollapsed })),

    // History
    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex <= 0) return;
      const newIndex = historyIndex - 1;
      const entry = history[newIndex];
      set((state) => ({
        historyIndex: newIndex,
        schema: {
          ...state.schema,
          sections: JSON.parse(JSON.stringify(entry.sections)),
        },
        selectedFieldId: null,
        selectedSectionId: null,
      }));
    },

    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex >= history.length - 1) return;
      const newIndex = historyIndex + 1;
      const entry = history[newIndex];
      set((state) => ({
        historyIndex: newIndex,
        schema: {
          ...state.schema,
          sections: JSON.parse(JSON.stringify(entry.sections)),
        },
        selectedFieldId: null,
        selectedSectionId: null,
      }));
    },

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    // Import/Export
    exportSchema: () => {
      const { schema } = get();
      return JSON.parse(JSON.stringify(schema));
    },

    importSchema: (imported) => {
      set((state) => ({
        schema: { ...imported },
        selectedFieldId: null,
        selectedSectionId: null,
        ...pushHistory(imported.sections),
      }));
    },

    resetForm: () => {
      const fresh = createDefaultSchema();
      set({
        schema: fresh,
        selectedFieldId: null,
        selectedSectionId: null,
        mode: "build",
        history: [{ sections: JSON.parse(JSON.stringify(fresh.sections)) }],
        historyIndex: 0,
      });
    },

    // Persistence
    saveToLocalStorage: () => {
      const { schema } = get();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(schema));
      } catch (e) {
        console.error("Failed to save form to localStorage:", e);
      }
    },

    loadFromLocalStorage: () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return false;
        const parsed = JSON.parse(stored) as FormSchema;
        if (parsed && parsed.sections) {
          set({
            schema: parsed,
            history: [{ sections: JSON.parse(JSON.stringify(parsed.sections)) }],
            historyIndex: 0,
          });
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
  };
});
