import { ZodObject, ZodSchema } from 'zod';

const ParamsMetadataSymbol = Symbol('ParamsMetadata');

export interface ParamsMetadata {
  schema: ZodObject<Record<string, ZodSchema>> | undefined;
  parameterIndex: number;
}

interface Params {
  (schema?: ZodSchema): ParameterDecorator;
  getMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
  ): ParamsMetadata | undefined;
  setMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
    metadata: ParamsMetadata,
  ): void;
}

const getMetadata: Params['getMetadata'] = (target, propertyKey) =>
  Reflect.getMetadata(ParamsMetadataSymbol, target, propertyKey ?? '');
const setMetadata: Params['setMetadata'] = (target, propertyKey, metadata) => {
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

export const Params: Params = Object.assign(Decorator, {
  getMetadata,
  setMetadata,
});
