/**
 * @jest-environment node
 */

import { auth } from '@/app/(auth)/auth';
import { POST } from '@/app/(review)/api/review/ai/route';
import { createReviewWithAI } from '@/lib/api/review';
import { ApiError } from '@/lib/errors';
import { generateUUID } from '@/lib/utils';

jest.mock('@/app/(auth)/auth', () => ({
  auth: jest.fn(),
}));
jest.mock('@/lib/api/review');

const mockedAuth = auth as jest.Mock;
const mockedCreateReviewWithAI = createReviewWithAI as jest.Mock;

describe('POST /review (unit tests)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  function createRequest(body: Record<string, unknown>) {
    return new Request('http://localhost/api/review', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('returns event stream when successful', async () => {
    const id = generateUUID();
    const body = {
      id: id,
      code: 'console.log("test");',
      modelId: 'gpt-4o-mini',
      languageType: 'python',
    };

    mockedAuth.mockResolvedValue({ user: { id: 'user1' }, accessToken: 'token' });
    mockedCreateReviewWithAI.mockResolvedValue({ body: 'event-stream-data' });

    const response = await POST(createRequest(body));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/plain');
    const text = await response.text();
    expect(text).toBe('event-stream-data');

    expect(mockedCreateReviewWithAI).toHaveBeenCalledWith({
      id: id,
      code: 'console.log("test");',
      chatModelId: 'gpt-4o-mini',
      programmingLanguage: 'python',
      token: 'token',
    });
  });

  it('returns 401 if auth fails', async () => {
    const id = generateUUID();
    const body = {
      id: id,
      code: 'console.log("test");',
      modelId: 'gpt-4o-mini',
      languageType: 'python',
    };
    mockedAuth.mockResolvedValue(null);

    const response = await POST(createRequest(body));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.errorCode).toBe('UNAUTHORIZED');
  });

  it('returns 400 on validation error', async () => {
    const invalidBody = { invalid: 'data' };
    const response = await POST(createRequest(invalidBody));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errorCode).toBe('VALIDATION_ERROR');
  });

  it('returns ApiError if createReviewWithAI throws', async () => {
    const id = generateUUID();
    const body = {
      id: id,
      code: 'console.log("test");',
      modelId: 'gpt-4o-mini',
      languageType: 'python',
    };
    mockedAuth.mockResolvedValue({ user: { id: 'user1' }, accessToken: 'token' });
    mockedCreateReviewWithAI.mockImplementation(() => {
      throw new ApiError('UNKNOWN_ERROR');
    });

    const response = await POST(createRequest(body));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.errorCode).toBe('UNKNOWN_ERROR');
  });
});
