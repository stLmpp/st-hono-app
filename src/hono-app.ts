import { Class } from 'type-fest';
import { Injector, Provider } from '@stlmpp/di';
import { Hono } from 'hono';
import { serve, ServerType } from '@hono/node-server';
import { Handler } from './root.controller.js';
import { Controller, MethodType } from './decorator/controller.decorator.js';
import { Params } from './decorator/params.decorator.js';
import { validator } from 'hono/validator';
import {
  BAD_REQUEST_BODY,
  BAD_REQUEST_PARAMS,
  BAD_REQUEST_QUERY,
  formatZodErrorString,
} from '@st-api/core';
import { apiStateMiddleware } from './api-state.middleware.js';
import { Query } from './decorator/query.decorator.js';
import { Headers } from './decorator/headers.decorator.js';
import { Body } from './decorator/body.decorator.js';

export interface HonoAppOptions {
  hono: Hono;
  controllers: Class<Handler>[];
  providers?: Array<Provider | Class<any>>;
}

export interface HonoApp {
  readonly hono: Hono;
  serve(): ServerType;
}

export async function createHonoApp({
  hono,
  controllers,
  providers,
}: HonoAppOptions): Promise<HonoApp> {
  const injector = Injector.create('App');
  injector.register(providers ?? []);

  hono.use(apiStateMiddleware());

  for (const controller of controllers) {
    const metadata = Controller.getMetadata(controller);
    if (!metadata) {
      throw new Error(
        `Could resolve metadata for controller ${controller?.name}. Did you forget to put it in the controllers array?`,
      );
    }
    injector.register(controller);
    const instance = await injector.resolve(controller);
    const rawMethod = metadata.method ?? 'GET';
    const propertyKey: keyof Handler = 'handle';
    const paramsMetadata = Params.getMetadata(controller, propertyKey);
    const queryMetadata = Query.getMetadata(controller, propertyKey);
    const headersMetadata = Headers.getMetadata(controller, propertyKey);
    const bodyMetadata = Body.getMetadata(controller, propertyKey);
    const method = rawMethod.toLowerCase() as Lowercase<MethodType>;
    hono[method](
      metadata.path ?? '/',
      validator('param', async (value, c) => {
        if (!paramsMetadata) {
          return value;
        }
        const result = await paramsMetadata.schema.safeParseAsync(value);
        if (!result.success) {
          const exception = BAD_REQUEST_PARAMS(
            formatZodErrorString(result.error),
          );
          return c.json(exception.toJSON(), exception.getStatus() as never);
        }
        return result.data;
      }),
      validator('query', async (value, c) => {
        if (!queryMetadata) {
          return value;
        }
        const result = await queryMetadata.schema.safeParseAsync(value);
        if (!result.success) {
          const exception = BAD_REQUEST_QUERY(
            formatZodErrorString(result.error),
          );
          return c.json(exception.toJSON(), exception.getStatus() as never);
        }
        return result.data;
      }),
      validator('json', async (value, c) => {
        if (!bodyMetadata) {
          return value;
        }
        const result = await bodyMetadata.schema.safeParseAsync(value);
        if (!result.success) {
          const exception = BAD_REQUEST_BODY(
            formatZodErrorString(result.error),
          );
          return c.json(exception.toJSON(), exception.getStatus() as never);
        }
        return result.data;
      }),
      async (c) => {
        const args = [];
        if (paramsMetadata) {
          args[paramsMetadata.parameterIndex] = c.req.valid('param');
        }
        if (queryMetadata) {
          args[queryMetadata.parameterIndex] = c.req.valid('query');
        }
        if (headersMetadata) {
          args[headersMetadata.parameterIndex] = c.req.header();
        }
        const response = await instance.handle(...args);
        return typeof response === 'string'
          ? c.text(response)
          : c.json(response);
      },
    );
  }

  return {
    hono,
    serve: () =>
      serve({
        port: Number(process.env.PORT || 3000) || 3000,
        fetch: hono.fetch,
      }),
  };
}
