import { ExceptionFactory } from '@st-api/core';

const ExceptionsMetadataSymbol = Symbol('ExceptionsMetadata');

export interface ExceptionsMetadata {
  factories: ExceptionFactory[];
}

interface Exceptions {
  (factories: ExceptionFactory[]): ClassDecorator & MethodDecorator;
  getMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
  ): ExceptionsMetadata | undefined;
  setMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
    metadata: ExceptionsMetadata,
  ): void;
}

const getMetadata: Exceptions['getMetadata'] = (target, propertyKey) =>
  Reflect.getMetadata(ExceptionsMetadataSymbol, target, propertyKey ?? '') ??
  Reflect.getMetadata(ExceptionsMetadataSymbol, target);
const setMetadata: Exceptions['setMetadata'] = (
  target,
  propertyKey,
  metadata,
) => {
  Reflect.defineMetadata(
    ExceptionsMetadataSymbol,
    metadata,
    target,
    propertyKey ?? '',
  );
};

function Decorator(
  factories: ExceptionFactory[],
): ClassDecorator & MethodDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ) => {
    setMetadata(descriptor ? target.constructor : target, propertyKey, {
      factories,
    });
  };
}

export const Exceptions: Exceptions = Object.assign(Decorator, {
  getMetadata,
  setMetadata,
});
