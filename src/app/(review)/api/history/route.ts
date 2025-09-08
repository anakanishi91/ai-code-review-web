import type { NextRequest } from 'next/server';

import { auth } from '@/app/(auth)/auth';
import { getReviews } from '@/lib/api/review';
import { ApiError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Number.parseInt(searchParams.get('limit') || '10');
  const startingAfter = searchParams.get('starting_after');
  const endingBefore = searchParams.get('ending_before');

  if (startingAfter && endingBefore) {
    return new ApiError(
      'VALIDATION_ERROR',
      'Only one of starting_after or ending_before can be provided.',
    ).toResponse();
  }

  const session = await auth();

  if (!session?.user || !session?.accessToken) {
    return new ApiError('UNAUTHORIZED').toResponse();
  }

  const res = await getReviews({
    limit,
    startingAfter,
    endingBefore,
    token: session.accessToken,
  });

  return Response.json(res);
}
