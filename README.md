# Friend Reminder 💌

A tiny invite-only PWA for a private circle of up to five people.

## Architecture

- React + TypeScript + Vite
- GitHub Pages for the frontend
- Firebase Authentication (email/password)
- Firebase Cloud Firestore for users, circle, reminders and device tokens
- Firebase Cloud Messaging for web push
- GitHub Actions for the reminder scheduler
- **No Firebase Cloud Functions**

The intended zero-cost setup is a **public GitHub repository**: GitHub-hosted Actions are free for public repositories. Firebase Spark provides no-cost Authentication, FCM and Firestore quotas. Firebase states that Spark does not require payment information; if a Spark quota is exceeded, that product is shut off for the remainder of the month rather than automatically becoming billed.

## Important timing note

The scheduler runs every 5 minutes. GitHub Actions scheduled workflows are not real-time guarantees, so a reminder can arrive a little late. For a fun five-person app this is intentional.

## Firebase setup

1. Create a Firebase project and keep it on the **Spark** plan.
2. Enable Authentication → Email/Password.
3. Create Firestore Database.
4. Add a Web App and copy its browser config.
5. In Project Settings → Cloud Messaging, create a Web Push certificate/key pair and copy the VAPID key.
6. Deploy `firestore.rules` from the Firebase CLI or console.
7. Create a Firebase service account JSON for the GitHub Actions scheduler. Do **not** commit it.

## GitHub setup

For the simplest no-billing setup, make the repository public. GitHub says standard Actions runners are free for public repositories. Private GitHub Free repositories have 2,000 included minutes/month and additional usage can be billed, so this project intentionally recommends public for the scheduler.

Add these repository Actions secrets:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_VAPID_KEY`
- `FIREBASE_SERVICE_ACCOUNT_JSON` — complete service-account JSON, kept secret

Enable GitHub Pages → Source: GitHub Actions.

Set an optional repository variable `APP_URL` to the deployed Pages URL (for example `https://USER.github.io/REPO/`). The scheduler also works without it, but setting it makes notification clicks open the app directly.

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

Put the Firebase browser config and VAPID key into `.env`.

## End-to-end test

1. Create the first account without an invite. This account owns the circle.
2. Generate an invite code from Members.
3. Create a second account in another browser/incognito window using the invite code.
4. User A creates a reminder for User B.
5. B sees it as PENDING and accepts it.
6. Enable notifications on B's device.
7. Wait for the GitHub Actions scheduler to process it.
8. B should receive a push notification even when the PWA tab is closed.
9. Cancel the reminder and verify later scheduler runs do not send it again.

## Privacy

Firestore Security Rules restrict users to their own private circle and to reminders where they are the creator or receiver. GitHub Actions uses a Firebase service-account secret; that credential must never be placed in the frontend.
