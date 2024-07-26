import { ParamsMetadata } from './decorator/params.decorator.js';
import { validator } from 'hono/validator';
import { BAD_REQUEST_PARAMS, formatZodErrorString } from '@st-api/core';

export function createParamValidator(metadata: ParamsMetadata | undefined) {
  if (!metadata?.schema) {
    return validator('param', (value) => value);
  }
  const { schema } = metadata;
  return validator('param', async (value, c) => {
    const result = await schema.safeParseAsync(value);
    if (!result.success) {
      const exception = BAD_REQUEST_PARAMS(formatZodErrorString(result.error));
      return c.json(exception.toJSON(), exception.getStatus() as never);
    }
    return result.data;
  });
}
