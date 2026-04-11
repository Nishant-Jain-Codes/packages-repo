# `@aditya-sharma-salescode/content-management`

Content-management screens (banners, buckets, baskets, blocks, home screen flows). Mixes **shared-ui** with **MUI**, **Mantine**, **Emotion**, and other UI stacks.

## Status

This workspace package is intended for **internal / monorepo development**. It is marked **`private`** in many setups and may not publish until paths and assets are fully self-contained.

## Peer dependencies

Your app should provide:

```bash
npm install react react-dom react-router-dom
```

Also install **`@aditya-sharma-salescode/shared-ui`** and follow that package’s README for **CSS and Tailwind** so shared primitives render correctly alongside MUI/Mantine.

## Why UI can look wrong

1. **shared-ui** requires `dist/index.css` + Tailwind content scanning — see the **shared-ui** README on GitHub Packages.
2. **MUI / Mantine / Emotion** need their own providers and theme setup in the host app (`ThemeProvider`, `MantineProvider`, etc.).
3. This package may reference **app-specific paths or assets**; verify your build includes everything the screens expect.

## Install (GitHub Packages)

```ini
@aditya-sharma-salescode:registry=https://npm.pkg.github.com
always-auth=true
```

Use a PAT with `read:packages` when installing from CI.
