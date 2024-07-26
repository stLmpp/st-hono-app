import { BodyMetadata } from './decorator/body.decorator.js';
import { validator } from 'hono/validator';
import { BAD_REQUEST_BODY, formatZodErrorString } from '@st-api/core';

export function createBodyValidator(metadata: BodyMetadata | undefined) {
  if (!metadata?.schema) {
    return validator('json', (value) => value);
  }
  const { schema } = metadata;
  return validator('json', async (value, c) => {
    const result = await schema.safeParseAsync(value);
    if (!result.success) {
      const exception = BAD_REQUEST_BODY(formatZodErrorString(result.error));
      return c.json(exception.toJSON(), exception.getStatus() as never);
    }
    return result.data;
  });
}
