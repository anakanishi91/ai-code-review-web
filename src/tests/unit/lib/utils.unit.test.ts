/**
 * @jest-environment node
 */

import { z } from 'zod';

import { chatModels, programmingLanguages } from '@/lib/constants';
import { ApiError } from '@/lib/errors';
import {
  cn,
  fetcher,
  fetchWithInit,
  fetchWithSchema,
  generateUUID,
  isChatModelId,
  isProgrammingLanguageType,
  streamPlainText,
} from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      const result = cn('foo', 'bar', { baz: true, qux: false });
      expect(result).toContain('foo');
      expect(result).toContain('bar');
      expect(result).toContain('baz');
      expect(result).not.toContain('qux');
    });
  });

  describe('generateUUID', () => {
    it('generates a UUID of correct format', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });
  });

  describe('fetcher', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('returns parsed JSON when response is ok', async () => {
      (fetch as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify({ data: 123 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const result = await fetcher<{ data: number }>('/test');
      expect(result).toEqual({ data: 123 });
    });

    it('throws ApiError if fetch rejects', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('fail'));

      await expect(fetcher('/fail')).rejects.toBeInstanceOf(ApiError);
    });

    it('throws ApiError if response not ok with error body', async () => {
      (fetch as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify({ error_code: 'FORBIDDEN', message: 'no access' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      await expect(fetcher('/error')).rejects.toMatchObject({
        errorCode: 'FORBIDDEN',
        message: 'no access',
        statusCode: 403,
      });
    });

    it('throws UNKNOWN_ERROR if response not ok but body not JSON', async () => {
      (fetch as jest.Mock).mockResolvedValue(new Response('not-json', { status: 500 }));

      await expect(fetcher('/error')).rejects.toMatchObject({
        errorCode: 'UNKNOWN_ERROR',
        statusCode: 500,
      });
    });
  });

  describe('fetchWithInit', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('returns JSON when response is ok', async () => {
      (fetch as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const result = await fetchWithInit('/url', {});
      expect(result).toEqual({ ok: true });
    });

    it('throws ApiError on error response', async () => {
      (fetch as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify({ error_code: 'UNAUTHORIZED', message: 'nope' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      await expect(fetchWithInit('/url', {})).rejects.toMatchObject({
        errorCode: 'UNAUTHORIZED',
        message: 'nope',
        statusCode: 401,
      });
    });
  });

  describe('fetchWithSchema', () => {
    const schema = z.object({ name: z.string() });

    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('parses data correctly when valid', async () => {
      (fetch as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify({ name: 'test' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const result = await fetchWithSchema('/url', {}, schema);
      expect(result).toEqual({ name: 'test' });
    });

    it('throws ApiError on validation error', async () => {
      (fetch as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify({ invalid: 'data' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      await expect(fetchWithSchema('/url', {}, schema)).rejects.toBeInstanceOf(ApiError);
    });
  });

  describe('isChatModelId', () => {
    it('returns true for valid ChatModelId', () => {
      const id = chatModels[0].id;
      expect(isChatModelId(id)).toBe(true);
    });

    it('returns false for invalid id', () => {
      expect(isChatModelId('invalid')).toBe(false);
    });
  });

  describe('isProgrammingLanguageType', () => {
    it('returns true for valid programming language', () => {
      const id = programmingLanguages[0].id;
      expect(isProgrammingLanguageType(id)).toBe(true);
    });

    it('returns false for invalid id', () => {
      expect(isProgrammingLanguageType('invalid')).toBe(false);
    });
  });

  describe('streamPlainText', () => {
    it('calls onChunk for each chunk', async () => {
      const chunks = ['hello', ' ', 'world'];
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
          controller.close();
        },
      });
      const response = new Response(stream, { status: 200 });

      const mockOnChunk = jest.fn();
      await streamPlainText(response, mockOnChunk);

      expect(mockOnChunk.mock.calls.flat()).toEqual(chunks);
    });

    it('throws ApiError if response not ok with JSON error', async () => {
      const response = new Response(
        JSON.stringify({ error_code: 'API_ERROR', message: 'Stream error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );

      await expect(streamPlainText(response, jest.fn())).rejects.toMatchObject({
        errorCode: 'API_ERROR',
        message: 'Stream error',
        statusCode: 500,
      });
    });

    it('throws ApiError if response body is missing', async () => {
      const response = new Response(null, { status: 200 });
      await expect(streamPlainText(response, jest.fn())).rejects.toBeInstanceOf(ApiError);
    });
  });
});
