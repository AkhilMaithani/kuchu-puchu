// This file MUST live at: public/firebase-messaging-sw.js
// (NOT src/) so Vite serves it as a static file at the site root,
// exactly where navigator.serviceWorker.register("/firebase-messaging-sw.js")
// in push.ts expects to find it.
//
// Service workers run in their own worker context, outside your app's
// module bundle, so this file can't `import` your normal firebase.ts —
// it has to load the Firebase compat SDK via importScripts() and
// initialize a second, separate Firebase app instance here, with the
// config values hardcoded (import.meta.env doesn't exist in this context).

importScripts(
	"https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js",
);
importScripts(
	"https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js",
);

// These values are the same ones from your .env / firebase.ts.
// They are NOT secret — Firebase web config is meant to be public;
// your Firestore/Storage security rules are what actually protect data.
firebase.initializeApp({
	apiKey: "AIzaSyBaQCPYIlw64UeqpBVTKmSXBoV3VO3sj5M",
	authDomain: "kuchu-puchu-bebbe.firebaseapp.com",
	projectId: "kuchu-puchu-bebbe",
	storageBucket: "kuchu-puchu-bebbe.firebasestorage.app",
	messagingSenderId: "815600418714",
	appId: "1:815600418714:web:f31cffddb958ea76f30423",
});

const messaging = firebase.messaging();

// Handles push notifications that arrive while the app/tab is closed
// or in the background. Foreground messages (tab open and focused)
// are instead handled by the onMessage() callback in push.ts's
// enablePush(), via the onForeground parameter.
messaging.onBackgroundMessage((payload) => {
	console.log(
		"[firebase-messaging-sw.js] Background message received:",
		payload,
	);
	const title = payload.notification?.title || "Friend Reminder";
	const body = payload.notification?.body || "You have a reminder.";
	self.registration.showNotification(title, {
		body,
		// Remove the line below if you don't have an icon file in public/,
		// or point it at whatever icon file you do have.
		icon: "/icon-192.png",
	});
});
