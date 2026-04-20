import { getAuth } from 'firebase/auth'

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

/**
 * Upload an image file to Cloudinary using a server-signed request.
 * The API secret never leaves the server — /api/cloudinary-sign generates
 * a short-lived signature that authorises this specific upload.
 */
export async function uploadPollImage(
  file: File,
  _pollId: string,
  _optionId: string
): Promise<string> {
  // Validate file type and size before uploading.
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(`Unsupported file type "${file.type}". Allowed: JPEG, PNG, WebP, GIF.`)
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`)
  }

  // Attach the Firebase ID token so the server can verify the caller is authenticated.
  const currentUser = getAuth().currentUser
  const idToken = currentUser ? await currentUser.getIdToken() : ''

  const signRes = await fetch('/api/cloudinary-sign', {
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
  })
  if (!signRes.ok) throw new Error('Failed to get upload signature')
  const { timestamp, signature, folder, apiKey } = await signRes.json()

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

  const formData = new FormData()
  formData.append('file', file)
  formData.append('timestamp', String(timestamp))
  formData.append('signature', signature)
  formData.append('api_key', apiKey)
  formData.append('folder', folder)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Cloudinary upload failed (${res.status})`)
  }

  const data = await res.json()
  return data.secure_url as string
}
