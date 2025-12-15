# Deployment

This app is built with **Vite**. Deployment is just:
1) build (`npm run build`)
2) serve the generated `dist/` folder as a static site

## Option A: Vercel (recommended)

1. Create a Vercel project connected to this GitHub repo.
2. Framework preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Add any required env vars in Vercel Project Settings (optional).

## Option B: Netlify

1. Create a Netlify site connected to this GitHub repo.
2. Build Command: `npm run build`
3. Publish directory: `dist`
4. Add env vars in Netlify Site Settings (optional).

## Option C: GitHub Pages (GitHub Actions)

This repo includes a GitHub Actions workflow that builds and publishes `dist/` to GitHub Pages.

### 1) Enable Pages for the repository
In GitHub:
- Repo **Settings** → **Pages**
- **Build and deployment** → **Source**: select **GitHub Actions**

### 2) Run the workflow
Push to the `main` branch (or trigger the workflow manually in the Actions tab).

### 3) Confirm the Pages URL
After the workflow completes, GitHub will show the Pages URL in:
- Repo **Settings** → **Pages**

### Notes about GitHub Pages base path
GitHub Pages hosts your site at a sub-path like:
`https://<user>.github.io/<repo>/`

The workflow sets Vite’s `base` automatically for the build, so routes and assets resolve correctly without you manually editing `vite.config.ts`.


