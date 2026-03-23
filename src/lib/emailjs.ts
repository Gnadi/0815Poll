/**
 * EmailJS notification service.
 *
 * Setup (one-time):
 * 1. Create a free account at https://www.emailjs.com (200 emails/month free)
 * 2. Add an email service (Gmail, Outlook, etc.)
 * 3. Create a template with these variables:
 *    {{to_name}}, {{to_email}}, {{poll_question}}, {{poll_link}},
 *    {{creator_name}}, {{expires_at}}
 * 4. Add to .env.local:
 *    VITE_EMAILJS_SERVICE_ID=service_xxx
 *    VITE_EMAILJS_TEMPLATE_ID=template_xxx
 *    VITE_EMAILJS_PUBLIC_KEY=xxx
 */

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined

export function isEmailJsConfigured(): boolean {
  return !!(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY)
}

export interface PollInviteParams {
  toName: string
  toEmail: string
  pollQuestion: string
  pollLink: string
  creatorName: string
  expiresAt: string
}

/**
 * Send a single poll invitation email via EmailJS.
 * Requires VITE_EMAILJS_* env vars to be set.
 */
export async function sendPollInvite(params: PollInviteParams): Promise<void> {
  if (!isEmailJsConfigured()) {
    console.warn('[EmailJS] Not configured – skipping email invite')
    return
  }

  // Lazily import emailjs-com to avoid bundling it when not configured
  const emailjs = await import('@emailjs/browser')

  await emailjs.send(
    SERVICE_ID!,
    TEMPLATE_ID!,
    {
      to_name: params.toName,
      to_email: params.toEmail,
      poll_question: params.pollQuestion,
      poll_link: params.pollLink,
      creator_name: params.creatorName,
      expires_at: params.expiresAt,
    },
    PUBLIC_KEY!
  )
}

/**
 * Send poll invitations to multiple contacts.
 * Errors per contact are collected and returned — a single failure does not
 * abort the remaining sends.
 */
export async function sendPollInvites(
  contacts: Array<{ name: string; email: string }>,
  pollQuestion: string,
  pollId: string,
  creatorName: string,
  expiresAt: Date
): Promise<{ sent: number; failed: number }> {
  const pollLink = `${window.location.origin}/poll/${pollId}`
  const expiresAtStr = expiresAt.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  let sent = 0
  let failed = 0

  for (const contact of contacts) {
    try {
      await sendPollInvite({
        toName: contact.name,
        toEmail: contact.email,
        pollQuestion,
        pollLink,
        creatorName,
        expiresAt: expiresAtStr,
      })
      sent++
    } catch (err) {
      console.error(`[EmailJS] Failed to send to ${contact.email}:`, err)
      failed++
    }
  }

  return { sent, failed }
}
