# @aditya-sharma-salescode packages monorepo

This repo is a **workspaces monorepo** that publishes packages to **GitHub Packages (private)** for now.

## Packages

- `@aditya-sharma-salescode/shared-ui`
- `@aditya-sharma-salescode/form-builder`
- `@aditya-sharma-salescode/reports-setup`
- `@aditya-sharma-salescode/content-management`

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

3) Install:

```bash
npm i @aditya-sharma-salescode/shared-ui
```

## Develop in this repo

```bash
corepack enable
pnpm install
pnpm run build
```

## Publish (GitHub Actions)

Publishing is done on tags `v*` (example: `v1.0.0`). The workflow publishes all workspaces that are not marked `"private": true`.
