import { describe, it, expect, beforeAll } from 'vitest'
import { buildWhatsAppShareLink, buildWhatsAppContactLink, buildSmsLink } from './share'

beforeAll(() => {
  Object.defineProperty(window, 'location', {
    value: { origin: 'https://flexpoll.app' },
    writable: true,
  })
})

describe('buildWhatsAppShareLink', () => {
  it('encodes question and embeds poll URL', () => {
    const url = buildWhatsAppShareLink('Pizza or sushi?', 'abc123')
    expect(url.startsWith('https://wa.me/?text=')).toBe(true)
    expect(decodeURIComponent(url)).toContain('Pizza or sushi?')
    expect(decodeURIComponent(url)).toContain('https://flexpoll.app/poll/abc123')
  })

  it('escapes characters that break URLs', () => {
    const url = buildWhatsAppShareLink('A & B?', 'id1')
    expect(url).toContain('%26')
    expect(url).toContain('%3F')
  })
})

describe('buildWhatsAppContactLink', () => {
  it('strips phone separators and builds wa.me URL', () => {
    const url = buildWhatsAppContactLink('+49 176 1234-5678', 'Q', 'pid')
    expect(url).toContain('https://wa.me/4917612345678?text=')
  })
})

describe('buildSmsLink', () => {
  it('joins multiple recipients with commas and prefixes +', () => {
    const url = buildSmsLink(['4917612345678', '4915198765432'], 'Q', 'pid')
    expect(url.startsWith('sms:+4917612345678,+4915198765432?body=')).toBe(true)
  })

  it('includes encoded body with poll link', () => {
    const url = buildSmsLink(['4917612345678'], 'Q', 'pid')
    expect(decodeURIComponent(url)).toContain('https://flexpoll.app/poll/pid')
  })
})
