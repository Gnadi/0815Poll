# myFAOS ⇄ FlexPoll integration — plan (FlexPoll side)

Goal: **myFAOS families create private polls that run on FlexPoll, without
anyone ever creating a FlexPoll account.**

Two hard requirements drive every decision below:

1. **Private is really private.** Not "unlisted". A poll created from myFAOS
   must be unreadable to anyone outside the family that owns it.
2. **No second account.** A myFAOS user never sees a FlexPoll sign-up, never
   picks a FlexPoll password, never links anything. The bridge is invisible.

The companion document lives in the myFAOS repo at
`docs/flexpoll-integration-plan.md`. Sections 1–3 below are the **shared
contract** and are duplicated verbatim in both repos — change them in both or
not at all. Section 4 onwards is FlexPoll's own work list.

---

## 0. Where we are starting from

Facts established by reading both codebases (2026-08):

| | FlexPoll (`0815Poll`) | myFAOS (`0815familyOS`) |
|---|---|---|
| Stack | React 19 + TS, Vite 6 | React 18 + JS, Vite 5 + `vite-react-ssg` |
| Firebase SDK | v11 | v10 |
| Firebase project | its own | its own, **separate** |
| Hosting | Vercel, `api/*.ts` functions | Vercel, `api/*.js` functions |
| Server-side Firebase | Cloud Function (`functions/index.ts`, Admin SDK) | none |
| Rules tests | **none** | `tests/rules/rules.spec.js` + emulator |

The blocking finding: **FlexPoll has no private polls today.**
`firestore.rules` says

```
match /polls/{pollId} {
  allow read: if true;
```

and `isPrivate` only removes a poll from the Explore listing
(`where('isPrivate', '==', false)` in `src/lib/firestore.ts`). Poll IDs are
Firestore auto-IDs, so a poll is currently "private" in the same way an
unlisted YouTube video is. That does not satisfy requirement 1, so the
visibility model has to be rebuilt **before** any myFAOS data reaches it.

---

## 1. Shared contract — identity federation

### 1.1 The chosen mechanism

FlexPoll acts as a **relying party** for myFAOS's Firebase Auth. One new
FlexPoll endpoint trades a myFAOS ID token for a FlexPoll Firebase **custom
token**:

```
myFAOS client                      FlexPoll /api/faos/session         Google
─────────────                      ──────────────────────────         ──────
getIdToken()  ──────────────────►  verify JWT signature ───────────►  securetoken
                                   (x509 certs, cached)               public keys
                                   assert iss/aud == FAOS project
                                   assert exp/iat, email_verified n/a
                                          │
                                   admin.createCustomToken(
                                     `faos_${faosUid}`,
                                     { provider: 'faos', faosUid })
                                          │
              ◄─────────────────── { customToken, uid, expiresIn }
signInWithCustomToken(flexpollAuth, customToken)
              ─────────────────────────────────────────────────────►  FlexPoll
                                                                      Firebase Auth
```

From that point the myFAOS client talks to **FlexPoll's Firestore directly**
with a real, rule-enforceable identity. No poll-shaped REST API is needed, and
results stay realtime through `onSnapshot`.

### 1.2 Why this and not the alternatives

| Option | Verdict |
|---|---|
| **Custom-token federation (chosen)** | Invisible to the user, one endpoint, realtime, rules can express "family only". Needs a FlexPoll service account. |
| Full REST API on FlexPoll (`POST /api/polls`, `GET /api/polls/:id`, …) | Also needs a FlexPoll service account (the server still has to write Firestore), but adds ~8 endpoints, loses realtime, and re-implements pagination/auth per route. Rejected. |
| Merge both apps into one Firebase project | Simplest auth story, but a data migration of two live products plus a merged rules file. Out of proportion. Rejected. |
| GCIP / OIDC provider federation | The "official" answer, but requires upgrading FlexPoll to Identity Platform (billing tier) for one partner. Rejected for now; the custom-token path can migrate to it later without changing uids. |
| Iframe FlexPoll inside myFAOS | Needs `X-Frame-Options: DENY` removed (`vercel.json`), fights third-party storage partitioning, and can't be styled or translated. Rejected. |

### 1.3 UID derivation — the load-bearing detail

```
flexpollUid = `faos_${faosUid}`
```

Deliberately **deterministic and computable client-side**. That is what lets a
poll's audience list include family members *who have never opened FlexPoll* —
the creator derives their FlexPoll uids from `family.memberIds` at creation
time. The uid is an identifier, not a secret: it is only ever *assumed* by
someone who presented a valid myFAOS ID token to the session endpoint.

Impersonation is closed off because Firebase assigns random uids to
email/password and Google sign-ups; the `faos_` namespace can only be entered
through a custom token, and only `/api/faos/session` mints those. Rules
additionally check the `provider == 'faos'` custom claim wherever the
distinction matters.

### 1.4 What must NOT cross the boundary

FlexPoll's rules let any signed-in user read any `users/{uid}` document (it
backs the invite-by-email lookup in `getUserByEmail`). Therefore:

- **Never write a myFAOS user's email into FlexPoll's `users` collection.**
  The federated profile carries `displayName`, `provider: 'faos'`, and nothing
  else. It is written server-side by the session endpoint (Admin SDK) so the
  display name cannot be spoofed by the client.
- Federated profiles are excluded from `getUserByEmail` results.
- No myFAOS `familyId`, invite token, or `encryptionKeyJwk` is ever sent.
  A poll carries an opaque `externalFamilyId` only, used for grouping.

### 1.5 Data-protection note

Poll questions, options and votes are stored in **FlexPoll's** Firebase project
in plaintext — FlexPoll has to count votes, so the document-vault style
end-to-end encryption used elsewhere in myFAOS is not available here. This is a
disclosure item for both privacy policies (FA-19 / FP-16), not a blocker: both
products share one operator.

---

## 2. Shared contract — the private-poll data model

New fields on `polls/{pollId}`:

```ts
visibility?: 'public' | 'unlisted' | 'restricted'  // absent ⇒ 'unlisted' (legacy)
audienceUids?: string[]      // required when visibility === 'restricted'
origin?: 'flexpoll' | 'faos' // provenance
externalFamilyId?: string    // opaque myFAOS family id, restricted polls only
```

Semantics:

- `public` — listed in Explore, readable by anyone. (`isPrivate === false`)
- `unlisted` — today's behaviour: hidden from Explore, readable via direct
  link. Every existing poll is this, by omission. Nothing breaks.
- `restricted` — **readable, votable and listable only by a uid in
  `audienceUids`.** This is what myFAOS creates. Always paired with
  `isPrivate: true`.

`audienceUids` is capped (suggest 50) so a restricted poll stays a family-sized
object and the array-contains index stays cheap.

### 2.1 Rule shape (FlexPoll `firestore.rules`)

```
function vis(d)        { return d.get('visibility', 'unlisted'); }
function inAudience(d) { return request.auth != null
                                && request.auth.uid in d.get('audienceUids', []); }

match /polls/{pollId} {
  allow get:  if vis(resource.data) != 'restricted' || inAudience(resource.data);
  allow list: if vis(resource.data) != 'restricted' || inAudience(resource.data);

  allow create: if <existing createdBy checks>
    && ( request.resource.data.get('visibility','unlisted') != 'restricted'
         || ( request.auth.token.get('provider','') == 'faos'
              && request.resource.data.isPrivate == true
              && request.auth.uid in request.resource.data.audienceUids
              && request.resource.data.audienceUids.size() <= 50 ) );

  // vote-count bump: today ANY caller may increment counts on ANY active poll
  allow update: if
    (request.auth != null && request.auth.uid == resource.data.createdBy)
    || ( resource.data.status == 'active'
         && (vis(resource.data) != 'restricted' || inAudience(resource.data))
         && <existing affectedKeys hasOnly([...]) check> )
    || <existing expiry-flip clause, plus the same audience guard>;

  allow delete: if <unchanged>;
}
```

and in each of `votes`, `schedule_votes`, `ranking_votes`, `priority_votes`:

```
allow create: if <existing userId checks>
  && ( get(/databases/$(database)/documents/polls/$(request.resource.data.pollId))
         .data.get('visibility','unlisted') != 'restricted'
       || request.auth.uid in get(/databases/$(database)/documents/polls/$(
            request.resource.data.pollId)).data.audienceUids );
```

That costs one extra document read per vote on restricted polls. Acceptable;
the alternative (denormalising the audience onto every vote) is worse.

### 2.2 Index

`where('audienceUids','array-contains', uid).orderBy('createdAt','desc')`
needs a composite index. FlexPoll has no `firestore.indexes.json` yet — one is
created in FP-6.

### 2.3 Membership changes

`audienceUids` is a snapshot taken at creation. When someone joins or leaves a
family afterwards, the *poll creator's* client reconciles open polls (the
"creator can change anything" update clause already permits it). Leaving a
family removes the ex-member from open polls; it does not retroactively erase
their cast votes.

---

## 3. Shared contract — endpoint spec

```
POST https://<flexpoll-host>/api/faos/session
Authorization: Bearer <myFAOS Firebase ID token>
Content-Type: application/json
{ "displayName": "Anna" }          // optional; server falls back to the token's name

200 { "customToken": "...", "uid": "faos_abc123", "expiresIn": 3600 }
401 { "error": "invalid_token" }
403 { "error": "origin_not_allowed" }
429 { "error": "rate_limited" }
```

- CORS: `Access-Control-Allow-Origin` from an env allowlist
  (`FAOS_ALLOWED_ORIGINS`), never `*`. `OPTIONS` preflight handled.
- Verification is **offline JWT validation** against Google's
  `securetoken@system.gserviceaccount.com` x509 certs (cached to the
  `Cache-Control: max-age` they ship with). Checks: RS256, `kid` present in the
  cert set, `iss === https://securetoken.google.com/${FAOS_PROJECT_ID}`,
  `aud === FAOS_PROJECT_ID`, `exp > now`, `iat <= now`, `sub` non-empty.
  Note this is *not* the `accounts:lookup` trick used by
  `api/cloudinary-sign.ts` — that only works for tokens from FlexPoll's own
  project, and would accept nothing from myFAOS.
- Never accept a project id from the request body. `FAOS_PROJECT_ID` is env.

---

## 4. FlexPoll todo list

Ordered. **FP-1 … FP-7 must ship and be deployed before myFAOS sends any
traffic** — the rules have to be tight before there is data to protect.

### Phase A — make "private" mean private

- [ ] **FP-1 — Extend the poll model.** `src/types/index.ts`: add
      `visibility`, `audienceUids`, `origin`, `externalFamilyId` to `Poll`
      (all optional, so `CreatePollPayload` and every existing caller keep
      compiling). Document that absent `visibility` means `unlisted`.

- [ ] **FP-2 — Stand up a rules test harness.** FlexPoll has no tests at all.
      Add `vitest` + `@firebase/rules-unit-testing` + `firebase-tools` as dev
      deps, a `tests/rules/polls.spec.js`, an `emulators` block in
      `firebase.json`, and `test` / `test:rules` scripts mirroring myFAOS's
      setup. Do this *before* FP-3 so the new rules are written against
      failing tests.

- [ ] **FP-3 — Rewrite the poll rules** per §2.1. Cases to assert:
      - outsider `get` on a restricted poll → **denied**
      - audience member `get` → allowed
      - outsider `list`/Explore query cannot surface a restricted poll
      - outsider cannot bump `totalVotes`/`options` on a restricted poll
        *(this closes an existing hole for every poll type)*
      - outsider cannot create a vote doc for a restricted poll
      - a legacy poll with no `visibility` field still reads publicly
      - a non-`faos` caller cannot create a `restricted` poll
      - `audienceUids` over the cap → denied
      - creator can still edit their own restricted poll

- [ ] **FP-4 — Enforce the invariant in the client too.**
      `src/lib/firestore.ts#createPoll` rejects `visibility: 'restricted'`
      without a non-empty `audienceUids`, and forces `isPrivate: true`.

- [ ] **FP-5 — Audit every read path for leakage.** `getPolls`,
      `getPollsPage`, `getActivePolls` already filter `isPrivate == false`, so
      they are safe once §2.1 forces `isPrivate` on restricted polls — add a
      belt-and-braces `where('visibility','!=','restricted')` where the index
      allows, or filter in `docToPoll`. `getUserPolls` (used by Home/Profile)
      must keep returning the user's own restricted polls. Check
      `src/pages/Explore.tsx`, `Home.tsx`, `PollResults.tsx` and
      `src/entry-server.tsx` (SSR/prerender must never fetch a restricted
      poll).

- [ ] **FP-6 — `firestore.indexes.json`.** New file; add the
      `audienceUids array-contains` + `createdAt desc` composite index, wire it
      into `firebase.json` (`"firestore": { "indexes": ... }`).

- [ ] **FP-7 — Backfill decision.** Existing polls stay untouched (absent
      `visibility` ⇒ `unlisted` ⇒ current behaviour). Write this down in the
      migration notes; explicitly decide *not* to mass-rewrite documents.

### Phase B — the federation endpoint

- [ ] **FP-8 — JWT verifier.** `api/_lib/verifyFaosToken.ts`: fetch + cache
      Google's securetoken x509 certs, verify RS256 signature and all claims
      per §3. Pure, no Firebase dependency, unit-testable with a fixture token.

- [ ] **FP-9 — Admin SDK bootstrap.** Add `firebase-admin` to the root
      `package.json` (the `functions/` folder has its own). `api/_lib/admin.ts`
      initializes once from `FLEXPOLL_SERVICE_ACCOUNT_JSON`, memoised across
      warm invocations.

- [ ] **FP-10 — `api/faos/session.ts`.** Implements §3: preflight, origin
      allowlist, verify, mint `createCustomToken('faos_' + sub, { provider:
      'faos', faosUid: sub })`, upsert `users/faos_<sub>` with
      `{ displayName, provider: 'faos', createdAt }` — **no email** (§1.4) —
      and return. Per-uid rate limit (in-memory + a Firestore counter is fine
      at this scale).

- [ ] **FP-11 — Keep federated users out of the email directory.**
      `getUserByEmail` must skip documents with `provider === 'faos'`. Since
      those documents carry no `email` field they cannot match today, but make
      it explicit so a future change can't leak myFAOS identities into
      FlexPoll's contact picker.

- [ ] **FP-12 — Env + config.** `.env.local.example` gains
      `FAOS_PROJECT_ID`, `FAOS_ALLOWED_ORIGINS`,
      `FLEXPOLL_SERVICE_ACCOUNT_JSON`. Add the same three to Vercel (Preview +
      Production). Note in the README that the service-account JSON is a
      **secret** and must never be prefixed `VITE_`.

- [ ] **FP-13 — CORS headers in `vercel.json`** for `/api/faos/(.*)` if the
      per-handler headers prove insufficient. Leave the global
      `X-Frame-Options: DENY` alone — the integration is API-based, not an
      iframe.

### Phase C — polish, once myFAOS is wired up

- [ ] **FP-14 — "Created in myFAOS" affordance.** A poll with
      `origin === 'faos'` opened in FlexPoll by an audience member renders a
      small badge and a back-link. Keeps the two products legible to a user who
      has both.

- [ ] **FP-15 — Restricted polls in the creator's own lists.** Home/Profile
      must show family polls a FlexPoll-native user created, and *not* offer
      the public share sheet (`src/lib/share.ts`, `PollQRCode.tsx`) for them —
      a QR code to a restricted poll is a dead link for outsiders. Replace with
      "share inside myFAOS".

- [ ] **FP-16 — Docs.** README section on the federation contract and the
      three visibility levels; note in the privacy policy that polls may
      originate from a partner app. Link this plan.

- [ ] **FP-17 — Notification path.** Decide whether restricted polls enqueue
      `push_queue` entries at all. Recommendation: **no** for v1 — myFAOS owns
      notifying its own family (FA-16). Add an explicit early-return so a
      restricted poll never pushes through FlexPoll's FCM dispatcher.

- [ ] **FP-18 — Rate/abuse review.** `polls` create is open to unauthenticated
      callers today. With federation live, add a per-uid create ceiling for
      `provider === 'faos'` identities (rules can't count; do it in
      `createPoll` plus a Cloud Function sweep if it ever matters).

---

## 5. Rollout order

1. FP-1 → FP-7, deploy rules (`firebase deploy --only firestore:rules,firestore:indexes`).
   Verify existing public polls are untouched in production.
2. FP-8 → FP-13, deploy the API. Smoke-test `POST /api/faos/session` with a
   real myFAOS ID token from a staging account.
3. myFAOS FA-1 → FA-14 behind a flag (`VITE_FLEXPOLL_ENABLED`), dogfood on one
   family.
4. FP-14 → FP-18 and FA-15 → FA-20, then flip the flag on.

## 6. Open questions for the owner

- **Poll types in v1.** Recommendation: `standard` (single + multi choice) and
  `schedule` only — they cover "what's for dinner" and "when are we going".
  `ranking`, `priority`, `location`, `image`, `custom` follow later; each is
  extra UI in myFAOS, not extra backend.
- **Can a family poll be shared outside the family** (e.g. with a grandparent
  who has no myFAOS account)? Requirement 1 says no. If that changes, the model
  extends with per-poll invite tokens rather than by loosening `restricted`.
- **Deletion/retention.** When a myFAOS family is deleted, who deletes its
  FlexPoll polls? Needs a decision before launch; a scheduled sweep keyed on
  `externalFamilyId` is the cheap answer.
