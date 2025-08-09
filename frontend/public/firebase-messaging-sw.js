/* global self */
importScripts(
  "https://www.gstatic.com/firebasejs/10.4.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.4.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyDoGKYDQbXk2jPQWEL8En4gsikH29yw-vA",
  authDomain: "chatrift-ca05f.firebaseapp.com",
  projectId: "chatrift-ca05f",
  messagingSenderId: "796436071569",
  appId: "1:796436071569:web:bd38465ed83190d5886b30",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const { title, body, senderId, senderImage } = payload.data;

  self.registration.showNotification(title, {
    body,
    icon: `${senderImage.length ? senderImage : "/chatrift-logo.png"}`,
    badge: "/chatrift-notification-badge.png",
    tag: senderId,
  });
});

// Notification click handler to navigate to chat screen using chatId
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  // Fallback: open home if no chatId
  const urlToOpen = "/chat";

  // Focus or open the URL in a new window/tab
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Check if the client window is already open
        for (let client of windowClients) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }
        // If not open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
