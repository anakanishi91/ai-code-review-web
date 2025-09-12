import { ApiError } from '../errors';
import { Review, ReviewsArraySchema, ReviewSchema } from '../schemas/review';
import { fetchWithInit, fetchWithSchema } from '../utils';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000/api/v1';

export async function createReview({
  id,
  code,
  chatModelId,
  programmingLanguage,
  review,
  token,
}: {
  id: string;
  code: string;
  chatModelId: string;
  programmingLanguage: string;
  review: string;
  token: string;
}): Promise<Review> {
  return await fetchWithSchema(
    `${API_BASE_URL}/reviews/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, code, chatModelId, programmingLanguage, review }),
      cache: 'no-store',
    },
    ReviewSchema,
  );
}

export async function createReviewWithAI({
  id,
  code,
  chatModelId,
  programmingLanguage,
  token,
}: {
  id: string;
  code: string;
  chatModelId: string;
  programmingLanguage: string;
  token: string;
}) {
  const res = await fetch(`${API_BASE_URL}/reviews/ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id, code, chatModelId, programmingLanguage }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  return res;
}

export async function getReviewById(id: string, token: string): Promise<Review> {
  return await fetchWithSchema(
    `${API_BASE_URL}/reviews/${id}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    },
    ReviewSchema,
  );
}

export async function getReviews({
  limit,
  startingAfter,
  endingBefore,
  token,
}: {
  limit: number | null;
  startingAfter: string | null;
  endingBefore: string | null;
  token: string;
}): Promise<ReviewsArraySchema> {
  const url = new URL(`${API_BASE_URL}/reviews/`);

  if (limit) url.searchParams.append('limit', limit.toString());
  if (startingAfter) url.searchParams.append('starting_after', startingAfter);
  if (endingBefore) url.searchParams.append('ending_before', endingBefore);

  return await fetchWithSchema(
    url.toString(),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    },
    ReviewsArraySchema,
  );
}

export async function deleteReview(id: string, token: string): Promise<void> {
  await fetchWithInit(`${API_BASE_URL}/reviews/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });
}
