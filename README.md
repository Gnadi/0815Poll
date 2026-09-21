# 0815Poll

A full-featured polling web app built with React, TypeScript, and Firebase. Create and share polls of various types, collect votes, and view results in real time.

## Features

- **Multiple poll types** — standard choice, image, location, ranking, priority, and scheduling polls
- **Real-time results** — live vote counts and result bars
- **QR code sharing** — generate a QR code for any poll
- **Authentication** — Firebase-based sign-in with contact management
- **Notifications** — configurable notification methods per poll
- **Explore feed** — browse public polls from other users
- **PWA support** — installable as a progressive web app
- **Dark mode** — theme toggle via context

## Tech Stack

| Layer | Library |
|---|---|
| UI | React 19, Tailwind CSS, Lucide React |
| Routing | React Router v7 |
| Backend / Auth | Firebase v11 |
| Rich text | Tiptap |
| Maps | Leaflet + React Leaflet |
| Email | EmailJS |
| Build | Vite 6, TypeScript 5 |
| Deploy | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore and Authentication enabled

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file at the project root and add your Firebase config:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

### Lint

```bash
npm run lint
```

## Firestore rules & indexes

`firestore.rules` and `firestore.indexes.json` are deployed by GitHub Actions
(`.github/workflows/firebase-firestore.yml`) as soon as a change to either one
lands on `main` — i.e. on merge. Pull requests that touch them run the
validation job only, so broken rules are caught before the merge.

Two repository settings are required (Settings → Secrets and variables →
Actions):

| Name | Type | Value |
| --- | --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | Secret | The complete JSON key of a Google Cloud service account for the Firebase project |
| `FIREBASE_PROJECT_ID` | Variable | The Firebase project id to deploy to |

The service account needs the **Firebase Rules Admin**
(`roles/firebaserules.admin`) and **Cloud Datastore Index Admin**
(`roles/datastore.indexAdmin`) roles; **Firebase Admin** covers both. Create
the key in the Google Cloud console under IAM & Admin → Service Accounts →
Keys → Add key → JSON, and paste the file's entire contents into the secret.

The deploy runs without `--force`: indexes are created and updated, but an
index that exists in Firebase and is missing from `firestore.indexes.json` is
only reported in the job log, never deleted. Removing an index stays a manual
step in the Firebase console.

`firestore.indexes.json` was derived from the queries in `src/lib/firestore.ts`.
If indexes were created by hand in the console earlier, capture them once with
`firebase firestore:indexes > firestore.indexes.json` so the file stays the
source of truth.

## Dependency audit

`.github/workflows/npm-audit.yml` runs `npm audit` on every pull request, on
every push to `main`, and once a week on Mondays — the weekly run is what
catches advisories published after the last merge. It fails as soon as an
advisory of severity **high** or **critical** is open for a dependency in
`package-lock.json`. The run's job summary lists the packages
behind it: severity, whether the package ships to users or is only installed
for development, and whether a fix has been published.

To clear a failing run:

```bash
npm audit               # the full list, lower severities included
npm audit fix           # everything a compatible release fixes
npm audit fix --force   # the rest, with breaking upgrades — test the app afterwards
```

The threshold is `AUDIT_LEVEL` in the workflow; lower it to `moderate` or
`low` once everything above that is cleared. A one-off run at a different
level can be started under Actions → npm audit → Run workflow.

## Project Structure

```
src/
  pages/          # Route-level page components
  components/     # Shared UI components
  contexts/       # React contexts (auth, theme)
  lib/            # Firebase setup and helpers
  types/          # TypeScript type definitions
api/              # Vercel serverless functions
public/           # Static assets
```

## License

MIT
