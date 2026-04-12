# `@aditya-sharma-salescode/content-management`

Banner, bucket, basket, block, and home-screen management (unified shell + create flows). Uses **MUI**, **Mantine**, **Emotion**, and **shared-ui**. Published to **GitHub Packages**.

## Plug-and-play (fastest)

**Standalone** (includes `BrowserRouter` — good for a dedicated route or demo):

```tsx
import { ContentManagementStandalone } from "@aditya-sharma-salescode/content-management";

export default function ContentPage() {
  return <ContentManagementStandalone routePrefix="/content" />;
}
```

Opens at `/content/banner` (default). Change `routePrefix` to match where you mount the module.

**Inside an existing app** (you already have `BrowserRouter`):

```tsx
import { Routes, Route } from "react-router-dom";
import { ContentManagementPlugIn } from "@aditya-sharma-salescode/content-management";

<Routes>
  <Route
    path="/content/*"
    element={<ContentManagementPlugIn routePrefix="/content" />}
  />
</Routes>
```

This registers every section and create URL under `/content/…` (banner, bucket, basket, block, homeScreenManagement, create-banner, create-bucket, create-basket, create-block).

### Required styling

Import the bundled CSS once (e.g. in `main.tsx`):

```ts
import "@aditya-sharma-salescode/content-management/dist/index.css";
```

Also follow **`@aditya-sharma-salescode/shared-ui`**: import its `dist/index.css`, extend Tailwind `content` to include both packages’ `dist`, and keep shadcn theme variables in your global CSS.

### Config

`ContentManagementProvider` is included inside the plug-ins. For advanced use, pass options through **`ContentManagementPlugIn`** by forking the wrapper or using **`ContentManagementProvider`** + **`contentManagementStore`** yourself.

- **`routePrefix`** — must match the parent `Route` prefix (no trailing slash).
- **`exitPath`** — sidebar “Back to dashboard” target (default `/dashboard`).

### Exports (summary)

- **`ContentManagementPlugIn`**, **`ContentManagementStandalone`**
- **`ContentManagementProvider`**, **`useContentManagementConfig`**
- **`contentManagementStore`** (Redux — already wrapped by plug-ins)
- **`buildContentManagementRoutes`**, **`stripRoutePrefix`**
- Individual pages and providers (see `src/index.ts`)

### Peers

```bash
npm install react react-dom react-router-dom
```

## Install (GitHub Packages)

```ini
@aditya-sharma-salescode:registry=https://npm.pkg.github.com
always-auth=true
```

```bash
npm install @aditya-sharma-salescode/content-management
```

Use a PAT with `read:packages` in CI.

## Why UI can look wrong

1. Missing **shared-ui** or **content-management** CSS / Tailwind content paths.
2. Host app missing **MUI / Mantine** theme providers if you compose screens outside the default shell.
3. **`exitPath`** or **`routePrefix`** out of sync with your router.
