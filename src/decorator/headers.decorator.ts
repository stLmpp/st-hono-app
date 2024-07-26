import { ZodObject, ZodSchema } from 'zod';

const HeadersMetadataSymbol = Symbol('HeadersMetadata');

export interface HeadersMetadata {
  schema: ZodObject<Record<string, ZodSchema>> | undefined;
  parameterIndex: number;
}

interface Headers {
  (schema?: ZodSchema): ParameterDecorator;
  getMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
  ): HeadersMetadata | undefined;
  setMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
    metadata: HeadersMetadata,
  ): void;
}

const getMetadata: Headers['getMetadata'] = (target, propertyKey) =>
  Reflect.getMetadata(HeadersMetadataSymbol, target, propertyKey ?? '');
const setMetadata: Headers['setMetadata'] = (target, propertyKey, metadata) => {
  Reflect.defineMetadata(
    HeadersMetadataSymbol,
    metadata,
    target,
    propertyKey ?? '',
  );
};

function Decorator(schema?: ZodSchema): ParameterDecorator {
  const isValidSchema = schema instanceof ZodObject;

  if (!isValidSchema) {
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

export const Headers: Headers = Object.assign(Decorator, {
  getMetadata,
  setMetadata,
});
