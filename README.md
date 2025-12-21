# Website Frontend

Hosted at [mark.takatsuka.dev](https://mark.takatsuka.dev) (via GitHub Pages)

## Deployment

### Automatic Deployment
This repository is configured with GitHub Actions. Pushing to the `main` branch will automatically build and deploy the static site to the `gh-pages` branch.

### Manual Deployment
To manually deploy to GitHub Pages:

```sh
npm run deploy
```

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Build for Production (SSG)

This project uses `vite-ssg` to generate static HTML pages.

```sh
npm run build
```

The output will be in the `dist/` directory.

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

### Format

```sh
npm run format
```

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.
