import fs from "node:fs";
import path from "node:path";

const env = fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "";
const fromDotEnv = {};
for (const line of env.split(/\r?\n/)) {
	const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
	if (m) fromDotEnv[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, "");
}

function readVar(key) {
	return fromDotEnv[key] || process.env[key] || "";
}

const keys = [
	"VITE_FIREBASE_API_KEY",
	"VITE_FIREBASE_AUTH_DOMAIN",
	"VITE_FIREBASE_PROJECT_ID",
	"VITE_FIREBASE_STORAGE_BUCKET",
	"VITE_FIREBASE_MESSAGING_SENDER_ID",
	"VITE_FIREBASE_APP_ID",
];

const missing = keys.filter((k) => !readVar(k));
if (missing.length) {
	// Fail the build loudly instead of silently shipping a broken service
	// worker with 'YOUR_API_KEY' placeholders baked in — that failure mode
	// is much harder to debug than a clear error at build time.
	console.error(
		`generate-firebase-sw.mjs: missing required value(s): ${missing.join(", ")}\n` +
			`Set these in your local .env file, or as GitHub Actions secrets ` +
			`(and pass them as env vars in the workflow's build step).`,
	);
	process.exit(1);
}

const cfg = {
	apiKey: readVar("VITE_FIREBASE_API_KEY"),
	authDomain: readVar("VITE_FIREBASE_AUTH_DOMAIN"),
	projectId: readVar("VITE_FIREBASE_PROJECT_ID"),
	storageBucket: readVar("VITE_FIREBASE_STORAGE_BUCKET"),
	messagingSenderId: readVar("VITE_FIREBASE_MESSAGING_SENDER_ID"),
	appId: readVar("VITE_FIREBASE_APP_ID"),
};

fs.writeFileSync(
	path.join("public", "firebase-messaging-sw.js"),
	`importScripts('https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js');
firebase.initializeApp(${JSON.stringify(cfg)});
const messaging=firebase.messaging();
messaging.onBackgroundMessage(({notification,data})=>{const n=notification||{}; self.registration.showNotification(n.title||'💌 Friend Reminder',{body:n.body||'You have a reminder.',icon:'icon-192.png',data:{url:data?.url||'/kuchu-puchu/'}});});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){if('focus'in c)return c.focus();}return clients.openWindow(event.notification.data?.url||'/kuchu-puchu/');}));});
`,
);

console.log("generate-firebase-sw.mjs: wrote public/firebase-messaging-sw.js");
