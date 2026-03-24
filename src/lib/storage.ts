/**
 * Upload an image file to Cloudinary and return its secure URL.
 * Uses an unsigned upload preset — no backend required.
 */
export async function uploadPollImage(
  file: File,
  _pollId: string,
  _optionId: string
): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

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
