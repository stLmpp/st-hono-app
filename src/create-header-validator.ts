import { HeadersMetadata } from './decorator/headers.decorator.js';
import { validator } from 'hono/validator';
import { BAD_REQUEST_BODY, formatZodErrorString } from '@st-api/core';

export function createHeaderValidator(metadata: HeadersMetadata | undefined) {
  if (!metadata?.schema) {
    return validator('header', (value) => value);
  }
  const { schema } = metadata;
  return validator('header', async (value, c) => {
    const result = await schema.safeParseAsync(value);
    if (!result.success) {
      // TODO add exception to BAD_REQUEST_HEADERS on core
      const exception = BAD_REQUEST_BODY(formatZodErrorString(result.error));
      return c.json(exception.toJSON(), exception.getStatus() as never);
    }
    return result.data;
  });
}
