import { auth } from './firebase'

/**
 * Upload an image file to Cloudinary using a server-signed request.
 * The API secret never leaves the server — /api/cloudinary-sign generates
 * a short-lived signature that authorises this specific upload. The caller
 * must be authenticated; the signed folder is namespaced by the caller's uid.
 */
export async function uploadPollImage(
  file: File,
  _pollId: string,
  _optionId: string
): Promise<string> {
  const user = auth.currentUser
  if (!user) throw new Error('Must be signed in to upload images')
  const idToken = await user.getIdToken()

  const signRes = await fetch('/api/cloudinary-sign', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
  })
  if (!signRes.ok) throw new Error('Failed to get upload signature')
  const { timestamp, signature, folder, apiKey, signatureAlgorithm } = await signRes.json()

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

  const formData = new FormData()
  formData.append('file', file)
  formData.append('timestamp', String(timestamp))
  formData.append('signature', signature)
  formData.append('api_key', apiKey)
  formData.append('folder', folder)
  if (signatureAlgorithm) {
    formData.append('signature_algorithm', signatureAlgorithm)
  }

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
