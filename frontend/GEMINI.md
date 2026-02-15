# Project Overview

This is the frontend for `terminal-app`, a **Nuxt 4** application built with **Vue 3**. It utilizes **Tailwind CSS** for styling and **Mapbox GL** for map functionality.

## key Technologies

*   **Framework:** [Nuxt 4](https://nuxt.com/) (Vue 3)
*   **Language:** TypeScript
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) (via `@nuxtjs/tailwindcss`)
*   **Maps:** [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/) (via `nuxt-mapbox`)
*   **Package Manager:** Bun (detected `bun.lock`)

## Building and Running

The project includes a `bun.lock` file, suggesting **Bun** is the preferred package manager.

### Installation

```bash
bun install
```

### Development Server

Start the development server on `http://localhost:3000`:

```bash
bun run dev
```

### Production Build

Build the application for production:

```bash
bun run build
```

Preview the production build locally:

```bash
bun run preview
```

## Configuration & Structure

*   **`nuxt.config.ts`**: The main configuration file for Nuxt.
    *   **Modules**: Configured with `@nuxtjs/tailwindcss` and `nuxt-mapbox`.
    *   **Mapbox**: Requires a valid `accessToken` to be set in the `mapbox` configuration object. currently set to a placeholder.
    *   **Tailwind**: Configured to look for `~/assets/css/tailwind.css` and `tailwind.config`. Note that these files/directories may not yet exist in the project root/app directory.
*   **`app/app.vue`**: The main entry point component for the application.
*   **`tsconfig.json`**: TypeScript configuration extending Nuxt's generated config.

## Development Conventions

*   **Directory Structure**: Adhere to standard [Nuxt directory structure](https://nuxt.com/docs/guide/directory-structure/nuxt).
    *   Place pages in `pages/`.
    *   Place reusable components in `components/`.
    *   Place static assets in `public/`.
    *   Place compiled assets (css, images) in `assets/`.
*   **Styling**: Use Tailwind utility classes for styling components.
*   **Maps**: Ensure the Mapbox access token is configured before working with map components.

## Missing/Pending Setup

*   **Tailwind Config**: `tailwind.config` is referenced in `nuxt.config.ts` but may not exist in the root.
*   **Assets**: `assets/css/tailwind.css` is referenced but the `assets` directory is not present in `app/` or root. You may need to create these if customization is required.
