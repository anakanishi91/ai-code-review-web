import { z } from 'zod';

import { postRequestBodySchema as postRequestBodyBaseSchema } from './ai/schema';

export const postRequestBodySchema = postRequestBodyBaseSchema.extend({
  review: z.string(),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
