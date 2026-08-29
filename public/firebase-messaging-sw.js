importScripts(
	"https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js",
);
importScripts(
	"https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js",
);

firebase.initializeApp({
	apiKey: "AIzaSyBaQCPYIlw64UeqpBVTKmSXBoV3VO3sj5M",
	authDomain: "kuchu-puchu-bebbe.firebaseapp.com",
	projectId: "kuchu-puchu-bebbe",
	storageBucket: "kuchu-puchu-bebbe.firebasestorage.app",
	messagingSenderId: "815600418714",
	appId: "1:815600418714:web:f31cffddb958ea76f30423",
});

const messaging = firebase.messaging();

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
