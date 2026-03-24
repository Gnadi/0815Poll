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
  const signRes = await fetch('/api/cloudinary-sign')
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
