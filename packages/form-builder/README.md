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

**Inside your existing router** (prefix path and `routePrefix` must match):

```tsx
import { Route, Routes } from "react-router-dom";
import { FormBuilderPlugIn } from "@aditya-sharma-salescode/form-builder";

<Routes>
  <Route path="/form-workspace/*" element={<FormBuilderPlugIn routePrefix="/form-workspace" />} />
</Routes>
```

Then link to `/form-workspace/manage-forms` (or `/suite/manage-forms` if you used `routePrefix="/suite"`). See **`FormBuilderPlugIn`** props for `mode` (`nested` vs `root`).

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

Publish to **GitHub Packages** (after `pnpm --filter @aditya-sharma-salescode/form-builder build` and a semver version bump): from `packages/form-builder`, run `npm publish` with `NODE_AUTH_TOKEN` and `.npmrc` pointing at `https://npm.pkg.github.com` for the `@aditya-sharma-salescode` scope (same pattern as other packages in this org).

### Peer dependencies

| Package | Version |
|---------|---------|
| **react** | **18.x** (recommended `^18.0.0`) |
| **react-dom** | **18.x** |
| **react-router-dom** | **6.x** (recommended `^6.4.0`) |

```bash
npm install react react-dom react-router-dom
```

The app must use **React Router v6** — in-package navigation calls `useNavigate()` and expects matching route definitions.

### Related UI packages

- **`@aditya-sharma-salescode/shared-ui`** — import **`@aditya-sharma-salescode/shared-ui/index.css`** (or **`…/dist/index.css`**), extend Tailwind `content` to include `shared-ui`’s `dist`, and define shadcn theme CSS variables (see that package’s README).
- **`@aditya-sharma-salescode/reports-ui`** — for embedded report UIs, install a compatible version and import its global styles as that package documents.

## Convai (ElevenLabs) — server `POST /api/convai/signed-url`

The **`useConvaiAgent`** hook (used by the voice stack) starts ElevenLabs Conversational AI by **POSTing to the same origin**: **`/api/convai/signed-url`**. The response must be JSON **`{ "signedUrl": "<wss-or-https-url>" }`**.

Your **host** — not the browser — must hold the API key. Set environment variables (names are conventional; adjust to your deployment):

| Variable | Purpose |
|----------|---------|
| `ELEVENLABS_API_KEY` | Sent as header `xi-api-key` to the ElevenLabs API |
| `ELEVENLABS_AGENT_ID` | Conversational AI agent id (`agent_id` query param) |

Server-side, call ElevenLabs’ **get signed URL** for conversations (REST: `GET https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=…` with `xi-api-key`), then return `{ signedUrl: data.signed_url }`. In **development**, point your dev server’s proxy at a small Express/hono handler on port **8787**, or mirror the path your app uses.

Example (Express):

```js
import express from "express";

const app = express();
app.use(express.json());

app.post("/api/convai/signed-url", async (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!apiKey || !agentId) {
    return res.status(500).json({ error: "Missing ELEVENLABS_* env" });
  }
  const url = new URL("https://api.elevenlabs.io/v1/convai/conversation/get-signed-url");
  url.searchParams.set("agent_id", agentId);

  const r = await fetch(url, { headers: { "xi-api-key": apiKey } });
  if (!r.ok) {
    const text = await r.text();
    return res.status(502).json({ error: text || r.statusText });
  }
  const data = await r.json();
  res.json({ signedUrl: data.signed_url });
});

app.listen(8787);
```

---

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

### Public exports

| Area | Exports |
|------|---------|
| Plug-in | `FormBuilderPlugIn`, `FormBuilderStandalone`, types `FormBuilderPlugInProps`, `FormBuilderStandaloneProps` |
| Layout / provider | `FormBuilderLayout`, `FormBuilderProvider`, `useFormBuilderConfig`, config/route types from `./provider` |
| Routes | `buildFormBuilderRoutes`, `resolveLegacyNavigatePath` |
| Main screens | `FormBuilder`, `ManageForms` |
| Reports | `ReportConfigPage`, `ReportPreviewPage`, `ReportsPage`, **`REPORTS_ACCOUNT_ID`**, **`syncReportsAuthLocalStorage`** |
| Voice (context) | `VoiceAgentProvider`, `useVoiceAgentContext`, type `UICallbacks` |
| Voice (Convai) | **`useConvaiAgent`**, types **`ConvaiStatus`**, **`ConvaiState`** |
| Voice (types from agent state machine) | **`AgentStage`**, **`VoiceAgentState`**, **`VoiceAgentActions`** |
| Optional shell | `VoiceAgentPanel`, `VoiceActionFeedProvider` |
| Hooks / state | `useActivityStore` |
| Types | `export type *` from `./types` |

Dependencies pulled in for you: **`@aditya-sharma-salescode/shared-ui`**, **`@aditya-sharma-salescode/reports-ui`**, **`@11labs/client`** (dynamic import inside **`useConvaiAgent`**).

## Why the UI can look wrong

1. **Missing shared-ui CSS** — import `@aditya-sharma-salescode/shared-ui/dist/index.css` in your entry file.
2. **Tailwind not scanning** this package’s `dist` — extend `tailwind.config` `content` accordingly.
3. **Routes not registered** — mismatched paths vs `routePrefix` breaks in-app navigation.
4. **No `VoiceAgentProvider` ancestor** — `FormBuilder` / `ManageForms` / report pages that use voice will throw if the layout is wrong.

## Minimal usage (builder only, no voice shell)

If you mount only `<FormBuilder />`, you must still wrap it with **`VoiceAgentProvider`** (and usually **`FormBuilderProvider`**) so hooks do not throw. For voice UI, prefer **`FormBuilderLayout`** as above.

---

## Verify (monorepo)

From the repo root, build the library and the **Vite** smoke app that mounts **`FormBuilderPlugIn`** at **`/form-workspace/*`**:

```bash
pnpm run verify:form-builder-vite
```

### Verify a npm tarball (e.g. before GitHub Packages publish)

```bash
cd packages/form-builder
pnpm pack --pack-destination ../../tmp
# In a fresh Vite app: npm install ../../tmp/aditya-sharma-salescode-form-builder-*.tgz
# Import shared-ui CSS and extend Tailwind `content` as documented above.
```
