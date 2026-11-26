# VIBRA WORLDWIDE — Firebase release readiness

## Current implementation on this branch

- Firebase Authentication is used for email/password and Google sign-in.
- Firestore is used by the feed and social actions for video metadata, likes, comments, follows, saved videos and notifications.
- Firebase Storage is used by the video and profile-photo upload flows.
- VIBRA AI calls Gemini through Firebase AI Logic; the Firebase project owner must enable the service in the Firebase Console.
- GitHub Actions runs the production build. A passing build confirms compilation only; it does not prove Firebase permissions, account flows, media playback or real-device behavior.
- The project is currently a hosted web/PWA app. No signed Android App Bundle or Play Store release is included.
- Supabase is not the selected backend and must not be reintroduced.

## Required Firebase Console setup

For Firebase project `vibra-44dce`:

1. Enable Email/Password and Google providers in Authentication.
2. Create/verify the Firestore database in the intended production region.
3. Enable Firebase Storage and confirm billing/quotas and supported upload limits.
4. Enable Firebase AI Logic with the Gemini Developer API backend.
5. Configure Firebase App Check for the production web app and enforce it after validating legitimate traffic.
6. Deploy restrictive Firestore and Storage rules only after reviewing every client data path. Never use public read/write rules or allow clients to grant themselves admin privileges.

The Firebase web config in the client is public app configuration, not an Admin SDK credential. Never put service-account JSON or private API credentials in the browser or repository.

## Blocking security and product work before public launch

- Review and deploy least-privilege Firestore and Storage rules. Current client operations must be tested against those rules using two separate accounts and an unauthenticated visitor.
- Move sensitive counters, follower totals, moderation state, rewards and any financial records to trusted server-side logic. A client-side increment is not proof of a valid like, view or payout.
- Test signup, login, Google sign-in, logout, password recovery, profile photo, video upload, public feed discovery, playback, likes, comments, follow/unfollow, saves and inbox on real Android devices.
- Fix the current client-side assumptions and error handling found during these tests; do not count a successful deploy as a successful feature test.
- Complete reporting, blocking, content moderation, copyright handling, privacy disclosures, support contact and account deletion before accepting public user-generated content.
- Add reliable cursor pagination, upload retry/resume, file cleanup, abuse limits and operational monitoring.
- LIVE broadcasting is not implemented as a global streaming service. A camera preview alone is not a live broadcast.
- Internationalization is currently incomplete; a two-language toggle is not worldwide language coverage. Add proper translated strings and RTL support before claiming global language support.
- Creator rewards, cash balances, M-Pesa withdrawals and international payouts are not active. Do not show demo coins as real money.
- Ads are not approved or verified as revenue. Do not claim earnings or serve unapproved production ads.

## Android / Google Play

This branch does not produce a signed Android App Bundle. A future Android release needs a maintained native wrapper or app implementation, confirmed package ID, signing-key ownership, Play App Signing, current target SDK, least-privilege permissions, privacy policy, public account-deletion process, Data safety declarations and physical-device release tests. Never commit signing credentials or ask the owner to paste them into chat.

## Release rule

Keep the pull request in Draft until Firebase Console configuration, security rules, build/tests and real-device feature tests are complete. Do not merge or describe VIBRA as production-ready solely because Vercel says Ready.
