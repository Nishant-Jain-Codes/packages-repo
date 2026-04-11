# `@aditya-sharma-salescode/form-builder`

Form builder UI (drag-and-drop canvas, embedded reports flows). Depends on **shared-ui** and optional **reports-ui** for report screens. Published to **GitHub Packages**.

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

Install in your application:

```bash
npm install react react-dom react-router-dom
```

The app must be wrapped in a **React Router** (`BrowserRouter` or equivalent) because the builder and report routes use router hooks.

### Related UI packages

- **`@aditya-sharma-salescode/shared-ui`** — see that package’s README on GitHub Packages: import **`@aditya-sharma-salescode/shared-ui/dist/index.css`** and configure Tailwind `content` so components render correctly.
- **`@aditya-sharma-salescode/reports-ui`** — if you use embedded report pages, install the same version you use elsewhere and import its **global styles** as that package documents (often `@reports-ui/styles` or the path your app already uses).

## Why the UI can look wrong

1. **Missing shared-ui CSS** — import `@aditya-sharma-salescode/shared-ui/dist/index.css` in your entry file.
2. **Tailwind not scanning** `shared-ui` / `form-builder` `dist` output — extend `tailwind.config` `content` to include those paths.
3. **No router** — mount `<FormBuilder />` under `react-router-dom` providers.
4. **Missing theme variables** — shadcn-style tokens (`--background`, etc.) must exist in your global CSS.

## Usage (sketch)

```tsx
import { FormBuilder, FormBuilderProvider } from "@aditya-sharma-salescode/form-builder";

export function Page() {
  return (
    <FormBuilderProvider value={{ /* FormBuilderConfig */ }}>
      <FormBuilder />
    </FormBuilderProvider>
  );
}
```

See exported types and `FormBuilderProvider` in the package entry for full configuration options.
