import type { IncomingMessage, ServerResponse } from 'node:http'
import { createHash } from 'crypto'

// Vercel hands the handler a Node request/response with a few helpers added.
// The shapes below mirror the ones @vercel/node exports; that package is not a
// dependency here because it bundles its own vulnerable undici and
// path-to-regexp, and nothing but these two types was ever used from it — the
// function runtime itself comes from the platform, not from node_modules.
type VercelRequest = IncomingMessage & {
  query: Partial<Record<string, string | string[]>>
  cookies: Partial<Record<string, string>>
  body: unknown
}

type VercelResponse = ServerResponse<IncomingMessage> & {
  send: (body: unknown) => VercelResponse
  json: (body: unknown) => VercelResponse
  status: (statusCode: number) => VercelResponse
  redirect: (statusOrUrl: string | number, url?: string) => VercelResponse
}

/**
 * Verify a Firebase ID token by calling the Firebase Auth REST API.
 * Returns true only if the token belongs to a valid, non-expired Firebase user
 * in this project. No firebase-admin SDK needed — the Web API key is public.
 */
async function verifyFirebaseIdToken(idToken: string): Promise<boolean> {
  const apiKey = process.env.VITE_FIREBASE_API_KEY
  if (!apiKey) return false
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    )
    return res.ok
  } catch {
    return false
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Require a valid Firebase ID token — prevents unauthenticated upload abuse.
  const authHeader = req.headers.authorization ?? ''
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!idToken || !(await verifyFirebaseIdToken(idToken))) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const secret = process.env.CLOUDINARY_API_SECRET
  const apiKey = process.env.CLOUDINARY_API_KEY

  if (!secret || !apiKey) {
    res.status(500).json({ error: 'Cloudinary credentials not configured' })
    return
  }

  const timestamp = Math.round(Date.now() / 1000)
  const folder = 'polls'

  const signature = createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${secret}`)
    .digest('hex')

  res.json({ timestamp, signature, folder, apiKey })
}
