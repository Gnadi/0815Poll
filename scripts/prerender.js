import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const distDir = resolve(import.meta.dirname, '../dist')
const ssrDir = resolve(import.meta.dirname, '../dist-ssr')

const { render } = await import(resolve(ssrDir, 'entry-server.js'))
const { appHtml } = render('/')

// react-helmet-async v3 SSR: hoists title/meta/link before the first <div,
// and renders <script> tags inline within the component tree.
// We split at the first <div to separate head tags from body content.
const firstDivIdx = appHtml.indexOf('<div')
const headTags = firstDivIdx > 0 ? appHtml.slice(0, firstDivIdx).trim() : ''
const bodyContent = firstDivIdx > 0 ? appHtml.slice(firstDivIdx) : appHtml

let html = readFileSync(resolve(distDir, 'index.html'), 'utf-8')

// Inject Helmet-managed head tags (title, canonical, OG, Twitter meta, etc.) into <head>
if (headTags) {
  html = html.replace('</head>', `    ${headTags}\n  </head>`)
}

// Inject only the page content (without duplicated head tags) into the root div
html = html.replace('<div id="root"></div>', `<div id="root">${bodyContent}</div>`)

writeFileSync(resolve(distDir, 'index.html'), html)

// Clean up temporary SSR build
rmSync(ssrDir, { recursive: true, force: true })

console.log('✓ Pre-rendered /')
