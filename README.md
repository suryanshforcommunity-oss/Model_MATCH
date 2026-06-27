This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

Create a local `.env.local` file for development and never commit it to source control. Use `.env.example` as a template.

Required variables:

- `OPENAI_API_KEY` — OpenAI API key for the recommendation API.
- `NEXT_PUBLIC_FIREBASE_API_KEY` — Firebase web API key.
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` — Firebase authentication domain.
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` — Firebase project ID.
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` — Firebase storage bucket.
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` — Firebase messaging sender ID.
- `NEXT_PUBLIC_FIREBASE_APP_ID` — Firebase app ID.
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` — Firebase measurement ID.

## Deploy on Vercel

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Recommended quick publish (Vercel)

1. Create a Vercel account and connect your GitHub repository.
2. In the Vercel dashboard, add the Environment Variables from `.env.example` (do NOT commit `.env.local`).
3. Deploy — Vercel will build and publish your site automatically on pushes to the connected branch.

### CI deploy via GitHub Actions

This repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that will trigger on pushes to `main` and call Vercel's deployment API. To use it, set these GitHub repository secrets:

- `VERCEL_TOKEN` — a personal token from Vercel.
- `VERCEL_ORG_ID` — your Vercel organization ID.
- `VERCEL_PROJECT_ID` — your Vercel project ID.
- `OPENAI_API_KEY` — (recommended) your OpenAI API key.

Once the secrets are set, push to `main` and the workflow will deploy to production.

### Manual deploy (vercel CLI)

Install the Vercel CLI and deploy from your machine:

```bash
npm i -g vercel
vercel login
vercel --prod
```

Follow prompts to select the project and configure environment variables.
