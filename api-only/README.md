This folder contains an "API-only" scaffold for the Vibing DnD project.

How to deploy:
1. In Vercel, create a new Project and import this repository.
2. When configuring the Project, set the Root Directory to `api-only`.
3. Ensure the following Environment Variables are set in the Vercel Project: `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
4. Deploy — functions will be available under `/api/*` at the project URL.

Quick test (after deploy):
```bash
curl -v https://<your-api-only-project>.vercel.app/api/_diag
curl -v https://<your-api-only-project>.vercel.app/api/notes
```

Use this API URL in your React client as a temporary backend until monorepo routing is fixed.
