import { ZQueryMetadata } from './decorator/query.decorator.js';
import { validator } from 'hono/validator';
import { BAD_REQUEST_QUERY, formatZodErrorString } from '@st-api/core';
import { throwInternal } from './throw-internal.js';

export function createQueryValidator(metadata: ZQueryMetadata | undefined) {
  if (!metadata?.schema) {
    return validator('query', (value) => value);
  }
  const { schema } = metadata;
  return validator('query', async (value) => {
    const result = await schema.safeParseAsync(value);
    if (!result.success) {
      throwInternal(BAD_REQUEST_QUERY(formatZodErrorString(result.error)));
    }
    return result.data;
  });
}
