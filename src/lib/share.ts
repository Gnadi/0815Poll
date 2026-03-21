/**
 * Sharing utilities — zero cost, no API required.
 */

/**
 * WhatsApp share link for a poll (no specific recipient).
 * Opens WhatsApp contact chooser on mobile; works with WhatsApp Web on desktop.
 */
export function buildWhatsAppShareLink(pollQuestion: string, pollId: string): string {
  const link = `${window.location.origin}/poll/${pollId}`
  const text = encodeURIComponent(
    `You've been invited to vote!\n\n"${pollQuestion}"\n\n${link}`
  )
  return `https://wa.me/?text=${text}`
}

/**
 * WhatsApp direct link to a specific contact (requires phone with country code).
 * e.g. phone = "4917612345678"
 */
export function buildWhatsAppContactLink(
  phone: string,
  pollQuestion: string,
  pollId: string
): string {
  const link = `${window.location.origin}/poll/${pollId}`
  const cleaned = phone.replace(/[\s+\-()]/g, '')
  const text = encodeURIComponent(
    `You've been invited to vote!\n\n"${pollQuestion}"\n\n${link}`
  )
  return `https://wa.me/${cleaned}?text=${text}`
}

/** Copy text to clipboard, returns true on success. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
