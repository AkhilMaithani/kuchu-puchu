/******/ var __webpack_modules__ = ({

/***/ 41:
/***/ ((module) => {

module.exports = eval("require")("firebase-admin");


/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __nccwpck_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	var threw = true;
/******/ 	try {
/******/ 		__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 		threw = false;
/******/ 	} finally {
/******/ 		if(threw) delete __webpack_module_cache__[moduleId];
/******/ 	}
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/asset-relocator-loader */
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = decodeURIComponent(new URL('.', import.meta.url).pathname).slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
/* harmony import */ var firebase_admin__WEBPACK_IMPORTED_MODULE_0__ = __nccwpck_require__(41);


const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON secret");
firebase_admin__WEBPACK_IMPORTED_MODULE_0__.initializeApp({ credential: firebase_admin__WEBPACK_IMPORTED_MODULE_0__.credential.cert(JSON.parse(raw)) });

const db = firebase_admin__WEBPACK_IMPORTED_MODULE_0__.firestore();
const messaging = firebase_admin__WEBPACK_IMPORTED_MODULE_0__.messaging();

const now = Date.now();

function msForFrequency(freq) {
	if (freq === "DAILY") return 24 * 60 * 60e3;
	if (freq === "EVERY_30_MINUTES") return 30 * 60e3; // legacy value
	if (freq === "EVERY_HOUR") return 60 * 60e3; // legacy value
	const match = /^EVERY_(\d+)_HOURS?$/.exec(freq);
	if (match) return parseInt(match[1], 10) * 60 * 60e3;
	return null;
}

async function run() {
	const snap = await db
		.collection("reminders")
		.where("status", "==", "ACTIVE")
		.where("nextRunAt", "<=", now)
		.limit(100)
		.get();

	for (const ref of snap.docs) {
		try {
			const fresh = (await ref.ref.get()).data();
			if (!fresh || fresh.status !== "ACTIVE" || fresh.nextRunAt > now)
				continue;

			if (fresh.endAt && fresh.nextRunAt >= fresh.endAt) {
				await ref.ref.update({
					status: "COMPLETED",
					updatedAt: Date.now(),
				});
				continue;
			}

			const ds = await db
				.collection("users")
				.doc(fresh.receiverId)
				.collection("devices")
				.where("active", "==", true)
				.get();
			const tokens = ds.docs.map((d) => d.data().token).filter(Boolean);

			if (tokens.length) {
				const creatorDoc = await db
					.collection("users")
					.doc(fresh.creatorId)
					.get();
				const creatorName = creatorDoc.exists
					? creatorDoc.data().name
					: "Someone";

				const result = await messaging.sendEachForMulticast({
					tokens,
					notification: {
						title:
							fresh.creatorId === fresh.receiverId
								? "💌 Friend Reminder"
								: `💌 Reminder from ${creatorName}`,
						body: fresh.message,
					},
					webpush: {
						fcmOptions: { link: process.env.APP_URL || "/" },
						notification: {
							icon: process.env.ICON_URL || "/icon-192.png",
							vibrate: [200, 100, 200],
						},
					},
				});

				const bad = [];
				result.responses.forEach((x, i) => {
					if (
						!x.success &&
						[
							"messaging/registration-token-not-registered",
							"messaging/invalid-registration-token",
						].includes(x.error?.code || "")
					) {
						bad.push(ds.docs[i].ref);
					}
				});
				await Promise.all(bad.map((x) => x.update({ active: false })));
			}

			const next =
				fresh.frequency === "ONCE"
					? null
					: fresh.nextRunAt + msForFrequency(fresh.frequency);
			if (next === null || (fresh.endAt && next >= fresh.endAt)) {
				await ref.ref.update({
					status: "COMPLETED",
					updatedAt: Date.now(),
				});
			} else {
				await ref.ref.update({
					nextRunAt: next,
					updatedAt: Date.now(),
				});
			}
		} catch (e) {
			console.error(`Error processing reminder ${ref.id}:`, e);
		}
	}
	console.log(`Processed ${snap.size} reminder(s).`);
}

run().catch(console.error);

