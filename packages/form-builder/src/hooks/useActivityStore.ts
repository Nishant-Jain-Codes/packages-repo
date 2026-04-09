import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { Activity, FormSchema } from "../types";

const STORAGE_KEY = "formActivities";

function createDefaultSchema(name: string): FormSchema {
  return {
    formId: uuidv4(),
    formName: name,
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
  };
}

const defaultActivities: Activity[] = [
  {
    id: uuidv4(),
    name: "Merchandising",
    description:
      "Capture shelf displays, planogram compliance, and product visibility at outlets",
    enabled: true,
    schema: {
      formId: uuidv4(),
      formName: "Merchandising",
      version: "1.0",
      sections: [
        {
          id: uuidv4(),
          title: "Store Details",
          collapsed: false,
          fields: [
            {
              id: uuidv4(),
              type: "camera",
              label: "Shelf Photo",
              required: true,
              validation: {},
              allowGallery: true,
              allowCamera: true,
              condition: null,
            },
            {
              id: uuidv4(),
              type: "dropdown",
              label: "Display Type",
              required: true,
              validation: {},
              options: [
                "End Cap",
                "Shelf Display",
                "Floor Stand",
                "Counter Top",
              ],
              condition: null,
            },
            {
              id: uuidv4(),
              type: "textarea",
              label: "Remarks",
              placeholder: "Enter any observations...",
              required: false,
              validation: { maxLength: 500 },
              condition: null,
            },
          ],
        },
      ],
      meta: {
        submitLabel: "Submit",
        submitEndpoint: "/api/forms/submit",
        createdAt: new Date().toISOString(),
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Competition Activity",
    description:
      "Track competitor product presence, pricing, and promotions at retail outlets",
    enabled: true,
    schema: {
      formId: uuidv4(),
      formName: "Competition Activity",
      version: "1.0",
      sections: [
        {
          id: uuidv4(),
          title: "Competitor Info",
          collapsed: false,
          fields: [
            {
              id: uuidv4(),
              type: "camera",
              label: "Competitor Photo",
              required: true,
              validation: {},
              allowGallery: true,
              allowCamera: true,
              condition: null,
            },
            {
              id: uuidv4(),
              type: "text",
              label: "Competitor Brand",
              placeholder: "Enter brand name...",
              required: true,
              validation: { maxLength: 255 },
              condition: null,
            },
            {
              id: uuidv4(),
              type: "dropdown",
              label: "Activity Type",
              required: true,
              validation: {},
              options: [
                "Price Drop",
                "New Product Launch",
                "Promotion",
                "Display Change",
              ],
              condition: null,
            },
          ],
        },
      ],
      meta: {
        submitLabel: "Submit",
        submitEndpoint: "/api/forms/submit",
        createdAt: new Date().toISOString(),
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Outlet Visit",
    description:
      "Standard outlet visit with order capture, stock check, and retailer feedback",
    enabled: true,
    schema: {
      formId: uuidv4(),
      formName: "Outlet Visit",
      version: "1.0",
      sections: [
        {
          id: uuidv4(),
          title: "Visit Details",
          collapsed: false,
          fields: [
            {
              id: uuidv4(),
              type: "camera",
              label: "Store Front Photo",
              required: true,
              validation: {},
              allowGallery: true,
              allowCamera: true,
              condition: null,
            },
            {
              id: uuidv4(),
              type: "textarea",
              label: "Visit Notes",
              placeholder: "Enter visit notes...",
              required: false,
              validation: { maxLength: 1000 },
              condition: null,
            },
          ],
        },
      ],
      meta: {
        submitLabel: "Submit",
        submitEndpoint: "/api/forms/submit",
        createdAt: new Date().toISOString(),
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "DB Visit",
    description:
      "Distributor / stockist visit for stock verification and relationship management",
    enabled: false,
    schema: {
      formId: uuidv4(),
      formName: "DB Visit",
      version: "1.0",
      sections: [
        {
          id: uuidv4(),
          title: "Distributor Details",
          collapsed: false,
          fields: [
            {
              id: uuidv4(),
              type: "camera",
              label: "DB Photo",
              required: true,
              validation: {},
              allowGallery: true,
              allowCamera: true,
              condition: null,
            },
            {
              id: uuidv4(),
              type: "dropdown",
              label: "Stock Status",
              required: true,
              validation: {},
              options: ["In Stock", "Low Stock", "Out of Stock"],
              condition: null,
            },
            {
              id: uuidv4(),
              type: "textarea",
              label: "Remarks",
              placeholder: "Enter remarks...",
              required: false,
              validation: { maxLength: 500 },
              condition: null,
            },
          ],
        },
      ],
      meta: {
        submitLabel: "Submit",
        submitEndpoint: "/api/forms/submit",
        createdAt: new Date().toISOString(),
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Asset Tracking",
    description:
      "Track company assets like coolers, displays, signage deployed at outlets",
    enabled: false,
    schema: {
      formId: uuidv4(),
      formName: "Asset Tracking",
      version: "1.0",
      sections: [
        {
          id: uuidv4(),
          title: "Asset Details",
          collapsed: false,
          fields: [
            {
              id: uuidv4(),
              type: "camera",
              label: "Asset Photo",
              required: true,
              validation: {},
              allowGallery: true,
              allowCamera: true,
              condition: null,
            },
            {
              id: uuidv4(),
              type: "dropdown",
              label: "Asset Condition",
              required: true,
              validation: {},
              options: ["Good", "Needs Repair", "Damaged", "Missing"],
              condition: null,
            },
            {
              id: uuidv4(),
              type: "text",
              label: "Asset ID / Serial",
              placeholder: "Enter asset ID...",
              required: true,
              validation: { maxLength: 100 },
              condition: null,
            },
          ],
        },
      ],
      meta: {
        submitLabel: "Submit",
        submitEndpoint: "/api/forms/submit",
        createdAt: new Date().toISOString(),
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "NPD Display",
    description:
      "New Product Display tracking — ensure new launches are visible and available",
    enabled: false,
    schema: {
      formId: uuidv4(),
      formName: "NPD Display",
      version: "1.0",
      sections: [
        {
          id: uuidv4(),
          title: "Display Info",
          collapsed: false,
          fields: [
            {
              id: uuidv4(),
              type: "camera",
              label: "Display Photo",
              required: true,
              validation: {},
              allowGallery: true,
              allowCamera: true,
              condition: null,
            },
            {
              id: uuidv4(),
              type: "text",
              label: "Product Name",
              placeholder: "Enter product name...",
              required: true,
              validation: { maxLength: 255 },
              condition: null,
            },
            {
              id: uuidv4(),
              type: "dropdown",
              label: "Display Location",
              required: true,
              validation: {},
              options: [
                "Eye Level Shelf",
                "Top Shelf",
                "Bottom Shelf",
                "End Cap",
                "Counter",
              ],
              condition: null,
            },
          ],
        },
      ],
      meta: {
        submitLabel: "Submit",
        submitEndpoint: "/api/forms/submit",
        createdAt: new Date().toISOString(),
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface ActivityStore {
  activities: Activity[];
  selectedActivityId: string | null;

  // Actions
  setActivities: (activities: Activity[]) => void;
  addActivity: (name: string, description: string) => Activity;
  removeActivity: (id: string) => void;
  toggleActivity: (id: string) => void;
  updateActivitySchema: (id: string, schema: FormSchema) => void;
  updateActivity: (id: string, updates: Partial<Pick<Activity, "name" | "description">>) => void;
  selectActivity: (id: string | null) => void;
  getActivity: (id: string) => Activity | undefined;

  // Persistence
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  activities: [],
  selectedActivityId: null,

  setActivities: (activities) => set({ activities }),

  addActivity: (name, description) => {
    const newActivity: Activity = {
      id: uuidv4(),
      name,
      description,
      enabled: true,
      schema: createDefaultSchema(name),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      activities: [newActivity, ...state.activities],
      selectedActivityId: newActivity.id,
    }));
    get().saveToLocalStorage();
    return newActivity;
  },

  removeActivity: (id) => {
    set((state) => ({
      activities: state.activities.filter((a) => a.id !== id),
      selectedActivityId:
        state.selectedActivityId === id ? null : state.selectedActivityId,
    }));
    get().saveToLocalStorage();
  },

  toggleActivity: (id) => {
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === id
          ? { ...a, enabled: !a.enabled, updatedAt: new Date().toISOString() }
          : a
      ),
    }));
    get().saveToLocalStorage();
  },

  updateActivitySchema: (id, schema) => {
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === id
          ? {
              ...a,
              schema,
              name: schema.formName,
              updatedAt: new Date().toISOString(),
            }
          : a
      ),
    }));
    get().saveToLocalStorage();
  },

  updateActivity: (id, updates) => {
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === id
          ? { ...a, ...updates, updatedAt: new Date().toISOString() }
          : a
      ),
    }));
    get().saveToLocalStorage();
  },

  selectActivity: (id) => set({ selectedActivityId: id }),

  getActivity: (id) => get().activities.find((a) => a.id === id),

  saveToLocalStorage: () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(get().activities));
    } catch (e) {
      console.error("Failed to save activities:", e);
    }
  },

  loadFromLocalStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Activity[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          set({ activities: parsed, selectedActivityId: parsed[0]?.id || null });
          return;
        }
      }
      // No stored data — seed with defaults
      set({
        activities: defaultActivities,
        selectedActivityId: defaultActivities[0]?.id || null,
      });
      get().saveToLocalStorage();
    } catch {
      set({
        activities: defaultActivities,
        selectedActivityId: defaultActivities[0]?.id || null,
      });
      get().saveToLocalStorage();
    }
  },
}));
