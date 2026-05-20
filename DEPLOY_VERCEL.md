# Deploying to Vercel

This project is a Vite + React + TypeScript single-page app. The repo contains a `vercel.json` that instructs Vercel to use the static build output in `dist` and route all requests to `index.html` (SPA fallback).

Quick steps

1. Commit and push the added files:

```bash
git add vercel.json DEPLOY_VERCEL.md
git commit -m "chore: add Vercel config and deploy instructions"
git push origin <your-branch>
```

2. Create a new project on Vercel:
- Sign in to https://vercel.com and click "New Project" → "Import Git Repository".
- Select your repository and branch.

3. Configure Build & Output settings (if Vercel doesn't auto-detect):
- Framework Preset: Other
- Build Command: `npm run build`
- Output Directory: `dist`

4. Add required Environment Variables (Project Settings → Environment Variables):
- `VITE_SUPABASE_URL` — your Supabase URL
- `VITE_SUPABASE_ANON_KEY` — your Supabase anon/public key

If you use other Vite env variables (prefix `VITE_`), add them here as well.

5. Deploy
- Click "Deploy". Vercel will run the build and publish the `dist` output.

Optional: Deploy using Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

Notes

- Ensure secrets use the `VITE_` prefix so the values are available at build/runtime via `import.meta.env`.
- If you need serverless functions or API routes, you'll need to add a separate backend or convert parts to Vercel functions.
- If your build fails on Vercel because of environment differences, check the Build Logs and ensure `typescript` and `vite` are installed (they are listed in `devDependencies`).
