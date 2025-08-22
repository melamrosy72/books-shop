import { type Context } from 'hono';

type StatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 500 | 503;

export const successResponse = (c: Context, data: any, status: StatusCode = 200) => {
    return c.json({ success: true, data }, status);
};

export const failureResponse = (c: Context, message: string, status: StatusCode = 400) => {
    return c.json({ success: false, error: message }, status);
};


