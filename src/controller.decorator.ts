import { Injectable } from '@stlmpp/di';

export interface ControllerOptions {
  path?: string;
}

const ControllerMetadataSymbol = Symbol('ControllerMetadata');

interface Controller {
  (options?: ControllerOptions): ClassDecorator;
  getMetadata(target: any): ControllerOptions | undefined;
  setMetadata(target: any, options?: ControllerOptions): void;
}

const getMetadata: Controller['getMetadata'] = (target) =>
  Reflect.getMetadata(ControllerMetadataSymbol, target);
const setMetadata: Controller['setMetadata'] = (target, options) => {
  Reflect.defineMetadata(ControllerMetadataSymbol, options ?? {}, target);
};

function ControllerDecorator(options?: ControllerOptions): ClassDecorator {
  return (target) => {
    setMetadata(target, options);
    Injectable()(target as never);
  };
}

export const Controller: Controller = Object.assign(ControllerDecorator, {
  getMetadata,
  setMetadata,
});
