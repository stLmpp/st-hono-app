import type { Class } from 'type-fest';
import { Injector, Provider } from '@stlmpp/di';
import { Hono } from 'hono';
import { serve, ServerType } from '@hono/node-server';
import { Handler } from '../test-app/root.controller.js';
import { MethodType } from './decorator/controller.decorator.js';
import {
  formatZodErrorString,
  INVALID_RESPONSE,
  safeAsync,
} from '@st-api/core';
import { apiStateMiddleware } from './api-state.middleware.js';
import type {
  OpenAPIObject,
  OperationObject,
  ResponseObject,
} from 'openapi3-ts/oas30';
import { swaggerUI } from '@hono/swagger-ui';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { generateSchema } from '@st-api/zod-openapi';
import { createHeaderValidator } from './create-header-validator.js';
import { createBodyValidator } from './create-body-validator.js';
import { createQueryValidator } from './create-query-validator.js';
import { createParamValidator } from './create-param-validator.js';
import { getControllerFullMetadata } from './get-controller-full-metadata.js';
import { throwInternal } from './throw-internal.js';

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
    // .use(async (c, next) => {
    //   console.log('Entering error handler');
    //
    //   await next();
    //
    //   console.log('Exiting error handler', c.error);
    //
    //   if (!c.error) {
    //     return;
    //   }
    //   const exception =
    //     c.error instanceof Exception
    //       ? c.error
    //       : UNKNOWN_INTERNAL_SERVER_ERROR();
    //   return c.newResponse(
    //     JSON.stringify(exception.toJSON()),
    //     exception.getStatus() as never,
    //     {
    //       'Content-Type': 'application/json',
    //     },
    //   );
    // })
    .use(
      '/openapi',
      swaggerUI({
        url: '/openapi.json',
        persistAuthorization: true,
        displayRequestDuration: true,
        deepLinking: true,
      }),
    )
    .get('/help', (c) => c.redirect('/openapi', StatusCodes.MOVED_PERMANENTLY));

  for (const controller of controllers) {
    const fullMetadata = getControllerFullMetadata(controller);
    if (!fullMetadata) {
      throw new Error(
        `Could resolve metadata for controller ${controller?.name}. Did you forget to put it in the controllers array?`,
      );
    }
    const {
      controller: metadata,
      body: bodyMetadata,
      params: paramsMetadata,
      response: responseMetadata,
      query: queryMetadata,
      headers: headersMetadata,
    } = fullMetadata;
    const instance = await injector.register(controller).resolve(controller);
    const rawMethod = metadata.method ?? 'GET';
    const method = rawMethod.toLowerCase() as Lowercase<MethodType>;
    let path = metadata.path ?? '/';
    if (!path.startsWith('/')) {
      path = `/${path}`;
    }
    const pathOpenapi = path
      .split('/')
      .map((part) => {
        if (!part.startsWith(':')) {
          return part;
        }
        return `{${part.slice(1)}}`;
      })
      .join('/');
    const pathOperationId = path.replaceAll('/', '_').replaceAll(':', 'p~');
    const operation: OperationObject = {
      responses: {},
      operationId: `${method.toUpperCase()}-${pathOperationId}`,
    };
    openapiDocument.paths[pathOpenapi] = Object.assign(
      openapiDocument.paths[pathOpenapi] ?? {},
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
      for (const [key, value] of Object.entries(paramsMetadata.schema.shape)) {
        operation.parameters.push({
          name: key,
          required: !value.isOptional(),
          in: 'query',
          schema: generateSchema(value),
        });
      }
    }
    if (queryMetadata?.schema) {
      for (const [key, value] of Object.entries(queryMetadata.schema.shape)) {
        operation.parameters.push({
          name: key,
          required: !value.isOptional(),
          in: 'path',
          schema: generateSchema(value),
        });
      }
    }
    if (responseMetadata) {
      operation.responses[responseMetadata.statusCode] = {
        description: getReasonPhrase(responseMetadata.statusCode),
        content: {
          'application/json': {
            schema: generateSchema(responseMetadata.schema),
          },
        },
      } satisfies ResponseObject;
    }
    hono[method](
      path,
      createParamValidator(paramsMetadata),
      createQueryValidator(queryMetadata),
      createBodyValidator(bodyMetadata),
      createHeaderValidator(headersMetadata),
      async (c) => {
        const args: unknown[] = [];
        if (paramsMetadata) {
          args[paramsMetadata.parameterIndex] = c.req.valid('param');
        }
        if (queryMetadata) {
          args[queryMetadata.parameterIndex] = c.req.valid('query');
        }
        if (headersMetadata) {
          args[headersMetadata.parameterIndex] = c.req.valid('header');
        }
        if (bodyMetadata) {
          args[bodyMetadata.parameterIndex] = c.req.valid('json');
        }
        const [error, response] = await safeAsync(() =>
          instance.handle(...args),
        );
        if (error) {
          throwInternal(error);
        }
        let responseParsed: any = response;
        if (responseMetadata) {
          const result = await responseMetadata.schema.safeParseAsync(response);
          if (!result.success) {
            const exception = INVALID_RESPONSE(
              formatZodErrorString(result.error),
            );
            return c.json(exception.toJSON(), exception.getStatus() as never);
          }
          responseParsed = result.data;
          c.status(responseMetadata.statusCode as never);
        }
        return typeof responseParsed === 'string'
          ? c.text(responseParsed)
          : c.json(responseParsed);
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
