import { z } from 'zod';

import { chatModels, programmingLanguages } from '@/lib/constants';

export const postRequestBodySchema = z.object({
  id: z.uuid(),
  code: z.string(),
  modelId: z.enum(chatModels.map((e) => e.id)),
  languageType: z.enum(programmingLanguages.map((e) => e.id)),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
