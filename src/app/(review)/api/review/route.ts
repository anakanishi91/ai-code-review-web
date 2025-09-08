import { auth } from '@/app/(auth)/auth';
import { createReview, deleteReview } from '@/lib/api/review';
import { ApiError } from '@/lib/errors';

import { postRequestBodySchema, type PostRequestBody } from './schema';

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch {
    return new ApiError('VALIDATION_ERROR').toResponse();
  }

  try {
    const { id, code, review, modelId, languageType } = requestBody;

    const session = await auth();

    if (!session?.user || !session.accessToken) {
      return new ApiError('UNAUTHORIZED').toResponse();
    }

    const res = await createReview({
      id,
      code,
      chatModelId: modelId,
      programmingLanguage: languageType,
      review,
      token: session.accessToken,
    });
    return Response.json(res);
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    return new ApiError('UNKNOWN_ERROR').toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ApiError('VALIDATION_ERROR').toResponse();
  }

  const session = await auth();

  if (!session?.user || !session?.accessToken) {
    return new ApiError('UNAUTHORIZED').toResponse();
  }

  await deleteReview(id, session.accessToken);

  return Response.json({ status: 200 });
}
