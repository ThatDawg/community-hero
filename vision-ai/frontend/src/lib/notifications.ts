import { messaging, db } from "./firebase";
import { getToken, onMessage, MessagePayload } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";

export async function requestNotificationPermission(userId: string) {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
      if (token && userId) {
        await setDoc(doc(db, "users", userId), { fcm_token: token }, { merge: true });
      }
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
      icon: "/favicon.ico",
    });
  });
}
