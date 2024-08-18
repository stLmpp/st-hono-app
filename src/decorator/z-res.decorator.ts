import { z, ZodSchema } from 'zod';

const ZResMetadataSymbol = Symbol('ZResMetadata');

export interface ZResMetadata {
  schema: ZodSchema;
  statusCode: number;
}

interface ZRes {
  (schema?: ZodSchema, status?: number): ClassDecorator & MethodDecorator;
  getMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
  ): ZResMetadata | undefined;
  setMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
    metadata: ZResMetadata,
  ): void;
}

const getMetadata: ZRes['getMetadata'] = (target, propertyKey) =>
  Reflect.getMetadata(ZResMetadataSymbol, target, propertyKey ?? '') ??
  Reflect.getMetadata(ZResMetadataSymbol, target);
const setMetadata: ZRes['setMetadata'] = (target, propertyKey, metadata) => {
  Reflect.defineMetadata(
    ZResMetadataSymbol,
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

export const ZRes: ZRes = Object.assign(Decorator, {
  getMetadata,
  setMetadata,
});
