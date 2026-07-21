import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../shared/services/getSupabase.web.js', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

import {
  AuthError,
  RateLimitError,
  apiRequest,
  getApiUrl,
  getAuthHeaders,
  getBaseUrl,
  getMealGenApiUrl,
} from '../src/services/api.js';
import { supabase } from '../shared/services/getSupabase.web.js';

describe('frontend API client', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    vi.clearAllMocks();
  });

  it('builds absolute API URLs from NEXT_PUBLIC_API_URL', () => {
    expect(getBaseUrl()).toBe('https://api.example.com');
    expect(getApiUrl('/api/meal-plan')).toBe('https://api.example.com/api/meal-plan');
    expect(getApiUrl('api/profile')).toBe('https://api.example.com/api/profile');
  });

  it('strips trailing slashes from the API origin', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/';
    expect(getBaseUrl()).toBe('https://api.example.com');
  });

  it('throws when NEXT_PUBLIC_API_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(() => getBaseUrl()).toThrow(/NEXT_PUBLIC_API_URL/);
  });

  it('routes meal-gen endpoints to the OpenAI variants', () => {
    expect(getMealGenApiUrl('/api/generate-day')).toBe(
      'https://api.example.com/api/generate-day-openai'
    );
    expect(getMealGenApiUrl('/api/generate-day-web')).toBe(
      'https://api.example.com/api/generate-day-web-openai'
    );
    expect(getMealGenApiUrl('/api/regenerate-meal')).toBe(
      'https://api.example.com/api/regenerate-meal-openai'
    );
  });

  it('exposes AuthError and RateLimitError for UI handling', () => {
    const authErr = new AuthError();
    expect(authErr.name).toBe('AuthError');
    expect(authErr.message).toMatch(/sign in/i);

    const rateErr = new RateLimitError('limit hit', 'daily');
    expect(rateErr.name).toBe('RateLimitError');
    expect(rateErr.limit).toBe('daily');
  });

  it('attaches a Bearer token from the Supabase session', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'test-jwt' } },
      error: null,
    });

    await expect(getAuthHeaders()).resolves.toEqual({
      Authorization: 'Bearer test-jwt',
    });
  });

  it('throws AuthError when there is no session token', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    await expect(getAuthHeaders()).rejects.toBeInstanceOf(AuthError);
  });

  it('maps 401 API responses to AuthError', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'test-jwt' } },
      error: null,
    });

    global.fetch = vi.fn().mockResolvedValue({
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    });

    await expect(apiRequest('https://api.example.com/api/meal-plan')).rejects.toBeInstanceOf(
      AuthError
    );
  });

  it('maps 429 API responses to RateLimitError', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'test-jwt' } },
      error: null,
    });

    global.fetch = vi.fn().mockResolvedValue({
      status: 429,
      json: async () => ({ error: 'Too many requests', limit: 'daily' }),
    });

    await expect(apiRequest('https://api.example.com/api/estimate-macros')).rejects.toMatchObject({
      name: 'RateLimitError',
      limit: 'daily',
    });
  });
});
