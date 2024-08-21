import { ExceptionFactory } from '@st-api/core';

const ExceptionsMetadataSymbol = Symbol('ExceptionsMetadata');

export interface ExceptionsMetadata {
  factories: ExceptionFactory[];
}

interface Exceptions {
  (factories: ExceptionFactory[]): ClassDecorator;
  getMetadata(target: any): ExceptionsMetadata | undefined;
  setMetadata(target: any, metadata: ExceptionsMetadata): void;
}

const getMetadata: Exceptions['getMetadata'] = (target) =>
  Reflect.getMetadata(ExceptionsMetadataSymbol, target);
const setMetadata: Exceptions['setMetadata'] = (target, metadata) => {
  Reflect.defineMetadata(ExceptionsMetadataSymbol, metadata, target);
};

function Decorator(factories: ExceptionFactory[]): ClassDecorator {
  return (target: any) => {
    setMetadata(target, {
      factories,
    });
  };
}

export const Exceptions: Exceptions = Object.assign(Decorator, {
  getMetadata,
  setMetadata,
});
