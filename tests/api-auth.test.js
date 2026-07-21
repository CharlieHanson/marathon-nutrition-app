import { afterEach, describe, expect, it } from 'vitest';
import { getRequestUserId } from '../api/lib/requestUser.js';

describe('API request user helpers', () => {
  const previousRequireAuth = process.env.REQUIRE_AUTH;

  afterEach(() => {
    if (previousRequireAuth === undefined) {
      delete process.env.REQUIRE_AUTH;
    } else {
      process.env.REQUIRE_AUTH = previousRequireAuth;
    }
  });

  it('prefers req.userId set by auth middleware', () => {
    process.env.REQUIRE_AUTH = 'true';
    expect(
      getRequestUserId({
        userId: 'auth-user-1',
        body: { userId: 'spoofed' },
      })
    ).toBe('auth-user-1');
  });

  it('rejects legacy body userId when REQUIRE_AUTH is on', () => {
    process.env.REQUIRE_AUTH = 'true';
    expect(getRequestUserId({ body: { userId: 'legacy-user' } })).toBeNull();
  });

  it('falls back to legacy body userId when REQUIRE_AUTH is off', () => {
    process.env.REQUIRE_AUTH = 'false';
    expect(getRequestUserId({ body: { userId: 'legacy-user' } })).toBe('legacy-user');
  });
});
