export type ErrorMetadata = Record<string, unknown>;

export class AppError extends Error {
  statusCode: number;
  errorCode: string;
  metadata?: ErrorMetadata;

  constructor(message: string, statusCode = 500, errorCode = 'INTERNAL_SERVER_ERROR', metadata?: ErrorMetadata) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.metadata = metadata;
  }
}

export function isAppError(error: unknown): error is AppError {
  return typeof error === 'object' && error !== null && 'statusCode' in error && 'errorCode' in error;
}

export function badRequest(message: string, metadata?: ErrorMetadata) {
  return new AppError(message, 400, 'BAD_REQUEST', metadata);
}

export function unauthorized(message: string, metadata?: ErrorMetadata) {
  return new AppError(message, 401, 'UNAUTHORIZED', metadata);
}

export function forbidden(message: string, metadata?: ErrorMetadata) {
  return new AppError(message, 403, 'FORBIDDEN', metadata);
}

export function notFound(message: string, metadata?: ErrorMetadata) {
  return new AppError(message, 404, 'NOT_FOUND', metadata);
}

export function conflict(message: string, metadata?: ErrorMetadata) {
  return new AppError(message, 409, 'CONFLICT', metadata);
}

export function internal(message: string, metadata?: ErrorMetadata) {
  return new AppError(message, 500, 'INTERNAL_SERVER_ERROR', metadata);
}

export function toSafeError(error: unknown) {
  if (isAppError(error)) {
    return {
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      message: error.message,
      metadata: error.metadata
    };
  }
  return {
    statusCode: 500,
    errorCode: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred'
  };
}

