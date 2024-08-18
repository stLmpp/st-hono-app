import { ZodObject, ZodSchema } from 'zod';

const ZHeadersMetadataSymbol = Symbol('ZHeadersMetadata');

export interface ZHeadersMetadata {
  schema: ZodObject<Record<string, ZodSchema>> | undefined;
  parameterIndex: number;
}

interface ZHeaders {
  (schema?: ZodSchema): ParameterDecorator;
  getMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
  ): ZHeadersMetadata | undefined;
  setMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
    metadata: ZHeadersMetadata,
  ): void;
}

const getMetadata: ZHeaders['getMetadata'] = (target, propertyKey) =>
  Reflect.getMetadata(ZHeadersMetadataSymbol, target, propertyKey ?? '');
const setMetadata: ZHeaders['setMetadata'] = (
  target,
  propertyKey,
  metadata,
) => {
  Reflect.defineMetadata(
    ZHeadersMetadataSymbol,
    metadata,
    target,
    propertyKey ?? '',
  );
};

function Decorator(schema?: ZodSchema): ParameterDecorator {
  const isValidSchema = schema instanceof ZodObject;

  if (schema && !isValidSchema) {
    // TODO better error message
    throw new Error('Not valid zod schema');
  }

  return (target, propertyKey, parameterIndex) => {
    setMetadata(target.constructor, propertyKey, {
      parameterIndex,
      schema,
    });
  };
}

export const ZHeaders: ZHeaders = Object.assign(Decorator, {
  getMetadata,
  setMetadata,
});
