# `@aditya-sharma-salescode/form-builder`

Form builder (activities + drag-and-drop canvas), **voice agent**, and embedded **reports** (config, preview, portal). Published to **GitHub Packages**.

## Plug-and-play (one component)

**Demo / isolated app** (includes `BrowserRouter`):

```tsx
import { FormBuilderStandalone } from "@aditya-sharma-salescode/form-builder";

export default function Page() {
  return <FormBuilderStandalone />;
}
```

Uses URLs like `/manage-forms`, `/form-builder/:id`, `/report-preview`, …

**Inside your existing router**:

```tsx
import { Route, Routes } from "react-router-dom";
import { FormBuilderPlugIn } from "@aditya-sharma-salescode/form-builder";

<Routes>
  <Route path="/suite/*" element={<FormBuilderPlugIn routePrefix="/suite" />} />
</Routes>
```

Then link to `/suite/manage-forms`. See **`FormBuilderPlugIn`** props for `mode` (`nested` vs `root`).

---

## Install

`.npmrc`:

```ini
@aditya-sharma-salescode:registry=https://npm.pkg.github.com
always-auth=true
```

```bash
npm install @aditya-sharma-salescode/form-builder
```

### Peer dependencies

```bash
npm install react react-dom react-router-dom
```

The app must use **React Router** — in-package navigation calls `useNavigate()` and expects matching route definitions.

### Related UI packages

- **`@aditya-sharma-salescode/shared-ui`** — import **`@aditya-sharma-salescode/shared-ui/dist/index.css`**, extend Tailwind `content` to include `shared-ui`’s `dist`, and define shadcn theme CSS variables (see that package’s README).
- **`@aditya-sharma-salescode/reports-ui`** — for embedded report UIs, install a compatible version and import its global styles as that package documents.

## Recommended integration (full flow + voice)

Wrap the **whole** area (layout + routes) in **`FormBuilderProvider`**, then **`FormBuilderLayout`**. The layout keeps **one** voice session and renders **`VoiceAgentPanel`** + action feed across navigations.

`FormBuilder` and **`ManageForms`** require **`VoiceAgentProvider`** (provided by `FormBuilderLayout`). Report config/preview screens also use the voice context.

### Route paths

Navigation uses these segments (optionally prefixed — see **`routePrefix`**):

| Path | Screen |
|------|--------|
| `…/manage-forms` | Activity list (`ManageForms`) |
| `…/form-builder/:activityId?` | Canvas (`FormBuilder`; `activityId` optional for “blank” builder) |
| `…/report-config` | Report configuration |
| `…/report-preview` | Report preview |
| `…/reports` (optional) | Reports portal (`ReportsPage`) — register if you use it |

With **`routePrefix: "/admin/suite"`**, URLs become `/admin/suite/manage-forms`, `/admin/suite/form-builder/:id`, etc. Use the same value in **`FormBuilderProvider`** and in your **`<Routes>`** paths.

You can read resolved paths in the app with **`useFormBuilderConfig().routes`** or **`buildFormBuilderRoutes(prefix)`** when defining routes.

### Example: nested under one segment (recommended with `routePrefix`)

`routePrefix` must match the URL prefix your users hit (no trailing slash).

```tsx
import { Routes, Route, BrowserRouter } from "react-router-dom";
import {
  FormBuilderProvider,
  FormBuilderLayout,
  ManageForms,
  FormBuilder,
  ReportConfigPage,
  ReportPreviewPage,
  ReportsPage,
} from "@aditya-sharma-salescode/form-builder";

export function FormBuilderApp() {
  return (
    <BrowserRouter>
      <FormBuilderProvider config={{ routePrefix: "/suite" }}>
        <Routes>
          <Route path="/suite" element={<FormBuilderLayout />}>
            <Route path="manage-forms" element={<ManageForms />} />
            <Route path="form-builder/:activityId?" element={<FormBuilder />} />
            <Route path="report-config" element={<ReportConfigPage />} />
            <Route path="report-preview" element={<ReportPreviewPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
        </Routes>
      </FormBuilderProvider>
    </BrowserRouter>
  );
}
```

Your app navbar can link once to **`/suite/manage-forms`** (or `/manage-forms` if you omit `routePrefix` and define those paths at the router root).

### Example: routes at the app root (`routePrefix` omitted)

Use **`FormBuilderProvider`** without `routePrefix` (or `routePrefix: ""`) and mount paths such as `/manage-forms`, `/form-builder/:activityId?`, `/report-config`, `/report-preview` on **`FormBuilderLayout`**.

### Public exports (high level)

- **Shell:** `FormBuilderLayout`, `FormBuilderProvider`, `useFormBuilderConfig`
- **Screens:** `ManageForms`, `FormBuilder`, `ReportConfigPage`, `ReportPreviewPage`, `ReportsPage`
- **Voice:** `VoiceAgentProvider`, `useVoiceAgentContext`, `UICallbacks` (for advanced wiring)
- **Routes:** `buildFormBuilderRoutes`, `resolveLegacyNavigatePath`
- **State:** `useActivityStore`, `syncReportsAuthLocalStorage`

## Why the UI can look wrong

1. **Missing shared-ui CSS** — import `@aditya-sharma-salescode/shared-ui/dist/index.css` in your entry file.
2. **Tailwind not scanning** this package’s `dist` — extend `tailwind.config` `content` accordingly.
3. **Routes not registered** — mismatched paths vs `routePrefix` breaks in-app navigation.
4. **No `VoiceAgentProvider` ancestor** — `FormBuilder` / `ManageForms` / report pages that use voice will throw if the layout is wrong.

## Minimal usage (builder only, no voice shell)

If you mount only `<FormBuilder />`, you must still wrap it with **`VoiceAgentProvider`** (and usually **`FormBuilderProvider`**) so hooks do not throw. For voice UI, prefer **`FormBuilderLayout`** as above.
