import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createHash } from 'crypto'

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin
  if (origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

async function verifyFirebaseIdToken(idToken: string): Promise<string | null> {
  const apiKey = process.env.FIREBASE_API_KEY ?? process.env.VITE_FIREBASE_API_KEY
  if (!apiKey) return null
  try {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    )
    if (!r.ok) return null
    const data = (await r.json()) as { users?: Array<{ localId?: string }> }
    return data.users?.[0]?.localId ?? null
  } catch {
    return null
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res)
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const auth = req.headers.authorization ?? ''
  const match = /^Bearer\s+(.+)$/i.exec(auth)
  if (!match) {
    res.status(401).json({ error: 'Missing bearer token' })
    return
  }
  const uid = await verifyFirebaseIdToken(match[1])
  if (!uid) {
    res.status(401).json({ error: 'Invalid token' })
    return
  }

  const secret = process.env.CLOUDINARY_API_SECRET
  const apiKey = process.env.CLOUDINARY_API_KEY
  if (!secret || !apiKey) {
    res.status(500).json({ error: 'Cloudinary credentials not configured' })
    return
  }

  const timestamp = Math.round(Date.now() / 1000)
  const folder = `polls/${uid}`
  const signatureAlgorithm = 'sha256'

  const signature = createHash('sha256')
    .update(`folder=${folder}&timestamp=${timestamp}${secret}`)
    .digest('hex')

  res.json({ timestamp, signature, folder, apiKey, signatureAlgorithm })
}
