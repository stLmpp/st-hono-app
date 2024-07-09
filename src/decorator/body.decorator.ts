import { ZodSchema } from 'zod';

const BodyMetadataSymbol = Symbol('BodyMetadata');

export interface QueryMetadata {
  schema: ZodSchema;
  parameterIndex: number;
}

interface Body {
  (schema: ZodSchema): ParameterDecorator;
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

const getMetadata: Body['getMetadata'] = (target, propertyKey) =>
  Reflect.getMetadata(BodyMetadataSymbol, target, propertyKey ?? '');
const setMetadata: Body['setMetadata'] = (target, propertyKey, metadata) => {
  Reflect.defineMetadata(
    BodyMetadataSymbol,
    metadata,
    target,
    propertyKey ?? '',
  );
};

function Decorator(schema: ZodSchema): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    setMetadata(target.constructor, propertyKey, {
      schema,
      parameterIndex,
    });
  };
}

export const Body: Body = Object.assign(Decorator, {
  getMetadata,
  setMetadata,
});
