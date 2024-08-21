import { z, ZodSchema } from 'zod';

const ZResMetadataSymbol = Symbol('ZResMetadata');

export interface ZResMetadata {
  schema: ZodSchema;
  statusCode: number;
}

interface ZRes {
  (schema?: ZodSchema, status?: number): ClassDecorator;
  getMetadata(target: any): ZResMetadata | undefined;
  setMetadata(target: any, metadata: ZResMetadata): void;
}

const getMetadata: ZRes['getMetadata'] = (target) =>
  Reflect.getMetadata(ZResMetadataSymbol, target);
const setMetadata: ZRes['setMetadata'] = (target, metadata) => {
  Reflect.defineMetadata(ZResMetadataSymbol, metadata, target);
};

function Decorator(schema?: ZodSchema, status = 200): ClassDecorator {
  return (target: any) => {
    setMetadata(target, {
      schema: schema ?? z.void(),
      statusCode: status,
    });
  };
}

export const ZRes: ZRes = Object.assign(Decorator, {
  getMetadata,
  setMetadata,
});
