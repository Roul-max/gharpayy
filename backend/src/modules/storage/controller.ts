import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { storageService } from './service.js';

export const storageController = {
  async signedUpload(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await storageService.createSignedUploadUrl({
        bucket: req.body.bucket,
        folder: req.body.folder,
        filename: req.body.filename,
        contentType: req.body.contentType,
        expiresIn: req.body.expiresIn
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};
