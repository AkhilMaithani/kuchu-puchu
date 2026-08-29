// import {getToken,onMessage} from 'firebase/messaging'; import {getWebMessaging,vapidKey} from './firebase'; import {savePushToken} from './data';
// export async function enablePush(onForeground?:(title:string,body:string)=>void){if(!('Notification'in window)||!('serviceWorker'in navigator))throw new Error('Push notifications are not supported here.');const permission=await Notification.requestPermission();if(permission!=='granted')throw new Error('Notification permission was not granted.');const reg=await navigator.serviceWorker.register('/firebase-messaging-sw.js');const messaging=await getWebMessaging();if(!messaging)throw new Error('This browser does not support Firebase web push.');const token=await getToken(messaging,{vapidKey,serviceWorkerRegistration:reg});if(!token)throw new Error('Could not register this device.');await savePushToken(token);if(onForeground)onMessage(messaging,p=>onForeground(p.notification?.title||'Friend Reminder',p.notification?.body||'You have a reminder.'));}

import { getToken, onMessage } from "firebase/messaging";
import { getWebMessaging, vapidKey } from "./firebase";
import { savePushToken } from "./data";

export async function enablePush(
	onForeground?: (title: string, body: string) => void,
) {
	if (!("Notification" in window) || !("serviceWorker" in navigator)) {
		throw new Error(
			"Push notifications are not supported in this browser.",
		);
	}

	const permission = await Notification.requestPermission();
	if (permission !== "granted") {
		throw new Error("Notification permission was not granted.");
	}

	const reg = await navigator.serviceWorker.register(
		"/firebase-messaging-sw.js",
	);
	const messaging = await getWebMessaging();
	if (!messaging)
		throw new Error("This browser does not support Firebase web push.");

	const token = await getToken(messaging, {
		vapidKey,
		serviceWorkerRegistration: reg,
	});
	if (!token) throw new Error("Could not register this device.");

	await savePushToken(token);

	if (onForeground) {
		onMessage(messaging, (p) =>
			onForeground(
				p.notification?.title || "Friend Reminder",
				p.notification?.body || "You have a reminder.",
			),
		);
	}
}
