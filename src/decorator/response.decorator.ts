import { z, ZodSchema } from 'zod';

const ResponseMetadataSymbol = Symbol('ResponseMetadata');

export interface ResponseMetadata {
  schema: ZodSchema;
  statusCode: number;
}

interface Response {
  (schema?: ZodSchema, status?: number): ClassDecorator & MethodDecorator;
  getMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
  ): ResponseMetadata | undefined;
  setMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
    metadata: ResponseMetadata,
  ): void;
}

const getMetadata: Response['getMetadata'] = (target, propertyKey) =>
  Reflect.getMetadata(ResponseMetadataSymbol, target, propertyKey ?? '') ??
  Reflect.getMetadata(ResponseMetadataSymbol, target);
const setMetadata: Response['setMetadata'] = (
  target,
  propertyKey,
  metadata,
) => {
  Reflect.defineMetadata(
    ResponseMetadataSymbol,
    metadata,
    target,
    propertyKey ?? '',
  );
};

function Decorator(
  schema?: ZodSchema,
  status = 200,
): ClassDecorator & MethodDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ) => {
    setMetadata(descriptor ? target.constructor : target, propertyKey, {
      schema: schema ?? z.void(),
      statusCode: status,
    });
  };
}

export const Response: Response = Object.assign(Decorator, {
  getMetadata,
  setMetadata,
});
