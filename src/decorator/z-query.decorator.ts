import { ZodObject, ZodSchema } from 'zod';

const ZQueryMetadataSymbol = Symbol('ZQueryMetadata');

export interface ZQueryMetadata {
  schema: ZodObject<Record<string, ZodSchema>> | undefined;
  parameterIndex: number;
}

interface ZQuery {
  (schema?: ZodSchema): ParameterDecorator;
  getMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
  ): ZQueryMetadata | undefined;
  setMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
    metadata: ZQueryMetadata,
  ): void;
}

const getMetadata: ZQuery['getMetadata'] = (target, propertyKey) =>
  Reflect.getMetadata(ZQueryMetadataSymbol, target, propertyKey ?? '');
const setMetadata: ZQuery['setMetadata'] = (target, propertyKey, metadata) => {
  Reflect.defineMetadata(
    ZQueryMetadataSymbol,
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
      schema,
      parameterIndex,
    });
  };
}

export const ZQuery: ZQuery = Object.assign(Decorator, {
  getMetadata,
  setMetadata,
});
