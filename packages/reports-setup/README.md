# `@aditya-sharma-salescode/reports-setup`

Report configuration, preview, and portal screens built on **shared-ui** and integrated with **form-builder**. Published to **GitHub Packages**.

## Install

`.npmrc`:

```ini
@aditya-sharma-salescode:registry=https://npm.pkg.github.com
always-auth=true
```

```bash
npm install @aditya-sharma-salescode/reports-setup
```

### Peer dependency

This package expects **`@aditya-sharma-salescode/form-builder`** at a compatible version (see your lockfile / release notes). Install it in the same app:

```bash
npm install @aditya-sharma-salescode/form-builder
```

Also install:

```bash
npm install react react-dom react-router-dom
```

## Styles and rendering

1. Follow the **`@aditya-sharma-salescode/shared-ui`** README (same registry): import **`@aditya-sharma-salescode/shared-ui/dist/index.css`**, Tailwind `content` paths, and theme CSS variables.
2. **`@aditya-sharma-salescode/reports-ui`** is a dependency for portal UIs — use the **styles import** required by that package in your app (same as any other consumer of `reports-ui`).
3. Ensure **React Router** wraps routes that render these pages.

If tables or layouts look unstyled, fix **shared-ui** Tailwind/CSS first; then verify **reports-ui** styles are imported if you use the portal page.

## ManageReports page

`ManageReports` is a plug-in page that lets users **select which reports appear in the portal** and **configure each one** via a settings icon. It mirrors the `ManageForms` page in `form-builder`.

### JSON shape managed

```jsonc
{
  "app": { "tenant_id": "...", "tenant_name": "..." },

  // viewMeta.reports is the CATALOG — the master list of all available reports.
  // ManageReports reads this to build the section grid.
  "viewMeta": {
    "reports": [
      {
        "id": "brand_visibility_report",
        "name": "Brand Visibility Report",
        "type": "New Reports",           // → section header in the UI
        "description": "...",
        "reportName": "brand_visibility_report",
        "getAPI": "https://...",
        "isLiveReport": true,
        "dateRangeFilter": true,
        "shouldShowCustomFilters": true
      }
      // … more reports
    ]
  },

  "features": {
    "reports": {
      "enabled": true,
      "config": {
        // Only ENABLED reports live here.
        // Toggling OFF deletes the entire config object.
        // Toggling ON copies it from viewMeta.reports.
        "report_list": [
          { "id": "brand_visibility_report", "name": "Brand Visibility Report", /* … */ }
        ]
      }
    }
  }
}
```

### Toggle behaviour

| Action | `features.reports.config.report_list` |
|--------|---------------------------------------|
| Toggle **ON** | Full config object **copied** from `viewMeta.reports` into `report_list` |
| Toggle **OFF** | Config object **deleted** from `report_list` |

### Usage

```tsx
import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import {
  ReportsProvider,
  ManageReports,
  ReportConfigPage,
} from "@aditya-sharma-salescode/reports-setup";
import type { AppConfig } from "@aditya-sharma-salescode/reports-setup";

const STORAGE_KEY = "portalConfig";

function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function App() {
  const [appConfig, setAppConfig] = useState<AppConfig>(loadConfig);

  const handleConfigUpdate = (updated: AppConfig) => {
    setAppConfig(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // or: api.saveConfig(tenantId, updated);
  };

  return (
    <ReportsProvider
      config={{
        initialConfig: appConfig,
        onConfigUpdate: handleConfigUpdate,
        onEditReport: (id) => navigate(`/report-config?reportId=${id}`),
      }}
    >
      <Routes>
        <Route path="/manage-reports" element={
          <ManageReports
            onBack={() => navigate(-1)}
            onContinue={() => navigate("/next")}
          />
        } />
        <Route path="/report-config" element={<ReportConfigPage />} />
      </Routes>
    </ReportsProvider>
  );
}
```

### Building the `viewMeta.reports` catalog

The catalog drives the section grid. Each entry needs at minimum `id`, `name`, and `type` (the section header). Pass it in `initialConfig`:

```ts
const initialConfig: AppConfig = {
  app: { tenant_id: "my-tenant" },
  viewMeta: {
    reports: [
      { id: "attendance_report", name: "Attendance Report", type: "Transaction Reports", reportName: "attendance_report", dateRangeFilter: true },
      { id: "sales_report",      name: "Sales Report",      type: "Transaction Reports", reportName: "sales_report",      isLiveReport: true },
      { id: "brand_visibility",  name: "Brand Visibility",  type: "New Reports",         reportName: "brand_visibility",  shouldShowCustomFilters: true },
    ],
  },
  // If reports were previously enabled, include them here too:
  features: {
    reports: {
      enabled: true,
      config: { report_list: [] },
    },
  },
};
```

---

## Combining form-builder + reports-setup in one config

Both packages write into the **same** `PortalConfig` / `AppConfig` JSON, so you can use a single shared state object:

```ts
// form-builder writes:  features.app.config.schema   (activity forms)
//                       features.reports.config.report_list (activity reports)
// reports-setup writes: features.reports.config.report_list (portal reports)
// Both preserve each other's entries because they filter by id convention.

const [config, setConfig] = useState<AppConfig>(loadConfig);
const save = (updated: AppConfig) => {
  setConfig(updated);
  localStorage.setItem("portalConfig", JSON.stringify(updated));
};

// Pass the same `config` / `save` to both providers.
```

---

## Exports

| Area | Exports |
|------|---------|
| Provider | `ReportsProvider`, `useReportsConfig`, types `ReportsConfig`, `ReportsFeatures`, `ReportsServiceOverrides` |
| Manage reports | `ManageReports`, `useManageReportsStore`, types `ViewMetaReport`, `AppConfig`, util `buildUpdatedConfig` |
| Config editor | `ReportConfigPage` |
| Preview | `ReportPreviewPage` |
| Portal | `ReportsPage`, `syncReportsAuthLocalStorage` |
| Config service | `loadReportConfig`, `saveReportConfigLocal` |
| Voice | `buildReportConfigStaticPrompt`, `buildReportConfigContextUpdate` |
| Registries | `REPORT_CONFIG_ACTIONS`, `BEHAVIOR_FLAG_ALIASES`, `SECTION_ALIASES` |
| Types | `ReportCard`, `ReportBehaviorConfig` |
