import { HandlerContext } from '../handler-context.js';
import { Class } from 'type-fest';

const UseGuardMetadataSymbol = Symbol('UseGuardMetadata');

export interface CanActivate {
  handle(context: HandlerContext): boolean | Promise<boolean>;
}

export interface UseGuardMetadata {
  guards: Class<CanActivate>[];
}

interface UseGuards {
  (...guards: Class<CanActivate>[]): ClassDecorator & MethodDecorator;
  getMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
  ): UseGuardMetadata | undefined;
  setMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
    metadata: UseGuardMetadata,
  ): void;
}

const getMetadata: UseGuards['getMetadata'] = (target, propertyKey) =>
  Reflect.getMetadata(UseGuardMetadataSymbol, target, propertyKey ?? '') ??
  Reflect.getMetadata(UseGuardMetadataSymbol, target);
const setMetadata: UseGuards['setMetadata'] = (
  target,
  propertyKey,
  metadata,
) => {
  Reflect.defineMetadata(
    UseGuardMetadataSymbol,
    metadata,
    target,
    propertyKey ?? '',
  );
};

function Decorator(
  ...guards: Class<CanActivate>[]
): ClassDecorator & MethodDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ) => {
    setMetadata(descriptor ? target.constructor : target, propertyKey, {
      guards,
    });
  };
}

export const UseGuards: UseGuards = Object.assign(Decorator, {
  getMetadata,
  setMetadata,
});
