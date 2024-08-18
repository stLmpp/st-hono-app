import { ZParamsMetadata } from './decorator/params.decorator.js';
import { validator } from 'hono/validator';
import { BAD_REQUEST_PARAMS, formatZodErrorString } from '@st-api/core';
import { throwInternal } from './throw-internal.js';

export function createParamValidator(metadata: ZParamsMetadata | undefined) {
  if (!metadata?.schema) {
    return validator('param', (value) => value);
  }
  const { schema } = metadata;
  return validator('param', async (value) => {
    const result = await schema.safeParseAsync(value);
    if (!result.success) {
      throwInternal(BAD_REQUEST_PARAMS(formatZodErrorString(result.error)));
    }
    return result.data;
  });
}
