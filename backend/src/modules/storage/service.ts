import { nanoid } from 'nanoid';
import { supabase } from '../../config/supabase.js';

const ALLOWED_BUCKETS = new Set(['property-images', 'owner-documents', 'user-avatars']);

function sanitizeFilename(filename: string) {
  return filename.replace(/[^\w.\-]+/g, '-').replace(/-+/g, '-').slice(0, 120);
}

export const storageService = {
  async createSignedUploadUrl(input: {
    bucket: string;
    folder: string;
    filename: string;
    contentType: string;
    expiresIn?: number;
  }) {
    if (!ALLOWED_BUCKETS.has(input.bucket)) {
      throw new Error('Bucket not allowed');
    }

    const safeName = sanitizeFilename(input.filename);
    const path = `${input.folder}/${Date.now()}-${nanoid(6)}-${safeName}`;
    const expiresIn = input.expiresIn ?? 7200;

    const { data, error } = await supabase.storage
      .from(input.bucket)
      .createSignedUploadUrl(path, { upsert: false });

    if (error) throw error;

    return {
      bucket: input.bucket,
      path,
      signedUrl: data?.signedUrl,
      token: data?.token,
      expiresIn
    };
  }
};
