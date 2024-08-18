import { HeadersMetadata } from './decorator/headers.decorator.js';
import { validator } from 'hono/validator';
import { BAD_REQUEST_BODY, formatZodErrorString } from '@st-api/core';
import { throwInternal } from './throw-internal.js';

export function createHeaderValidator(metadata: HeadersMetadata | undefined) {
  if (!metadata?.schema) {
    return validator('header', (value) => value);
  }
  const { schema } = metadata;
  return validator('header', async (value) => {
    const result = await schema.safeParseAsync(value);
    if (!result.success) {
      // TODO add exception to BAD_REQUEST_HEADERS on core
      throwInternal(BAD_REQUEST_BODY(formatZodErrorString(result.error)));
    }
    return result.data;
  });
}
