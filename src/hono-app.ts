import type { Class } from 'type-fest';
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
import type { OpenAPIObject, OperationObject } from 'openapi3-ts/oas30';
import { swaggerUI } from '@hono/swagger-ui';
import { StatusCodes } from 'http-status-codes';
import { generateSchema } from '@st-api/zod-openapi';
import { ZodObject, ZodSchema } from 'zod';

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

  const openapiDocument: OpenAPIObject = {
    openapi: '3.0.0',
    info: {
      title: 'App',
      version: '1.0.0',
    },
    paths: {},
  };

  hono
    .get('/openapi.json', (c) => c.json(openapiDocument))
    .use(apiStateMiddleware())
    .use(
      '/openapi',
      swaggerUI({
        url: '/openapi.json',
      }),
    )
    .get('/help', (c) => c.redirect('/openapi', StatusCodes.MOVED_PERMANENTLY));

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
    const path = metadata.path ?? '/';
    const operation: OperationObject = {
      responses: {
        200: {},
      },
    };
    openapiDocument.paths[path] = Object.assign(
      openapiDocument.paths[path] ?? {},
      { [method]: operation },
    );
    if (bodyMetadata?.schema) {
      operation.requestBody = {
        required: !bodyMetadata.schema.isOptional(),
        content: {
          'application/json': {
            schema: generateSchema(bodyMetadata?.schema),
          },
        },
      };
    }
    operation.parameters ??= [];
    if (paramsMetadata?.schema) {
      const paramsSchema = paramsMetadata.schema as ZodObject<
        Record<string, ZodSchema>
      >;
      for (const [key, value] of Object.entries(paramsSchema.shape)) {
        operation.parameters.push({
          name: key,
          required: !value.isOptional(),
          in: 'query',
          schema: generateSchema(value),
        });
      }
    }
    if (queryMetadata?.schema) {
      const querySchema = queryMetadata.schema as ZodObject<
        Record<string, ZodSchema>
      >;
      for (const [key, value] of Object.entries(querySchema.shape)) {
        operation.parameters.push({
          name: key,
          required: !value.isOptional(),
          in: 'path',
          schema: generateSchema(value),
        });
      }
    }
    hono[method](
      metadata.path ?? '/',
      validator('param', async (value, c) => {
        if (!paramsMetadata?.schema) {
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
        if (!queryMetadata?.schema) {
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
        if (!bodyMetadata?.schema) {
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
      validator('header', async (value, c) => {
        if (!headersMetadata?.schema) {
          return value;
        }
        const result = await headersMetadata.schema.safeParseAsync(value);
        if (!result.success) {
          // TODO add exception to BAD_REQUEST_HEADERS on core
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
          args[headersMetadata.parameterIndex] = c.req.valid('header');
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
