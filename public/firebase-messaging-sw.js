/**
 * Firebase Cloud Messaging Service Worker
 *
 * Served from the root URL. Handles background push notifications when the
 * app tab is not in focus. The client (src/lib/fcm.ts) registers this file
 * with the Firebase web config encoded as query-string params, which we parse
 * here to initialise the Firebase app — this avoids hard-coding secrets or
 * running a build-time injection step.
 */

importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js')

const params = new URL(self.location).searchParams
const firebaseConfig = {
  apiKey: params.get('apiKey') || '',
  authDomain: params.get('authDomain') || '',
  projectId: params.get('projectId') || '',
  storageBucket: params.get('storageBucket') || '',
  messagingSenderId: params.get('messagingSenderId') || '',
  appId: params.get('appId') || '',
}

if (firebaseConfig.projectId && firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig)

  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    const { title, body } = payload.notification || {}
    if (!title) return

    self.registration.showNotification(title, {
      body: body || '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: payload.data,
    })
  })
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const pollId = event.notification.data?.pollId
  if (pollId) {
    event.waitUntil(clients.openWindow(`/poll/${pollId}`))
  }
})
