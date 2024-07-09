import { HonoRequest, MiddlewareHandler } from 'hono';
import { apiStateRunInContext, createCorrelationId } from '@st-api/core';

function correlationIdGetter(request: HonoRequest) {
  const correlationIdHeaderRaw = request.header('x-correlation-id');
  const correlationIdHeader = correlationIdHeaderRaw?.length
    ? correlationIdHeaderRaw
    : undefined;
  return correlationIdHeader || createCorrelationId();
}

function traceIdGetter(request: HonoRequest) {
  const traceIdHeaderRaw = request.header('x-trace-id');
  const traceIdHeader = traceIdHeaderRaw?.length ? traceIdHeaderRaw : undefined;
  return traceIdHeader || createCorrelationId();
}

function executionIdGetter(request: HonoRequest) {
  const executionIdHeaderRaw = request.header('x-trace-id');
  const executionIdHeader = executionIdHeaderRaw?.length
    ? executionIdHeaderRaw
    : undefined;
  return executionIdHeader || createCorrelationId();
}

export function apiStateMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const correlationId = correlationIdGetter(c.req);
    const traceId = traceIdGetter(c.req);
    const executionId = executionIdGetter(c.req);
    await apiStateRunInContext(
      async () => {
        await next();
        c.header('x-correlation-id', correlationId);
        c.header('x-trace-id', traceId);
        c.header('x-execution-id', executionId);
        c.header('x-st-api', 'true');
      },
      {
        correlationId,
        traceId,
        executionId,
      },
    );
  };
}
