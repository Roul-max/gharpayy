import { z } from 'zod';

export const signedUploadSchema = z.object({
  body: z.object({
    bucket: z.enum(['property-images', 'owner-documents', 'user-avatars']),
    folder: z.string().min(1),
    filename: z.string().min(1),
    contentType: z.string().min(1),
    expiresIn: z.number().int().min(60).max(3600).optional()
  })
});
