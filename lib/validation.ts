import { z } from 'zod';
export const contentSchema = z.object({
  sender: z.string().trim().min(1).max(60),
  recipient: z.string().trim().min(1).max(60),
  occasion: z.enum([
    'An apology',
    'Just because',
    'Birthday',
    'Anniversary',
    'Friendship',
    'Thank you',
  ]),
  message: z.string().trim().min(10).max(3000),
  finalNote: z.string().trim().max(300),
  theme: z.enum(['garden', 'memory', 'universe']),
  music: z.enum([
    'moonbeam',
    'little-moments',
    'stardust',
    'home',
    'new-day',
    'none',
  ]),
  photos: z.array(z.string().regex(/^[a-f0-9]{48}\.jpg$/)).max(5),
});
export const draftSchema = z.object({
  content: contentSchema,
  email: z.email().max(254),
  password: z.string().max(100).default(''),
  consent: z.literal(true),
});
