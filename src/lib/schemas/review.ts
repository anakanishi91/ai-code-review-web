import { z } from 'zod';

import { chatModels, programmingLanguages } from '../constants';

export const ReviewSchema = z.object({
  id: z.string(),
  createdAt: z.preprocess((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }, z.date()),
  code: z.string(),
  review: z.string(),
  chatModelId: z.enum(chatModels.map((e) => e.id)),
  programmingLanguage: z.enum(programmingLanguages.map((e) => e.id)),
});

export const ReviewsArraySchema = z.object({
  reviews: z.array(ReviewSchema),
  hasMore: z.boolean(),
});

export type Review = z.infer<typeof ReviewSchema>;

export type ReviewsArraySchema = z.infer<typeof ReviewsArraySchema>;
