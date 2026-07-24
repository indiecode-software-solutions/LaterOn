// Firebase Cloud Messaging Service Worker
// This file MUST be at the root of the public directory (public/firebase-messaging-sw.js)

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDjrsBB0wLBh3NyUFHwMPD3fpgntHiWuYI',
  projectId: 'lateron-63dee',
  messagingSenderId: '648957702030',
  // Web App ID from Firebase Console → Project Settings → Your apps → Web app
  appId: '__REPLACE_WITH_WEB_APP_ID__'
});

const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || '🔔 LaterOn Reminder';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
