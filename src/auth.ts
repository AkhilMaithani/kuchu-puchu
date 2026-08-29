// // import {auth,db} from './firebase'; import {createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,onAuthStateChanged,User as FUser} from 'firebase/auth'; import {doc,getDoc,setDoc,serverTimestamp,collection,runTransaction,query,where,getDocs,deleteDoc} from 'firebase/firestore'; import type {User} from './types';
// // export const currentUser=()=>auth.currentUser;
// // export async function signup(name:string,email:string,password:string,inviteCode:string){
// //   const cred=await createUserWithEmailAndPassword(auth,email,password); const uid=cred.user.uid;
// //   try{
// //     if(inviteCode){
// //       const code=inviteCode.toUpperCase(); const inv=await getDoc(doc(db,'invites',code));
// //       if(!inv.exists()) throw new Error('Invalid invite code.'); const circleId=inv.data().circleId;
// //       await setDoc(doc(db,'joinAttempts',uid),{circleId,inviteCode:code,createdAt:serverTimestamp()});
// //       await runTransaction(db,async tx=>{
// //         const circleRef=doc(db,'circles',circleId); const circle=await tx.get(circleRef);
// //         if(!circle.exists()) throw new Error('Circle not found.'); const cd=circle.data();
// //         if((cd.memberCount??0)>=5) throw new Error('This circle is full.');
// //         tx.set(doc(db,'users',uid),{name,email:cred.user!.email,circleId,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
// //         tx.update(circleRef,{memberCount:(cd.memberCount??0)+1});
// //       });
// //       await deleteDoc(doc(db,'joinAttempts',uid));
// //     }else{
// //       const existing=await getDocs(collection(db,'users')); if(!existing.empty) throw new Error('This app already has a circle. Ask the owner for an invite.');
// //       const circleRef=doc(collection(db,'circles'));
// //       await runTransaction(db,async tx=>{
// //         tx.set(circleRef,{name:'Friend Reminder',ownerId:uid,memberCount:1,createdAt:serverTimestamp()});
// //         tx.set(doc(db,'users',uid),{name,email:cred.user!.email,circleId:circleRef.id,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
// //       });
// //     }
// //   }catch(e){await signOut(auth);throw e;} return uid;
// // }
// // export async function login(email:string,password:string){await signInWithEmailAndPassword(auth,email,password);}
// // export async function logout(){await signOut(auth);}
// // export async function profile(uid:string){const s=await getDoc(doc(db,'users',uid));if(!s.exists())return null;const d=s.data();const c=await getDoc(doc(db,'circles',d.circleId));return {id:uid,name:d.name,email:d.email,circleId:d.circleId,owner:c.exists()&&c.data().ownerId===uid} as User;}
// // export function watchAuth(cb:(u:FUser|null)=>void){return onAuthStateChanged(auth,cb);}

// import { auth, db } from "./firebase";
// import {
// 	createUserWithEmailAndPassword,
// 	signInWithEmailAndPassword,
// 	signOut,
// 	onAuthStateChanged,
// 	User as FUser,
// } from "firebase/auth";
// import {
// 	doc,
// 	getDoc,
// 	setDoc,
// 	serverTimestamp,
// 	collection,
// 	runTransaction,
// 	getDocs,
// 	deleteDoc,
// } from "firebase/firestore";
// import type { User } from "./types";

// export const currentUser = () => auth.currentUser;

// export async function signup(
// 	name: string,
// 	email: string,
// 	password: string,
// 	inviteCode: string,
// ) {
// 	const cred = await createUserWithEmailAndPassword(auth, email, password);
// 	const uid = cred.user.uid;

// 	try {
// 		if (inviteCode) {
// 			const code = inviteCode.toUpperCase();
// 			const inv = await getDoc(doc(db, "invites", code));
// 			if (!inv.exists()) throw new Error("Invalid invite code.");

// 			const circleId = inv.data().circleId;
// 			await setDoc(doc(db, "joinAttempts", uid), {
// 				circleId,
// 				inviteCode: code,
// 				createdAt: serverTimestamp(),
// 			});

// 			await runTransaction(db, async (tx) => {
// 				const circleRef = doc(db, "circles", circleId);
// 				const circle = await tx.get(circleRef);
// 				if (!circle.exists()) throw new Error("Circle not found.");

// 				const cd = circle.data();
// 				if ((cd.memberCount ?? 0) >= 5)
// 					throw new Error("This circle is full (max 5 members).");

// 				tx.set(doc(db, "users", uid), {
// 					name,
// 					email: cred.user!.email,
// 					circleId,
// 					createdAt: serverTimestamp(),
// 					updatedAt: serverTimestamp(),
// 				});
// 				tx.update(circleRef, {
// 					memberCount: (cd.memberCount ?? 0) + 1,
// 				});
// 			});
// 			await deleteDoc(doc(db, "joinAttempts", uid));
// 		} else {
// 			const existing = await getDocs(collection(db, "users"));
// 			if (!existing.empty)
// 				throw new Error(
// 					"This app already has a circle. Ask the owner for an invite.",
// 				);

// 			const circleRef = doc(collection(db, "circles"));
// 			await runTransaction(db, async (tx) => {
// 				tx.set(circleRef, {
// 					name: "Friend Reminder",
// 					ownerId: uid,
// 					memberCount: 1,
// 					createdAt: serverTimestamp(),
// 				});
// 				tx.set(doc(db, "users", uid), {
// 					name,
// 					email: cred.user!.email,
// 					circleId: circleRef.id,
// 					createdAt: serverTimestamp(),
// 					updatedAt: serverTimestamp(),
// 				});
// 			});
// 		}
// 	} catch (e) {
// 		await signOut(auth);
// 		throw e;
// 	}
// 	return uid;
// }

// export async function login(email: string, password: string) {
// 	await signInWithEmailAndPassword(auth, email, password);
// }

// export async function logout() {
// 	await signOut(auth);
// }

// export async function profile(uid: string) {
// 	const s = await getDoc(doc(db, "users", uid));
// 	if (!s.exists()) return null;
// 	const d = s.data();
// 	const c = await getDoc(doc(db, "circles", d.circleId));
// 	return {
// 		id: uid,
// 		name: d.name,
// 		email: d.email,
// 		circleId: d.circleId,
// 		owner: c.exists() && c.data().ownerId === uid,
// 	} as User;
// }

// export function watchAuth(cb: (u: FUser | null) => void) {
// 	return onAuthStateChanged(auth, cb);
// }

import { auth, db } from "./firebase";
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	User as FUser,
} from "firebase/auth";
import {
	doc,
	getDoc,
	setDoc,
	serverTimestamp,
	collection,
	runTransaction,
	getDocs,
	deleteDoc,
} from "firebase/firestore";
import type { User } from "./types";

export const currentUser = () => auth.currentUser;

export async function signup(
	name: string,
	email: string,
	password: string,
	inviteCode: string,
) {
	const cred = await createUserWithEmailAndPassword(auth, email, password);
	const uid = cred.user.uid;

	try {
		if (inviteCode) {
			const code = inviteCode.toUpperCase();
			const inv = await getDoc(doc(db, "invites", code));
			if (!inv.exists()) throw new Error("Invalid invite code.");

			const circleId = inv.data().circleId;
			await setDoc(doc(db, "joinAttempts", uid), {
				circleId,
				inviteCode: code,
				createdAt: serverTimestamp(),
			});

			await runTransaction(db, async (tx) => {
				const circleRef = doc(db, "circles", circleId);
				const circle = await tx.get(circleRef);
				if (!circle.exists()) throw new Error("Circle not found.");

				const cd = circle.data();
				if ((cd.memberCount ?? 0) >= 5)
					throw new Error("This circle is full (max 5 members).");

				tx.set(doc(db, "users", uid), {
					name,
					email: cred.user!.email,
					circleId,
					createdAt: serverTimestamp(),
					updatedAt: serverTimestamp(),
				});
				tx.update(circleRef, {
					memberCount: (cd.memberCount ?? 0) + 1,
				});
			});
			await deleteDoc(doc(db, "joinAttempts", uid));
		} else {
			const existing = await getDocs(collection(db, "users"));
			if (!existing.empty)
				throw new Error(
					"This app already has a circle. Ask the owner for an invite.",
				);

			const circleRef = doc(collection(db, "circles"));
			await runTransaction(db, async (tx) => {
				tx.set(circleRef, {
					name: "Friend Reminder",
					ownerId: uid,
					memberCount: 1,
					createdAt: serverTimestamp(),
				});
				tx.set(doc(db, "users", uid), {
					name,
					email: cred.user!.email,
					circleId: circleRef.id,
					createdAt: serverTimestamp(),
					updatedAt: serverTimestamp(),
				});
			});
		}
	} catch (e) {
		await signOut(auth);
		throw e;
	}

	// The users/{uid} doc is now guaranteed to exist (the transaction
	// above just committed it), so fetch and return the real profile
	// directly instead of relying on the async onAuthStateChanged
	// listener in main.tsx to catch up. That listener can otherwise
	// fire immediately after createUserWithEmailAndPassword() — before
	// this function has finished writing the Firestore doc — and see
	// a null profile, which is what was causing the login/signup
	// redirect-back-to-AuthPage bug.
	const newProfile = await profile(uid);
	if (!newProfile) {
		// Should not happen since we just wrote the doc above, but
		// fail loudly rather than silently returning an invalid user.
		throw new Error(
			"Account was created, but the profile could not be loaded. Please try logging in.",
		);
	}
	return newProfile;
}

export async function login(email: string, password: string) {
	await signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
	await signOut(auth);
}

export async function profile(uid: string) {
	const s = await getDoc(doc(db, "users", uid));
	if (!s.exists()) return null;
	const d = s.data();
	const c = await getDoc(doc(db, "circles", d.circleId));
	return {
		id: uid,
		name: d.name,
		email: d.email,
		circleId: d.circleId,
		owner: c.exists() && c.data().ownerId === uid,
	} as User;
}

export function watchAuth(cb: (u: FUser | null) => void) {
	return onAuthStateChanged(auth, cb);
}
