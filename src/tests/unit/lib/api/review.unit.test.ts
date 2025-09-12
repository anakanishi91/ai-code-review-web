/**
 * @jest-environment node
 */

import {
  createReview,
  createReviewWithAI,
  getReviewById,
  getReviews,
  deleteReview,
} from '@/lib/api/review';
import { ApiError } from '@/lib/errors';
import { ReviewSchema, ReviewsArraySchema } from '@/lib/schemas/review';
import { fetchWithSchema, fetchWithInit } from '@/lib/utils';

jest.mock('@/lib/utils', () => ({
  fetchWithSchema: jest.fn(),
  fetchWithInit: jest.fn(),
}));

describe('review api', () => {
  const mockedFetchWithSchema = fetchWithSchema as jest.Mock;
  const mockedFetchWithInit = fetchWithInit as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    it('calls fetchWithSchema with correct args', async () => {
      const fakeReview = { id: '1', code: 'console.log("hi")' };
      mockedFetchWithSchema.mockResolvedValue(fakeReview);

      const result = await createReview({
        id: '1',
        code: 'console.log("hi")',
        chatModelId: 'gpt-4',
        programmingLanguage: 'typescript',
        review: 'Looks good!',
        token: 'abc',
      });

      expect(mockedFetchWithSchema).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/reviews/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer abc',
          },
          body: JSON.stringify({
            id: '1',
            code: 'console.log("hi")',
            chatModelId: 'gpt-4',
            programmingLanguage: 'typescript',
            review: 'Looks good!',
          }),
          cache: 'no-store',
        },
        ReviewSchema,
      );
      expect(result).toBe(fakeReview);
    });
  });

  describe('createReviewWithAI', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('returns response when ok', async () => {
      const mockRes = new Response('ok', { status: 200 });
      (global.fetch as jest.Mock).mockResolvedValue(mockRes);

      const result = await createReviewWithAI({
        id: '1',
        code: 'console.log("ai")',
        chatModelId: 'gpt-4',
        programmingLanguage: 'typescript',
        token: 'abc',
      });

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/reviews/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer abc',
        },
        body: JSON.stringify({
          id: '1',
          code: 'console.log("ai")',
          chatModelId: 'gpt-4',
          programmingLanguage: 'typescript',
        }),
        cache: 'no-store',
      });
      expect(result).toBe(mockRes);
    });

    it('throws ApiError when not ok', async () => {
      const mockRes = new Response(
        JSON.stringify({ error_code: 'NOT_FOUND', message: 'not found' }),
        { status: 404 },
      );
      (global.fetch as jest.Mock).mockResolvedValue(mockRes);

      await expect(
        createReviewWithAI({
          id: 'x',
          code: 'bad',
          chatModelId: 'gpt-4',
          programmingLanguage: 'ts',
          token: 'badtoken',
        }),
      ).rejects.toBeInstanceOf(ApiError);
    });
  });

  describe('getReviewById', () => {
    it('calls fetchWithSchema with correct args', async () => {
      const fakeReview = { id: '123', code: 'code here' };
      mockedFetchWithSchema.mockResolvedValue(fakeReview);

      const result = await getReviewById('123', 'abc');

      expect(mockedFetchWithSchema).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/reviews/123',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer abc' },
          cache: 'no-store',
        },
        ReviewSchema,
      );
      expect(result).toBe(fakeReview);
    });
  });

  describe('getReviews', () => {
    it('calls fetchWithSchema with correct query params', async () => {
      const fakeReviews = [{ id: '1' }, { id: '2' }];
      mockedFetchWithSchema.mockResolvedValue(fakeReviews);

      const result = await getReviews({
        limit: 10,
        startingAfter: 'a',
        endingBefore: 'b',
        token: 'abc',
      });

      expect(mockedFetchWithSchema).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/reviews/?limit=10&starting_after=a&ending_before=b',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer abc' },
          cache: 'no-store',
        },
        ReviewsArraySchema,
      );
      expect(result).toBe(fakeReviews);
    });
  });

  describe('deleteReview', () => {
    it('calls fetchWithInit with correct args', async () => {
      mockedFetchWithInit.mockResolvedValue(undefined);

      await deleteReview('123', 'abc');

      expect(mockedFetchWithInit).toHaveBeenCalledWith('http://localhost:8000/api/v1/reviews/123', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer abc' },
        cache: 'no-store',
      });
    });
  });
});
