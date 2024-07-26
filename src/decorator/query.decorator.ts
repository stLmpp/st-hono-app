import { ZodObject, ZodSchema } from 'zod';

const ParamsMetadataSymbol = Symbol('QueryMetadata');

export interface QueryMetadata {
  schema: ZodObject<Record<string, ZodSchema>> | undefined;
  parameterIndex: number;
}

interface Query {
  (schema?: ZodSchema): ParameterDecorator;
  getMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
  ): QueryMetadata | undefined;
  setMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
    metadata: QueryMetadata,
  ): void;
}

const getMetadata: Query['getMetadata'] = (target, propertyKey) =>
  Reflect.getMetadata(ParamsMetadataSymbol, target, propertyKey ?? '');
const setMetadata: Query['setMetadata'] = (target, propertyKey, metadata) => {
  Reflect.defineMetadata(
    ParamsMetadataSymbol,
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
      schema,
      parameterIndex,
    });
  };
}

export const Query: Query = Object.assign(Decorator, {
  getMetadata,
  setMetadata,
});
