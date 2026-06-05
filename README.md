# Resume Tracker

A personal job application tracking dashboard. Log every submission, track pipeline status, auto-import from Gmail, and get funnel stats.

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwind-css&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?style=flat&logo=shadcn&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)

</div>

---

## Features

| | | |
|---|---|---|
| 📋 **Dashboard** | ✏️ **CRUD** | 🔄 **Gmail Sync** |
| Filterable table with search and status filter | Add, edit, delete via modal forms | Auto-import emails → auto-create/update |
| 📊 **Stats** | 🎨 **Themes** | 🔐 **Auth** |
| Funnel breakdown of your pipeline | Multiple visual themes to choose from | Google OAuth or email magic link |

---

## Tech Stack

| | Layer | |
|---|---|---|
| ⚡ | **Framework** | Next.js 16 (App Router) |
| 🔑 | **Auth** | Supabase Auth (SSR) |
| 🗄️ | **Database** | Supabase (Postgres) |
| 🎨 | **Styling** | Tailwind CSS 4 + shadcn/ui |
| 🎯 | **Icons** | lucide-react |
| 📅 | **Date** | date-fns |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- (Optional) Google Cloud project with Gmail API enabled

### 1. Clone & install

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase project URL and anon key (find these in your Supabase dashboard → Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Database

Run the migration against your Supabase project:

```bash
npx supabase migration up
```

Or paste the SQL files from `supabase/migrations/` into the Supabase **SQL Editor**.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

---

## Gmail Sync

Auto-import job applications from your Gmail inbox. Application confirmations create new submissions, rejection emails set status to `rejected`, and interview invites set status to `interviewing`.

### Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **Credentials**
2. Create a project (or select one), enable **Gmail API**
3. Create an **OAuth 2.0 Web Client** with redirect URI `http://localhost:3000/api/gmail/callback`
4. Copy the **Client ID** and **Client Secret**
5. Add them to `.env.local`:

```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gmail/callback
CRON_SECRET=<any-random-string>
```

Also add your Gmail address as a **Test User** in the OAuth consent screen settings.

### Usage

1. Open the dashboard and click **Connect Gmail**
2. Click **Sync now** to scan recent job-related emails
3. Matched emails are automatically classified and applied to your submissions

### Automated sync

For periodic background sync, set up a cron job pointing to your deployed URL:

```
POST https://your-site.vercel.app/api/gmail/sync
Authorization: Bearer <CRON_SECRET>
```

On Vercel: add a **Cron Job** in your project dashboard → **Cron Jobs** tab with schedule `0 */6 * * *`.

---

## Project Structure

<details>
<summary>Click to expand</summary>

```
src/
├── app/
│   ├── (app)/dashboard/     # Dashboard page + client component
│   ├── (app)/stats/         # Stats funnel page
│   ├── api/gmail/           # Gmail sync API routes
│   ├── auth/callback/       # Auth callback handler
│   ├── login/               # Login page
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles + CSS variables
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   ├── gmail-sync.tsx       # Sync UI component
│   ├── nav.tsx              # Top navigation
│   ├── submission-form.tsx  # Add/edit submission form
│   └── theme-selector.tsx   # Theme switcher
├── lib/
│   ├── supabase/            # Server, client, middleware clients
│   ├── constants.ts         # Status option constants
│   ├── gmail.ts             # Gmail OAuth + API helpers
│   ├── gmail-parser.ts      # Email classification engine
│   ├── themes.ts            # Theme definitions
│   └── utils.ts             # Utility functions
└── middleware.ts             # Auth redirect middleware

supabase/
└── migrations/              # Database migrations

.env.example                 # Environment variable template
```

</details>

---

## License

MIT
