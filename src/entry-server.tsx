import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import type { HelmetServerState } from 'react-helmet-async'
import { ThemeProvider } from './contexts/ThemeContext'
import LandingPage from './pages/LandingPage'

export function render(url: string): { appHtml: string; helmet: HelmetServerState | null | undefined } {
  const helmetContext: { helmet?: HelmetServerState } = {}

  const appHtml = renderToString(
    <HelmetProvider context={helmetContext}>
      <ThemeProvider>
        <StaticRouter location={url}>
          <LandingPage />
        </StaticRouter>
      </ThemeProvider>
    </HelmetProvider>
  )

  return { appHtml, helmet: helmetContext.helmet }
}
