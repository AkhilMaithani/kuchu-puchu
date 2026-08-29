import admin from "firebase-admin";

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON secret");
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });

const db = admin.firestore();
const messaging = admin.messaging();

const now = Date.now();
const MS_FREQ = {
	EVERY_30_MINUTES: 30 * 60e3,
	EVERY_HOUR: 60 * 60e3,
	DAILY: 24 * 60 * 60e3,
};

async function run() {
	const snap = await db
		.collection("reminders")
		.where("status", "==", "ACTIVE")
		.where("nextRunAt", "<=", now)
		.limit(100)
		.get();

	for (const ref of snap.docs) {
		try {
			const fresh = (await ref.get()).data();
			if (!fresh || fresh.status !== "ACTIVE" || fresh.nextRunAt > now)
				continue;

			if (fresh.endAt && fresh.nextRunAt >= fresh.endAt) {
				await ref.update({
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
				const result = await messaging.sendEachForMulticast({
					tokens,
					notification: {
						title: "💌 Friend Reminder",
						body: fresh.message,
					},
					webpush: {
						fcmOptions: { link: process.env.APP_URL || "/" },
						notification: {
							icon: process.env.ICON_URL || "/icon-192.png",
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
					: fresh.nextRunAt + MS_FREQ[fresh.frequency];
			if (next === null || (fresh.endAt && next >= fresh.endAt)) {
				await ref.update({
					status: "COMPLETED",
					updatedAt: Date.now(),
				});
			} else {
				await ref.update({ nextRunAt: next, updatedAt: Date.now() });
			}
		} catch (e) {
			console.error(`Error processing reminder ${ref.id}:`, e);
		}
	}
	console.log(`Processed ${snap.size} reminder(s).`);
}

run().catch(console.error);
