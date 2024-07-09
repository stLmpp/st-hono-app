const HeadersMetadataSymbol = Symbol('HeadersMetadata');

export interface HeadersMetadata {
  parameterIndex: number;
}

interface Headers {
  (): ParameterDecorator;
  getMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
  ): HeadersMetadata | undefined;
  setMetadata(
    target: any,
    propertyKey: string | symbol | undefined,
    metadata: HeadersMetadata,
  ): void;
}

const getMetadata: Headers['getMetadata'] = (target, propertyKey) =>
  Reflect.getMetadata(HeadersMetadataSymbol, target, propertyKey ?? '');
const setMetadata: Headers['setMetadata'] = (target, propertyKey, metadata) => {
  Reflect.defineMetadata(
    HeadersMetadataSymbol,
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

export const Headers: Headers = Object.assign(Decorator, {
  getMetadata,
  setMetadata,
});
