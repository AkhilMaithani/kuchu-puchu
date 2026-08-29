import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { hasActiveDevice } from "./data";
import {
	HashRouter,
	useNavigate,
	Link,
	NavLink,
	Routes,
	Route,
} from "react-router-dom";
import { watchAuth, profile, signup, login, logout } from "./auth";
import {
	members,
	createInvite,
	reminders,
	createReminder,
	approve,
	reject,
	cancel,
} from "./data";
import { enablePush } from "./push";
import type { User, Reminder, Frequency } from "./types";
import "./style.css";

// --- Helpers ---
const fmt = (n: number) =>
	new Date(n).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
const freqLabel = (f: string) => f.replaceAll("_", " ").toLowerCase();

// --- Components ---
function AuthPage({ onAuthed }: { onAuthed: (u: User) => void }) {
	const nav = useNavigate();
	const [mode, setMode] = useState<"login" | "signup">("login");
	const [isLoading, setIsLoading] = useState(false);
	const [f, setF] = useState({
		name: "",
		email: "",
		password: "",
		invite: "",
	});
	const [error, setError] = useState("");

	// --- Password Requirements Logic ---
	const requirements = {
		length: f.password.length >= 8,
		hasNumber: /\d/.test(f.password),
		hasUpper: /[A-Z]/.test(f.password),
		hasSpecial: /[^A-Za-z0-9]/.test(f.password),
	};

	const isPasswordValid = Object.values(requirements).every(Boolean);

	const handleSubmit = async (ev: React.FormEvent) => {
		ev.preventDefault();
		setError("");
		setIsLoading(true);
		try {
			if (mode === "signup") {
				// signup() now returns the freshly-created profile once the
				// Firestore users/{uid} doc is guaranteed to exist. We hand
				// it straight to App's user state instead of navigating and
				// waiting for onAuthStateChanged to fire and re-fetch it —
				// that listener could otherwise fire too early (right after
				// createUserWithEmailAndPassword resolves, but before the
				// Firestore transaction inside signup() had committed) and
				// see a null profile, kicking us right back to this page.
				const newUser = await signup(
					f.name,
					f.email,
					f.password,
					f.invite,
				);
				alert("🎉 Account created successfully!");
				onAuthed(newUser);
			} else {
				// Login is safe to leave on watchAuth: by the time someone
				// logs in, their profile doc was already created during a
				// prior signup, so there's no race to worry about here.
				await login(f.email, f.password);
				nav("/");
			}
		} catch (x: any) {
			setError(x.message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="auth">
			<div className="card authCard">
				<div className="logo">💌</div>
				<h1>Friend Reminder</h1>
				<p className="muted">
					A tiny private circle for up to five people.
				</p>
				<form onSubmit={handleSubmit}>
					{mode === "signup" && (
						<input
							placeholder="Name"
							required
							value={f.name}
							onChange={(x) =>
								setF({ ...f, name: x.target.value })
							}
						/>
					)}
					<input
						type="email"
						placeholder="Email"
						required
						value={f.email}
						onChange={(x) => setF({ ...f, email: x.target.value })}
					/>

					<div className="password-container">
						<input
							type="password"
							placeholder="Password"
							required
							value={f.password}
							onChange={(x) =>
								setF({ ...f, password: x.target.value })
							}
						/>

						{/* Password Requirements Checklist */}
						{mode === "signup" && (
							<div className="password-hints">
								<p className="hint-title">
									Password must have:
								</p>
								<div
									className={`hint-item ${requirements.length ? "valid" : ""}`}
								>
									<span>✓</span> At least 8 characters
								</div>
								<div
									className={`hint-item ${requirements.hasNumber ? "valid" : ""}`}
								>
									<span>✓</span> At least one number
								</div>
								<div
									className={`hint-item ${requirements.hasUpper ? "valid" : ""}`}
								>
									<span>✓</span> At least one uppercase letter
								</div>
								<div
									className={`hint-item ${requirements.hasSpecial ? "valid" : ""}`}
								>
									<span>✓</span> At least one special
									character (!@#$)
								</div>
							</div>
						)}
					</div>

					{mode === "signup" && (
						<input
							placeholder="Invite code (empty for owner)"
							value={f.invite}
							onChange={(x) =>
								setF({
									...f,
									invite: x.target.value.toUpperCase(),
								})
							}
						/>
					)}

					{error && <div className="error">{error}</div>}

					<button
						disabled={
							isLoading || (mode === "signup" && !isPasswordValid)
						}
					>
						{isLoading
							? "Processing..."
							: mode === "signup"
								? "Create account"
								: "Login"}
					</button>
				</form>
				<button
					className="linkBtn"
					onClick={() =>
						setMode(mode === "login" ? "signup" : "login")
					}
				>
					{mode === "login" ? "Create an account" : "Back to login"}
				</button>
			</div>
		</div>
	);
}

function Layout({ children }: { user: User; children: React.ReactNode }) {
	const nav = useNavigate();
	return (
		<div className="app">
			<header>
				<Link to="/" className="brand">
					💌 Friend Reminder
				</Link>
				<nav>
					{[
						["/", "Home"],
						["/reminders", "Reminders"],
						["/requests", "Requests"],
						["/members", "Members"],
						["/settings", "Settings"],
					].map(([p, n]) => (
						<NavLink key={p} to={p} end={p === "/"}>
							{n}
						</NavLink>
					))}
				</nav>
				<button
					className="secondary"
					onClick={async () => {
						await logout();
						nav("/login");
					}}
				>
					Logout
				</button>
			</header>
			<main>{children}</main>
			<footer>
				{[
					["/", "⌂"],
					["/reminders", "🔔"],
					["/requests", "💌"],
					["/members", "👥"],
					["/settings", "⚙"],
				].map(([p, n]) => (
					<Link key={p} to={p}>
						{n}
					</Link>
				))}
			</footer>
		</div>
	);
}

function ReminderCard({
	r,
	user,
	reload,
}: {
	r: Reminder;
	user: User;
	reload: () => void;
}) {
	return (
		<div className="card">
			<div className="row">
				<div>
					<h3>{r.message}</h3>
					<p className="muted">
						{r.creatorId === user.id
							? `For ${r.receiverName}`
							: `From ${r.creatorName}`}{" "}
						· {freqLabel(r.frequency)}
					</p>
					{r.status === "ACTIVE" && (
						<p className="muted">Next: {fmt(r.nextRunAt)}</p>
					)}
				</div>
				<span className={"pill " + r.status.toLowerCase()}>
					{r.status}
				</span>
			</div>
			{r.status === "ACTIVE" &&
				(r.creatorId === user.id || r.receiverId === user.id) && (
					<button
						className="danger"
						onClick={async () => {
							await cancel(r.id);
							reload();
						}}
					>
						Cancel
					</button>
				)}
		</div>
	);
}

function Dashboard({ user }: { user: User }) {
	const [rs, setRs] = useState<Reminder[]>([]);
	useEffect(() => {
		reminders(user.circleId).then(setRs);
	}, []);

	return (
		<>
			<div className="hero">
				<div>
					<h1>Good evening, {user.name} 👋</h1>
					<p className="muted">
						Your private little reminder circle.
					</p>
				</div>
				<Link className="primary" to="/new">
					+ New reminder
				</Link>
			</div>
			<div className="grid">
				<div className="card">
					<h3>💌 Requests</h3>
					<b className="big">
						{
							rs.filter(
								(r) =>
									r.receiverId === user.id &&
									r.status === "PENDING",
							).length
						}
					</b>
					<Link to="/requests">Review →</Link>
				</div>
				<div className="card">
					<h3>🔔 Active</h3>
					<b className="big">
						{rs.filter((r) => r.status === "ACTIVE").length}
					</b>
					<Link to="/reminders">View →</Link>
				</div>
			</div>
			<div className="stack">
				{rs
					.filter((r) => r.status === "ACTIVE")
					.slice(0, 5)
					.map((r) => (
						<ReminderCard
							key={r.id}
							r={r}
							user={user}
							reload={() => reminders(user.circleId).then(setRs)}
						/>
					))}
			</div>
		</>
	);
}

function RemindersPage({ user }: { user: User }) {
	const [rs, setRs] = useState<Reminder[]>([]);
	const load = () => reminders(user.circleId).then(setRs);
	useEffect(() => {
		load();
	}, []);
	return (
		<>
			<div className="hero">
				<h1>My Reminders</h1>
				<Link className="primary" to="/new">
					+ New
				</Link>
			</div>
			<div className="stack">
				{rs.length ? (
					rs.map((r) => (
						<ReminderCard
							key={r.id}
							r={r}
							user={user}
							reload={load}
						/>
					))
				) : (
					<div className="card muted">No reminders yet.</div>
				)}
			</div>
		</>
	);
}

function RequestsPage({ user }: { user: User }) {
	const [rs, setRs] = useState<Reminder[]>([]);
	const load = () =>
		reminders(user.circleId).then((x) =>
			setRs(
				x.filter(
					(r) => r.receiverId === user.id && r.status === "PENDING",
				),
			),
		);
	useEffect(() => {
		load();
	}, []);
	return (
		<>
			<h1>Reminder Requests</h1>
			<div className="stack">
				{rs.length ? (
					rs.map((r) => (
						<div className="card" key={r.id}>
							<span className="pill pending">PENDING</span>
							<h3>💌 From {r.creatorName}</h3>
							<p className="message">{r.message}</p>
							<p className="muted">{freqLabel(r.frequency)}</p>
							<div className="actions">
								<button
									onClick={async () => {
										await approve(r.id);
										load();
									}}
								>
									Accept
								</button>
								<button
									className="secondary"
									onClick={async () => {
										await reject(r.id);
										load();
									}}
								>
									Reject
								</button>
							</div>
						</div>
					))
				) : (
					<div className="card muted">No pending requests.</div>
				)}
			</div>
		</>
	);
}

function MembersPage({ user }: { user: User }) {
	const [ms, setMs] = useState<User[]>([]);
	const [code, setCode] = useState("");
	const load = () => members(user.circleId).then(setMs);
	useEffect(() => {
		load();
	}, []);
	return (
		<>
			<div className="hero">
				<div>
					<h1>Our Circle ❤️</h1>
					<p className="muted">{ms.length}/5 members</p>
				</div>
				{user.owner && ms.length < 5 && (
					<button
						onClick={async () =>
							setCode(await createInvite(user.circleId))
						}
					>
						+ Invite
					</button>
				)}
			</div>
			{code && (
				<div className="notice">
					Invite code: <b>{code}</b>
				</div>
			)}
			<div className="stack">
				{ms.map((m) => (
					<div className="card row" key={m.id}>
						<div>
							<b>{m.name}</b>
							<div className="muted">{m.email}</div>
						</div>
						{m.id === user.id && (
							<span className="pill active">YOU</span>
						)}
					</div>
				))}
			</div>
		</>
	);
}

function NewPage({ user }: { user: User }) {
	const nav = useNavigate();
	const [ms, setMs] = useState<User[]>([]);
	const [f, setF] = useState({
		message: "",
		receiverId: user.id,
		frequency: "EVERY_30_MINUTES" as Frequency,
		startAt: new Date(Date.now() + 60000).toISOString().slice(0, 16),
		endAt: "",
	});
	const [e, setE] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		members(user.circleId).then(setMs);
	}, []);

	const handleSubmit = async (ev: React.FormEvent) => {
		ev.preventDefault();
		setIsLoading(true);
		setE("");
		try {
			await createReminder(user.circleId, {
				message: f.message.trim(),
				receiverId: f.receiverId,
				frequency: f.frequency,
				startAt: new Date(f.startAt).getTime(),
				endAt: f.endAt ? new Date(f.endAt).getTime() : null,
			});
			alert("🎉 Reminder created!");
			nav("/reminders");
		} catch (x: any) {
			setE(x.message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<h1>New Reminder 💌</h1>
			<div className="card formCard">
				<form onSubmit={handleSubmit}>
					<label>
						Message
						<textarea
							required
							maxLength={200}
							value={f.message}
							onChange={(x) =>
								setF({ ...f, message: x.target.value })
							}
						/>
					</label>
					<label>
						For
						<select
							value={f.receiverId}
							onChange={(x) =>
								setF({ ...f, receiverId: x.target.value })
							}
						>
							{ms.map((m) => (
								<option key={m.id} value={m.id}>
									{m.id === user.id ? "Myself" : m.name}
								</option>
							))}
						</select>
					</label>
					<label>
						Repeat
						<select
							value={f.frequency}
							onChange={(x) =>
								setF({
									...f,
									frequency: x.target.value as Frequency,
								})
							}
						>
							<option value="ONCE">Once</option>
							<option value="EVERY_30_MINUTES">
								Every 30 minutes
							</option>
							<option value="EVERY_HOUR">Every hour</option>
							<option value="DAILY">Daily</option>
						</select>
					</label>
					<label>
						Start
						<input
							type="datetime-local"
							required
							value={f.startAt}
							onChange={(x) =>
								setF({ ...f, startAt: x.target.value })
							}
						/>
					</label>
					<label>
						End (optional)
						<input
							type="datetime-local"
							value={f.endAt}
							onChange={(x) =>
								setF({ ...f, endAt: x.target.value })
							}
						/>
					</label>
					{e && <div className="error">{e}</div>}
					<button disabled={isLoading}>
						{isLoading ? "Creating..." : "Create reminder"}
					</button>
				</form>
			</div>
		</>
	);
}

function Settings({ user }: { user: User }) {
	const [msg, setMsg] = useState("");
	const [enabled, setEnabled] = useState(false);
	const [checking, setChecking] = useState(true);

	useEffect(() => {
		hasActiveDevice()
			.then(setEnabled)
			.finally(() => setChecking(false));
	}, []);

	return (
		<>
			<h1>Settings</h1>
			<div className="card">
				<h3>Notifications</h3>
				<p className="muted">
					Enable push once on each device. The app does not need to
					stay open.
				</p>
				{checking ? (
					<p className="muted">Checking…</p>
				) : enabled ? (
					<div className="notice">
						Notifications enabled on this device ✅
					</div>
				) : (
					<button
						onClick={async () => {
							try {
								await enablePush((t, b) =>
									setMsg(`${t}: ${b}`),
								);
								setEnabled(true);
								setMsg(
									"Notifications enabled on this device ✅",
								);
							} catch (e: any) {
								setMsg(e.message);
							}
						}}
					>
						Enable notifications
					</button>
				)}
				{msg && !enabled && <div className="notice">{msg}</div>}
			</div>
			<div className="card">
				<h3>Your account</h3>
				<p>{user.name}</p>
				<p className="muted">{user.email}</p>
			</div>
		</>
	);
}

function App() {
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		watchAuth(async (f) => {
			setUser(f ? await profile(f.uid) : null);
			setLoading(false);
		});
	}, []);

	if (loading) return <div className="center">Loading…</div>;
	if (!user)
		return (
			<Routes>
				{/* onAuthed lets AuthPage set the user directly right after
					signup, without waiting on watchAuth's listener (which can
					fire before the Firestore profile doc is actually written
					— see the comment in AuthPage's handleSubmit). */}
				<Route path="*" element={<AuthPage onAuthed={setUser} />} />
			</Routes>
		);

	return (
		<Layout user={user}>
			<Routes>
				<Route path="/" element={<Dashboard user={user} />} />
				<Route
					path="/reminders"
					element={<RemindersPage user={user} />}
				/>
				<Route
					path="/requests"
					element={<RequestsPage user={user} />}
				/>
				<Route path="/members" element={<MembersPage user={user} />} />
				<Route path="/new" element={<NewPage user={user} />} />
				<Route path="/settings" element={<Settings user={user} />} />
				<Route path="*" element={<Dashboard user={user} />} />
			</Routes>
		</Layout>
	);
}

createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<HashRouter>
			<App />
		</HashRouter>
	</React.StrictMode>,
);
