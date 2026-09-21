// Sends firestore.rules to a running Firestore emulator and fails if they do
// not compile. Meant to be run as
// `firebase emulators:exec --only firestore "node .github/scripts/check-firestore-rules.mjs"`,
// which sets FIRESTORE_EMULATOR_HOST and GCLOUD_PROJECT.
//
// Starting the emulator is not a check by itself: it comes up even with broken
// rules and only writes the compiler error to its log.
import { readFileSync } from 'node:fs'

const host = process.env.FIRESTORE_EMULATOR_HOST
const project = process.env.GCLOUD_PROJECT

if (!host || !project) {
  console.error('FIRESTORE_EMULATOR_HOST or GCLOUD_PROJECT missing — run this via `firebase emulators:exec`.')
  process.exit(1)
}

const content = readFileSync('firestore.rules', 'utf8')

const res = await fetch(`http://${host}/emulator/v1/projects/${project}:securityRules`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ rules: { files: [{ name: 'firestore.rules', content }] } }),
})

if (!res.ok) {
  console.error(await res.text())
  process.exit(1)
}

console.log('firestore.rules compiles.')
