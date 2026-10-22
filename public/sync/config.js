/**
 * EntoTools — Cloud Sync configuration
 *
 * The Google OAuth *client ID* is public and safe to embed in client-side code.
 * (No client secret is used — this is the implicit token flow via Google Identity Services.)
 *
 * Setup (one-time, see README "Cloud Backup"):
 *   1. Google Cloud Console → enable "Google Drive API".
 *   2. Configure the OAuth consent screen (External), scope: .../auth/drive.file.
 *   3. Create an OAuth Client ID (type: Web application).
 *      Authorized JavaScript origins:
 *        https://entotools.com
 *        http://localhost:8788   (wrangler pages dev)
 *   4. Paste the client ID below.
 */
window.ENTO_GOOGLE_CLIENT_ID = window.ENTO_GOOGLE_CLIENT_ID || '427532223396-saf8ajbec68kv35pn96fbn9knlqve1fa.apps.googleusercontent.com';
