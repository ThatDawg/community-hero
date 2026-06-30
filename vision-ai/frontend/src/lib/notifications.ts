import { messaging } from "./firebase";
import { getToken, onMessage, MessagePayload } from "firebase/messaging";

export async function requestNotificationPermission() {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
      return token;
    }
  } catch (err) {
    console.error("Notification permission error:", err);
  }
  return null;
}

export function onForegroundMessage(callback: (payload: MessagePayload) => void) {
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    callback(payload);
    new Notification(payload.notification?.title || "Vision AI", {
      body: payload.notification?.body,
      icon: "/icon.png",
    });
  });
}
