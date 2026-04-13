# @aditya-sharma-salescode packages monorepo

This repo is a **workspaces monorepo** that publishes packages to **GitHub Packages (private)** for now.

## Packages

- `@aditya-sharma-salescode/shared-ui`
- `@aditya-sharma-salescode/form-builder` — use **`FormBuilderStandalone`** or **`FormBuilderPlugIn`** for all routes in one import (see package README).
- `@aditya-sharma-salescode/reports-setup`
- `@aditya-sharma-salescode/content-management` — use **`ContentManagementStandalone`** or **`ContentManagementPlugIn`** (see package README).

## Install (from another repo)

1) Create or update your consuming repo's `.npmrc`:

```ini
@aditya-sharma-salescode:registry=https://npm.pkg.github.com
always-auth=true
``` 

2) Authenticate (local dev):

```bash
npm login --registry=https://npm.pkg.github.com
```

Use your GitHub username and a GitHub Personal Access Token that has at least:
- `read:packages`
- (and if you publish from that machine) `write:packages`

3) Install a single package (you do **not** need to install all packages):

```bash
npm i @aditya-sharma-salescode/shared-ui
```

### Installing just one package

You can install any package independently:

```bash
# npm
npm i @aditya-sharma-salescode/form-builder

# pnpm
pnpm add @aditya-sharma-salescode/form-builder

# yarn
yarn add @aditya-sharma-salescode/form-builder
```

### Peer dependencies (important)

Most packages expect your app to provide `react` / `react-dom` (and some expect `react-router-dom`).
If you see a peer dependency warning, install the missing peer dependency in your consuming app.

### Basic usage examples

```ts
// UI components/utilities
import { cn } from "@aditya-sharma-salescode/shared-ui";
```

```ts
// Form builder package (exports depend on package version)
import * as FormBuilder from "@aditya-sharma-salescode/form-builder";
```

## Develop in this repo

```bash
corepack enable
pnpm install
pnpm run build
```

## Publish (GitHub Actions)

Publishing is done on tags `v*` (example: `v1.0.0`). The workflow publishes all workspaces that are not marked `"private": true`.
