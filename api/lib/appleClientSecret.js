// api/lib/appleClientSecret.js
// Signs a short-lived client secret JWT for Apple Sign In token/revoke APIs.
import jwt from 'jsonwebtoken';

const APPLE_CLIENT_ID = 'com.charliehanson.alimenta';

export function generateAppleClientSecret() {
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!teamId || !keyId || !privateKey) {
    throw new Error(
      'Missing Apple Sign In env vars (APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY)'
    );
  }

  return jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    expiresIn: '180d',
    audience: 'https://appleid.apple.com',
    issuer: teamId,
    subject: APPLE_CLIENT_ID,
    keyid: keyId,
  });
}
