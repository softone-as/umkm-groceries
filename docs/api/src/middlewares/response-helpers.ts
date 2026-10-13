import type { RequestHandler } from 'express';
import type { ApiErrorResponse, ApiSuccessResponse } from '@santo/shared';

declare global {
  namespace Express {
    interface Response {
      sendSuccess<T>(data: T, meta?: Record<string, unknown>): this;
      sendError(code: string, message: string, details?: unknown, status?: number): this;
    }
  }
}

export const responseHelpers: RequestHandler = (_request, response, next) => {
  response.sendSuccess = function <T>(data: T, meta?: Record<string, unknown>) {
    const body: ApiSuccessResponse<T> = {
      success: true,
      data,
      ...(meta === undefined ? {} : { meta }),
    };
    return this.json(body);
  };

  response.sendError = function (
    code: string,
    message: string,
    details?: unknown,
    status = 500,
  ) {
    const error: ApiErrorResponse['error'] = {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    };
    return this.status(status).json({ success: false, error });
  };

  next();
};
