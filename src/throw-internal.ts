import { Exception, UNKNOWN_INTERNAL_SERVER_ERROR } from '@st-api/core';
import { HTTPException } from 'hono/http-exception';

export function throwInternal(error: unknown): never {
  const exception =
    error instanceof Exception ? error : UNKNOWN_INTERNAL_SERVER_ERROR();
  throw new HTTPException(exception.getStatus() as never, {
    res: new Response(JSON.stringify(exception.toJSON()), {
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  });
}
