/**
 * @jest-environment node
 */

import { auth } from '@/app/(auth)/auth';
import { POST, DELETE } from '@/app/(review)/api/review/route';
import { createReview, deleteReview } from '@/lib/api/review';
import { generateUUID } from '@/lib/utils';

jest.mock('@/app/(auth)/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/api/review');

const mockedAuth = auth as jest.Mock;
const mockedCreateReview = createReview as jest.Mock;
const mockedDeleteReview = deleteReview as jest.Mock;

describe('API Route: /review', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('POST', () => {
    it('returns 200 and review data on success', async () => {
      const id = generateUUID();
      const requestBody = {
        id: id,
        code: 'console.log("test");',
        review: 'Good code',
        modelId: 'gpt-4o-mini',
        languageType: 'python',
      };

      mockedAuth.mockResolvedValue({
        user: { id: 'user1' },
        accessToken: 'token',
      });

      mockedCreateReview.mockResolvedValue({ reviewId: id });

      const request = new Request('http://localhost/api/review', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ reviewId: id });
      expect(mockedCreateReview).toHaveBeenCalledWith({
        id: id,
        code: 'console.log("test");',
        review: 'Good code',
        chatModelId: 'gpt-4o-mini',
        programmingLanguage: 'python',
        token: 'token',
      });
    });

    it('returns 401 if user is not authenticated', async () => {
      mockedAuth.mockResolvedValue(null);

      const id = generateUUID();

      const request = new Request('http://localhost/api/review', {
        method: 'POST',
        body: JSON.stringify({
          id: id,
          code: 'console.log("test");',
          review: 'Good code',
          modelId: 'gpt-4o-mini',
          languageType: 'python',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.errorCode).toBe('UNAUTHORIZED');
    });
  });

  describe('DELETE', () => {
    it('returns 200 when delete succeeds', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'user1' },
        accessToken: 'token',
      });

      mockedDeleteReview.mockResolvedValue(undefined);

      const request = new Request('http://localhost/api/review?id=123', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ status: 200 });
      expect(mockedDeleteReview).toHaveBeenCalledWith('123', 'token');
    });

    it('returns 400 if no id is provided', async () => {
      const request = new Request('http://localhost/api/review', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.errorCode).toBe('VALIDATION_ERROR');
    });
  });
});
