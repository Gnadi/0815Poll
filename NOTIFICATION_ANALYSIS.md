# Poll Notification System — Analysis & Implementation Plan

## Overview

This document analyzes how to notify poll attendees without requiring manual link sharing.
The solution: users create **Contacts** (name + email), attach them to a poll, and those
contacts receive an **automatic notification with the voting link**.

---

## 1. Notification Channel Options (Free Only)

### A. Email via EmailJS ⭐ Recommended (Primary)

**What it is:** EmailJS lets you send emails directly from the browser — no server needed.

| Property | Value |
|---|---|
| Free quota | **200 emails/month** |
| Setup effort | Low (add SDK + configure template) |
| Requires backend | ❌ No (works client-side) |
| Recipient needs account | ❌ No (just an email address) |
| Fits our Firebase stack | ✅ Yes |

**How it works in 0815Poll:**
1. User adds contacts (name + email) stored in Firestore
2. When creating a poll, user selects which contacts to invite
3. After poll creation, EmailJS sends each contact a personalised email with the poll link
4. Contact clicks the link → votes without needing an account (anonymous voting already supported)

**Limits:** 200 emails/month is enough for small groups. Upgrade costs $4/month for 1 000 emails.

---

### B. Firebase Cloud Messaging (FCM) Web Push — Free / Unlimited ⭐ Secondary

**What it is:** Google's free push notification service (already included in our Firebase SDK).

| Property | Value |
|---|---|
| Free quota | **Unlimited** |
| Setup effort | Medium (service worker + permission prompt) |
| Requires backend | Partial (Firebase Admin SDK or FCM HTTP API via Cloud Function) |
| Recipient needs account | ✅ Yes (must have visited app + granted permission) |
| Fits our Firebase stack | ✅ Perfect match |

**How it works:**
1. Registered users grant browser notification permission on first visit
2. FCM token stored in their user profile in Firestore
3. When a poll is created with their contact, a Cloud Function sends a push notification
4. No cost ever

**Limitation:** Only works for contacts who are already registered users of the app.
Does NOT work for external email-only contacts.

---

### C. Firebase Trigger Email Extension — Free with Gmail SMTP

**What it is:** Official Firebase Extension that watches a Firestore collection and sends emails via SMTP.

| Property | Value |
|---|---|
| Free quota | Unlimited (SMTP limits apply) |
| Setup effort | High (install extension, configure SMTP) |
| Requires backend | Firebase Extension (uses Cloud Functions) |
| SMTP provider | Gmail (free) / any SMTP |
| Fits our Firebase stack | ✅ Yes |

**How it works:**
1. Install Firebase Extension "Trigger Email" in Firebase Console
2. Configure Gmail SMTP credentials (App Password)
3. Write a document to `mail/` collection in Firestore
4. Extension picks it up and sends the email automatically

**Advantage over EmailJS:** More reliable, no 200/month limit, works from Cloud Functions.
**Disadvantage:** One-time manual setup in Firebase Console required.

---

### D. SMS — NOT FREE ❌

All SMS providers charge per message. No truly free option exists:

| Provider | Cost |
|---|---|
| Twilio | ~$0.0079/SMS |
| Vonage | ~$0.0063/SMS |
| TextBelt | 1 free SMS/day (not viable) |
| AWS SNS | ~$0.00645/SMS |

**Recommendation:** Skip SMS for now. Email covers the same use case at no cost.

---

## 2. Recommended Architecture

```
User creates poll
       │
       ▼
User selects Contacts to invite
(from their personal contact list stored in Firestore)
       │
       ▼
Poll saved to Firestore
       │
       ├─── For each contact (email-only or unknown user):
       │         EmailJS sends invitation email
       │         → "You've been invited to vote: [link]"
       │
       └─── For each contact who is a registered user (future):
                 FCM push notification (browser/mobile)
```

---

## 3. Data Model Changes

### New Collection: `contacts/{userId}/contacts/{contactId}`
```ts
interface Contact {
  id: string
  name: string
  email: string
  createdAt: Timestamp
}
```

### Updated Poll document
```ts
interface Poll {
  // ... existing fields ...
  invitedContactEmails?: string[]  // emails to notify
}
```

---

## 4. New Features

### 4.1 Contacts Management Page (`/contacts`)
- List all contacts
- Add contact (name + email)
- Delete contact
- Edit contact name

### 4.2 Contact Selector in Poll Creation
- Step shown after poll settings
- Search/filter existing contacts
- Multi-select checkboxes
- "Add new contact" inline shortcut

### 4.3 Notification Dispatch
- EmailJS sends one email per invited contact immediately after poll creation
- Email contains: poll question, creator name, direct vote link, poll deadline
- Tracked in poll document (`notificationsSent: true`)

---

## 5. Implementation Steps

1. ✅ Add `Contact` type to `types/index.ts`
2. ✅ Add contact CRUD to `lib/firestore.ts`
3. ✅ Create `pages/ContactsPage.tsx`
4. ✅ Create `components/ContactSelector.tsx`
5. ✅ Create `lib/emailjs.ts` notification service
6. ✅ Update Poll type (`invitedContactEmails`)
7. ✅ Add contact selection step to poll creation flow (`CreateStandardPoll`, etc.)
8. ✅ Register `/contacts` route in `App.tsx`
9. ✅ Add Contacts tab to `BottomNav`

---

## 6. EmailJS Setup Instructions (One-Time)

1. Create free account at https://www.emailjs.com
2. Add email service (Gmail / Outlook / etc.)
3. Create email template with these variables:
   - `{{to_name}}` — recipient name
   - `{{poll_question}}` — the poll question
   - `{{poll_link}}` — voting URL
   - `{{creator_name}}` — who created the poll
   - `{{expires_at}}` — poll deadline
4. Copy your **Service ID**, **Template ID**, and **Public Key**
5. Add to `.env.local`:
   ```
   VITE_EMAILJS_SERVICE_ID=service_xxx
   VITE_EMAILJS_TEMPLATE_ID=template_xxx
   VITE_EMAILJS_PUBLIC_KEY=xxx
   ```

---

## 7. Cost Summary

| Feature | Service | Monthly Cost |
|---|---|---|
| Email invitations (≤200/mo) | EmailJS Free | **€0** |
| Push notifications | FCM | **€0** |
| Contact storage | Firestore Free Tier | **€0** |
| **Total** | | **€0** |

For > 200 emails/month → upgrade EmailJS Personal at $4/month or switch to Firebase Trigger Email + Gmail (free, unlimited).
