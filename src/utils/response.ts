import { type Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export const successResponse = (c: Context, data: unknown, status: ContentfulStatusCode = 200) => {
  return c.json({ success: true, data }, status);
};

export const failureResponse = (
  c: Context,
  message: string,
  status: ContentfulStatusCode = 400,
) => {
  return c.json({ success: false, error: message }, status);
};
