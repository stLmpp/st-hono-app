import { Context } from 'hono';

export interface HandlerContext {
  params: Record<string, unknown>;
  query: Record<string, unknown>;
  headers: Record<string, unknown>;
  body?: unknown;
  c: Context;
}
