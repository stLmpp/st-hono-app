import { ZBodyMetadata } from './decorator/body.decorator.js';
import { validator } from 'hono/validator';
import { BAD_REQUEST_BODY, formatZodErrorString } from '@st-api/core';
import { throwInternal } from './throw-internal.js';

export function createBodyValidator(metadata: ZBodyMetadata | undefined) {
  if (!metadata?.schema) {
    return validator('json', (value) => value);
  }
  const { schema } = metadata;
  return validator('json', async (value) => {
    const result = await schema.safeParseAsync(value);
    if (!result.success) {
      throwInternal(BAD_REQUEST_BODY(formatZodErrorString(result.error)));
    }
    return result.data;
  });
}
