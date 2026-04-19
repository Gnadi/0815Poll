import { describe, it, expect } from 'vitest'
import { nanoid } from './nanoid'

const CHARSET = /^[A-Za-z0-9]+$/

describe('nanoid', () => {
  it('returns a 10-character string by default', () => {
    const id = nanoid()
    expect(id).toHaveLength(10)
  })

  it('honours a custom length', () => {
    expect(nanoid(1)).toHaveLength(1)
    expect(nanoid(24)).toHaveLength(24)
  })

  it('uses only alphanumeric characters', () => {
    for (let i = 0; i < 50; i++) {
      expect(nanoid(20)).toMatch(CHARSET)
    }
  })

  it('produces different IDs across calls', () => {
    const values = new Set<string>()
    for (let i = 0; i < 100; i++) values.add(nanoid(12))
    expect(values.size).toBeGreaterThan(90)
  })
})
