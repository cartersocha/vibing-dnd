# Tyranny of Dragons Campaign Manager

This repository now ships as a single [Next.js](https://nextjs.org/) application that unifies the previous React client and Express API into one deployable project for Vercel.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file with the required environment variables:

   ```bash
   ACCESS_PASSWORD=your-shared-password
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=service-role-or-anon-key
   # Optional – only required when using image uploads via Vercel Blob storage
   BLOB_READ_WRITE_TOKEN=vercel-blob-token
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000).

## Architecture

- **App Router** – Uses the Next.js `app/` directory with layouts, route groups, and server components.
- **Server Actions** – All mutating operations (creating, updating, linking, deleting) are implemented as server actions in `app/actions/`.
- **Route Handlers** – JSON APIs are provided under `app/api/` for external integrations.
- **Supabase** – Database access is handled server-side via the Supabase client located in `lib/`.
- **Authentication** – A lightweight password gate uses server actions plus middleware-managed cookies to protect campaign data.

## Deployment

The project is ready for Vercel: build with `npm run build` and deploy. Ensure that the environment variables listed above are configured in your Vercel project settings.
