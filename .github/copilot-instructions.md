# Copilot Instructions for Company Researcher

## Project Overview
- **Company Researcher** is a Next.js (App Router) app that aggregates company data from multiple sources using Exa.ai and other APIs.
- The frontend is built with Next.js, TailwindCSS, and TypeScript. Data is fetched via API routes in the `app/api/` directory.
- Each data source (LinkedIn, Crunchbase, PitchBook, Tracxn, Twitter, Reddit, YouTube, TikTok, Wikipedia, GitHub, etc.) has a dedicated API route and display component.

## Architecture & Data Flow
- **API routes** in `app/api/` fetch and aggregate data from external services (mainly Exa.ai, plus optional YouTube/GitHub APIs).
- **Components** in `components/` are organized by data source (e.g., `linkedin/LinkedinDisplay.tsx`, `financial/FinancialReportDisplay.tsx`).
- The main page (`app/page.tsx`) orchestrates data fetching and renders the appropriate display components.
- Data flows: User input (company URL) → API routes → external APIs → display components.

## Developer Workflows
- **Install dependencies:** `npm install` or `yarn install`
- **Run dev server:** `npm run dev` or `yarn dev` (Next.js, port 3000)
- **Environment setup:** Copy `.env.example` to `.env.local` and fill in required API keys (see README for details).
- **No custom build/test commands** beyond standard Next.js workflows.

## Key Conventions & Patterns
- **API routes:** Each file in `app/api/` is a standalone endpoint for a specific data source. Use clear, descriptive filenames (e.g., `fetchcrunchbase/route.ts`).
- **Component structure:** Each data source has a dedicated display component in `components/[source]/`. Follow the naming pattern `[Source]Display.tsx`.
- **Styling:** Use TailwindCSS utility classes. Global styles in `app/globals.css`.
- **TypeScript:** Strict typing is encouraged for API responses and component props.
- **Optional features:** YouTube and GitHub integrations are enabled only if API keys are present; code can be commented out to disable.

## Integration Points
- **Exa.ai**: Main search/data provider. All API routes use Exa's API for web and company data.
- **Anthropic API**: Used for AI-powered features (details in code).
- **Other APIs:** YouTube, GitHub, etc. are optional and only used if keys are present.

## Examples
- To add a new data source: Create a new API route in `app/api/`, then add a display component in `components/[source]/`.
- To disable a feature: Comment out the relevant API route and component import.

## References
- See `README.md` for setup, API key requirements, and data source details.
- Key directories: `app/api/`, `components/`, `lib/utils.ts`, `app/page.tsx`, `app/layout.tsx`.

---
For questions or unclear patterns, review the README or ask for clarification. Please suggest improvements if you find missing or outdated instructions.
