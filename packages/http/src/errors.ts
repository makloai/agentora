// @agentora/http/errors — map the shared error taxonomy to HTTP status codes.

import type { ErrorCode } from '@agentora/core';

export const STATUS: Record<ErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  CANCELLED: 499,
  INTERNAL: 500,
};
