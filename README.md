## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install --legacy-peer-deps`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
4. change gemini "@google/genai": "^1.30.0",
5. change                               {log.problemDescription} -> {log.solutionDescription}
{log.problemDescription} &rarr; {log.solutionDescription}

## Deployment

This repository has multiple deployment options so you can pick what fits your workflow.

1) GitHub Actions (automatic) — recommended ✅

   - There's a GitHub Actions workflow at `.github/workflows/deploy-pages.yml` that builds the app and publishes `dist/` to GitHub Pages on every push to `master`.
   - The workflow sets `VITE_BASE=/EGRH/` during build so assets load correctly at `https://<your-username>.github.io/EGRH/`.
   - Nothing else is required — the workflow uses the Pages deploy action and the built site will be published automatically.

2) gh-pages (manual deploy) ⚡

   - A convenience script was added to `package.json` to publish `dist/` to the `gh-pages` branch using the `gh-pages` package.
   - Usage (from repo root):

```bash
npm run build
npm run deploy:gh-pages
```

   - To push from CI or local automation you may need to set the `GH_TOKEN` env variable to a personal access token with repo permissions.

3) docs/ (branch-less host) 📁

   - If you prefer to serve the built site from `master` > `docs/`, run:

```bash
npm run build
npm run build:docs
git add docs && git commit -m "chore: publish build to docs/" && git push
```

   - On GitHub repository → Settings → Pages, set source to `main / docs` (or `master / docs` depending on branch) and the `docs/` folder will be served.

Notes
- The app's Vite `base` is configured to read `VITE_BASE` at build time — that is used by the workflow for the Pages path `/EGRH/`.
- The repo homepage (project page) will be: https://myasin3.github.io/EGRH/

If you'd like, I can also:
- configure the workflow to deploy from a different branch
- set up an automatic preview deployment for PRs
- add an action that increments versions and tags releases

