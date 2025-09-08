/**
 * @jest-environment node
 */

import { ApiError, getMessageByErrorCode, type ErrorCode } from '@/lib/errors';

describe('ApiError', () => {
  describe('constructor', () => {
    it('sets fields correctly', () => {
      const err = new ApiError('FORBIDDEN', 'Custom message');
      expect(err).toBeInstanceOf(Error);
      expect(err.errorCode).toBe('FORBIDDEN');
      expect(err.message).toBe('Custom message');
      expect(err.statusCode).toBe(403);
      expect(err.detailedMessage).toContain('belongs to another user');
    });

    it('defaults to fallback message', () => {
      const err = new ApiError('UNKNOWN_ERROR');
      expect(err.message).toBeFalsy();
      expect(err.detailedMessage).toBe('Something went wrong. Please try again later.');
      expect(err.statusCode).toBe(500);
    });
  });

  describe('fromResponse', () => {
    it('parses error_code and message from JSON', async () => {
      const res = new Response(JSON.stringify({ error_code: 'NOT_FOUND', message: 'missing' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });

      const err = await ApiError.fromResponse(res);
      expect(err).toBeInstanceOf(ApiError);
      expect(err.errorCode).toBe('NOT_FOUND');
      expect(err.message).toBe('missing');
      expect(err.statusCode).toBe(404);
    });

    it('falls back to UNKNOWN_ERROR if invalid JSON', async () => {
      const res = new Response('not-json', { status: 500 });
      const err = await ApiError.fromResponse(res);

      expect(err.errorCode).toBe('UNKNOWN_ERROR');
      expect(err.message).toBe('');
      expect(err.statusCode).toBe(500);
    });
  });

  describe('toResponse', () => {
    it('returns a Response with correct body and status', async () => {
      const err = new ApiError('UNAUTHORIZED', 'nope');

      const res = err.toResponse();
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body).toMatchObject({
        errorCode: 'UNAUTHORIZED',
        message: 'nope',
      });
    });
  });
});

describe('getMessageByErrorCode', () => {
  const cases: [ErrorCode, string][] = [
    ['VALIDATION_ERROR', "The request couldn't be processed"],
    ['NOT_FOUND', 'was not found'],
    ['FORBIDDEN', 'belongs to another user'],
    ['UNAUTHORIZED', 'sign in'],
    ['NETWORK_ERROR', 'internet connection'],
    ['UNKNOWN_ERROR', 'Something went wrong'],
  ];

  it.each(cases)('returns expected message for %s', (code, expected) => {
    expect(getMessageByErrorCode(code)).toContain(expected);
  });
});
