/**
 * WebAuthn relying-party config for accounts (#35).
 *
 * A passkey's RP ID is bound to the exact domain it was registered under —
 * this is a WebAuthn spec constraint, not a config choice (see issue #35,
 * "Open decision #1"). entotools.com is the canonical account domain; a
 * credential registered there cannot be used to log in on entotools.org.
 * Both apex and www resolve under RP ID "entotools.com" since both are valid
 * origins for that RP ID.
 *
 * Local dev is a genuine WebAuthn exception (the spec allows http://localhost
 * for testing), so it gets its own RP ID rather than trying to force
 * "entotools.com" to work over plain HTTP.
 */
export function rpConfigFor(url) {
  const host = url.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return { rpID: 'localhost', origin: 'http://localhost:8788' };
  }
  return {
    rpID: 'entotools.com',
    origin: ['https://entotools.com', 'https://www.entotools.com'],
  };
}

// Decode the challenge embedded in a WebAuthn response's clientDataJSON,
// without needing to run full verification first — used to look up which
// pending challenge (and its stashed registration/login context) this
// response is answering.
export function decodeClientDataChallenge(credential) {
  const clientDataJSON = credential && credential.response && credential.response.clientDataJSON;
  if (!clientDataJSON) return null;
  try {
    const json = JSON.parse(base64UrlDecodeToString(clientDataJSON));
    return json.challenge || null;
  } catch (e) {
    return null;
  }
}

function base64UrlDecodeToString(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  return binary;
}
