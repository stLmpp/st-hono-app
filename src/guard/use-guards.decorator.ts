import { Class } from 'type-fest';
import { CanActivate } from './can-activate.interface.js';

const UseGuardMetadataSymbol = Symbol('UseGuardMetadata');

export interface UseGuardMetadata {
  guards: Class<CanActivate>[];
}

interface UseGuards {
  (...guards: Class<CanActivate>[]): ClassDecorator;
  getMetadata(target: any): UseGuardMetadata | undefined;
  setMetadata(target: any, metadata: UseGuardMetadata): void;
}

const getMetadata: UseGuards['getMetadata'] = (target) =>
  Reflect.getMetadata(UseGuardMetadataSymbol, target);
const setMetadata: UseGuards['setMetadata'] = (target, metadata) => {
  Reflect.defineMetadata(UseGuardMetadataSymbol, metadata, target);
};

function Decorator(...guards: Class<CanActivate>[]): ClassDecorator {
  return (target: any) => {
    setMetadata(target, {
      guards,
    });
  };
}

export const UseGuards: UseGuards = Object.assign(Decorator, {
  getMetadata,
  setMetadata,
});
