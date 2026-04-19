import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary'

function Boom({ msg = 'boom' }: { msg?: string }): null {
  throw new Error(msg)
}

describe('ErrorBoundary', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
  })

  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <p>hello</p>
      </ErrorBoundary>
    )
    expect(screen.getByText('hello')).toBeDefined()
  })

  it('renders fallback UI and surfaces the error message', () => {
    render(
      <ErrorBoundary>
        <Boom msg="kaboom" />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeDefined()
    expect(screen.getByText('kaboom')).toBeDefined()
    expect(screen.getByRole('button', { name: /reload app/i })).toBeDefined()
  })
})
