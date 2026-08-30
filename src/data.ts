import { db, auth } from "./firebase";
import {
	collection,
	doc,
	addDoc,
	getDocs,
	setDoc,
	updateDoc,
	deleteDoc,
	query,
	where,
	serverTimestamp,
} from "firebase/firestore";
import type { Reminder, User, Frequency } from "./types";
const uid = () => auth.currentUser!.uid;
export async function members(circleId: string) {
	const s = await getDocs(
		query(collection(db, "users"), where("circleId", "==", circleId)),
	);
	return s.docs.map((x) => ({ id: x.id, ...x.data() }) as any as User);
}
export async function createInvite(circleId: string) {
	const code =
		"FRIEND-" +
		crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
	await setDoc(doc(db, "invites", code), {
		code,
		circleId,
		createdBy: uid(),
		createdAt: serverTimestamp(),
	});
	return code;
}
export async function reminders(circleId: string) {
	const s = await getDocs(
		query(collection(db, "reminders"), where("circleId", "==", circleId)),
	);
	const users = await members(circleId);
	const map = new Map(users.map((u) => [u.id, u.name]));
	return s.docs
		.map((x) => {
			const d = x.data();
			return {
				id: x.id,
				...d,
				creatorName: map.get(d.creatorId),
				receiverName: map.get(d.receiverId),
			} as Reminder;
		})
		.sort((a, b) => b.createdAt - a.createdAt)
		.filter((r) => r.creatorId === uid() || r.receiverId === uid());
}
export async function createReminder(
	circleId: string,
	f: {
		message: string;
		receiverId: string;
		frequency: Frequency;
		startAt: number;
		endAt?: number | null;
	},
) {
	const self = f.receiverId === uid();
	await addDoc(collection(db, "reminders"), {
		...f,
		circleId,
		creatorId: uid(),
		nextRunAt: f.startAt,
		status: self ? "ACTIVE" : "PENDING",
		createdAt: Date.now(),
		updatedAt: Date.now(),
	});
}
export async function approve(id: string) {
	await updateDoc(doc(db, "reminders", id), {
		status: "ACTIVE",
		updatedAt: Date.now(),
	});
}
export async function reject(id: string) {
	await updateDoc(doc(db, "reminders", id), {
		status: "REJECTED",
		updatedAt: Date.now(),
	});
}
export async function cancel(id: string) {
	await updateDoc(doc(db, "reminders", id), {
		status: "CANCELLED",
		cancelledAt: Date.now(),
		updatedAt: Date.now(),
	});
}
export async function deleteReminder(id: string) {
	await deleteDoc(doc(db, "reminders", id));
}
export async function updateReminderMessage(id: string, message: string) {
	await updateDoc(doc(db, "reminders", id), {
		message,
		updatedAt: Date.now(),
	});
}
export async function savePushToken(token: string) {
	const ref = doc(
		db,
		"users",
		uid(),
		"devices",
		btoa(token).replaceAll("/", "_").slice(0, 120),
	);
	await setDoc(
		ref,
		{
			token,
			active: true,
			updatedAt: serverTimestamp(),
			createdAt: serverTimestamp(),
		},
		{ merge: true },
	);
}

export async function hasActiveDevice(): Promise<boolean> {
	const snap = await getDocs(
		query(
			collection(db, "users", uid(), "devices"),
			where("active", "==", true),
		),
	);
	return !snap.empty;
}
