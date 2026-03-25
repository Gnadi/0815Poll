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

Private project.
