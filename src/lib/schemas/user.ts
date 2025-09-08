import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.email(),
});

export type User = z.infer<typeof UserSchema>;

export const UserWithTokenSchema = UserSchema.extend({
  accessToken: z.string(),
});

export type UserWithToken = z.infer<typeof UserWithTokenSchema>;
