# Tyranny of Dragons Campaign Manager

This repository contains a single [Next.js](https://nextjs.org) application that powers the Tyranny of Dragons campaign dashboard. The app is designed to be deployed on Vercel and uses Supabase for persistent storage.

## Getting Started

1. Create a `.env.local` file with the following values:

```
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_ANON_KEY=<supabase-anon-or-service-role-key>
SUPABASE_SERVICE_ROLE_KEY=<optional-service-role-key>
CAMPAIGN_ACCESS_PASSWORD=<password-used-to-unlock-the-app>
BLOB_READ_WRITE_TOKEN=<vercel-blob-read-write-token>
```

2. Install dependencies and run the development server:

```
npm install
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Deployment

Deploy the project to Vercel as a standard Next.js application. Ensure that the environment variables above are configured in your Vercel project settings.

## Supabase Schema

The application expects the following tables to exist in Supabase:

- `notes` — stores session notes with optional `image_url`.
- `characters` — stores character data including `player_type` and `image_url`.
- `note_characters` — junction table linking characters to sessions.

## Authentication

A simple password gate protects the app. Users must provide the password configured in `CAMPAIGN_ACCESS_PASSWORD` to access any protected routes. A cookie is stored to persist the session for future visits.
