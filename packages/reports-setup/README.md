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

## Exports

The package entry re-exports report config pages, preview, portal, providers, and voice helpers — import from `@aditya-sharma-salescode/reports-setup` and check TypeScript types for the full surface.
