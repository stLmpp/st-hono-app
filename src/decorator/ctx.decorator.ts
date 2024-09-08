const CtxMetadataSymbol = Symbol('CtxMetadata');

export interface CtxMetadata {
  parameterIndex: number;
}

interface Ctx {
  (): ParameterDecorator;
  getMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
  ): CtxMetadata | undefined;
  setMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
    metadata: CtxMetadata,
  ): void;
}

const getMetadata: Ctx['getMetadata'] = (target, propertyKey) =>
  Reflect.getMetadata(CtxMetadataSymbol, target, propertyKey ?? '');
const setMetadata: Ctx['setMetadata'] = (target, propertyKey, metadata) => {
  Reflect.defineMetadata(
    CtxMetadataSymbol,
    metadata,
    target,
    propertyKey ?? '',
  );
};

function Decorator(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    setMetadata(target.constructor, propertyKey, {
      parameterIndex,
    });
  };
}

export const Ctx: Ctx = Object.assign(Decorator, {
  getMetadata,
  setMetadata,
});
