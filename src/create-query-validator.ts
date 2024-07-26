import { QueryMetadata } from './decorator/query.decorator.js';
import { validator } from 'hono/validator';
import { BAD_REQUEST_QUERY, formatZodErrorString } from '@st-api/core';

export function createQueryValidator(metadata: QueryMetadata | undefined) {
  if (!metadata?.schema) {
    return validator('query', (value) => value);
  }
  const { schema } = metadata;
  return validator('query', async (value, c) => {
    const result = await schema.safeParseAsync(value);
    if (!result.success) {
      const exception = BAD_REQUEST_QUERY(formatZodErrorString(result.error));
      return c.json(exception.toJSON(), exception.getStatus() as never);
    }
    return result.data;
  });
}
