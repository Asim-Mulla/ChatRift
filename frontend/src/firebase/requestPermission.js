import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { firebaseApp } from "./firebase-config";

const messaging = getMessaging(firebaseApp);

export const requestFirebaseNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notifications permission not granted");
      return;
    }

    // Always try to get a token, even if permission was granted earlier
    const fcmToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_VAPID_KEY,
    });

    if (!fcmToken) {
      console.warn("No FCM token received");
      return;
    }

    // Check if token already saved in localStorage
    const storedToken = localStorage.getItem("fcmToken");
    if (storedToken !== fcmToken) {
      // Save to DB
      await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/user/save-fcm-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ token: fcmToken }),
        }
      );
      localStorage.setItem("fcmToken", fcmToken);
      console.log("FCM token updated on server");
    } else {
      console.log("FCM token already up to date");
    }
  } catch (err) {
    console.error("Error getting notification permission or token", err);
  }
};
