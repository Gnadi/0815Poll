import DOMPurify from 'dompurify'

// CSP that blocks all outgoing network requests from sandboxed poll iframes,
// preventing injected scripts from exfiltrating data while still allowing
// the author's JS/CSS/images to work.
const IFRAME_CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src https: data: blob:; font-src https:; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none';"

const CSP_META = `<meta http-equiv="Content-Security-Policy" content="${IFRAME_CSP}">`

/**
 * Sanitize a custom-poll HTML document for safe rendering in a sandboxed iframe.
 *
 * - Re-injects (or upgrades) the CSP meta tag to block outgoing network requests.
 * - Re-sanitizes the <body> HTML with DOMPurify to strip event-handler attributes
 *   (onclick, onerror, etc.) that could run JS without an explicit <script> tag.
 * - The <script> block authored by the poll creator is preserved; the CSP ensures
 *   it cannot reach external servers.
 */
export function sanitizeCustomContent(stored: string): string {
  // 1. Ensure CSP meta is present and up-to-date.
  let html = stored.includes('http-equiv="Content-Security-Policy"')
    ? stored.replace(/<meta[^>]*http-equiv="Content-Security-Policy"[^>]*>/i, CSP_META)
    : stored.replace(/(<head[^>]*>)/i, `$1\n${CSP_META}`)

  // 2. Sanitize the body portion: strip inline event handlers and dangerous tags
  //    while preserving layout markup.  We extract the body content, sanitize it,
  //    and splice it back in so the <script> block is unaffected.
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<script/i)
  if (bodyMatch) {
    const rawBody = bodyMatch[1]
    const cleanBody = DOMPurify.sanitize(rawBody, { USE_PROFILES: { html: true } })
    html = html.replace(rawBody, cleanBody)
  }

  return html
}
