import { auth } from '@/app/(auth)/auth';
import { createReviewWithAI } from '@/lib/api/review';
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
    const { id, code, modelId, languageType } = requestBody;

    const session = await auth();

    if (!session?.user || !session.accessToken) {
      return new ApiError('UNAUTHORIZED').toResponse();
    }

    const res = await createReviewWithAI({
      id,
      code,
      chatModelId: modelId,
      programmingLanguage: languageType,
      token: session.accessToken,
    });
    return new Response(res.body, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    return new ApiError('UNKNOWN_ERROR').toResponse();
  }
}
