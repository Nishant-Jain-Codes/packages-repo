# `@aditya-sharma-salescode/shared-ui`

Shadcn-style React UI primitives (Radix + Tailwind). Published to **GitHub Packages**.

## Install

Configure `.npmrc` in the consuming app:

```ini
@aditya-sharma-salescode:registry=https://npm.pkg.github.com
always-auth=true
```

```bash
npm install @aditya-sharma-salescode/shared-ui
```

Install **peer dependencies** in your app (they are not bundled):

```bash
npm install react react-dom react-hook-form
```

## Styles (required for correct UI)

The build emits CSS next to the JS bundle. **Import the stylesheet once** in your app entry (e.g. `main.tsx`):

```ts
import "@aditya-sharma-salescode/shared-ui/dist/index.css";
```

The published `index.css` contains styles bundled from this package (for example component-specific CSS). **Most visible styling still comes from Tailwind utilities** resolved in your app, so the Tailwind steps below are required—not optional.

### Tailwind in the host app

These components expect **Tailwind** utility classes and the usual **shadcn theme** tokens (`background`, `card`, `border`, etc.) in your app:

1. Use Tailwind v3+ in the consuming project.
2. Point `content` at this package so classes are generated, for example:

```js
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@aditya-sharma-salescode/shared-ui/dist/**/*.{js,mjs,cjs}",
  ],
  // ... theme, plugins — include tailwindcss-animate if you use motion utilities
};
```

3. Ensure your global CSS defines CSS variables / `@layer base` styles for shadcn (same pattern as a standard shadcn app).

If the UI looks “flat”, wrong colors, or missing spacing, the usual causes are: **missing `index.css` import**, **Tailwind `content` not scanning the package**, or **theme CSS variables not defined**.

## Usage

```tsx
import { Button, cn } from "@aditya-sharma-salescode/shared-ui";
```

Components that use forms re-export `react-hook-form` helpers from `./components/ui/form` — keep `react-hook-form` installed as a peer dependency.

## Registry

Private GitHub Packages: authenticate with a PAT (`read:packages` minimum) when installing in CI or locally.
