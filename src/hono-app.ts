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
import { swaggerUI } from '@hono/swagger-ui';
import { StatusCodes } from 'http-status-codes';
import { createHeaderValidator } from './create-header-validator.js';
import { createBodyValidator } from './create-body-validator.js';
import { createQueryValidator } from './create-query-validator.js';
import { createParamValidator } from './create-param-validator.js';
import { getControllerFullMetadata } from './get-controller-full-metadata.js';
import { throwInternal } from './throw-internal.js';
import { Openapi } from './openapi.js';
import { FORBIDDEN } from './exception.js';
import { GLOBAL_GUARDS } from './guard/global-guards.token.js';

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

  const openapi = new Openapi({
    openapi: '3.0.0',
    info: {
      title: 'App',
      version: '1.0.0',
    },
    paths: {},
  });

  hono
    .get('/openapi.json', (c) => c.json(openapi.getDocument()))
    .use(apiStateMiddleware())
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

  const globalGuards = await injector.resolveAll(GLOBAL_GUARDS, {
    optional: true,
  });

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
      guard: guardMetadata,
      ctx: ctxMetadata,
    } = fullMetadata;
    const instance = await injector
      .register(guardMetadata?.guards ?? [])
      .register(controller)
      .resolve(controller);
    const rawMethod = metadata.method ?? 'GET';
    const method = rawMethod.toLowerCase() as Lowercase<MethodType>;
    let path = metadata.path ?? '/';
    if (!path.startsWith('/')) {
      path = `/${path}`;
    }
    openapi.addPath(fullMetadata);

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
        if (ctxMetadata) {
          args[ctxMetadata.parameterIndex] = c;
        }
        const guards = [...(guardMetadata?.guards ?? []), ...globalGuards];
        for (const guard of guards) {
          const guardInstance =
            typeof guard === 'function' ? await injector.resolve(guard) : guard;
          const result = await guardInstance.handle({
            body: c.req.valid('json'),
            c,
            headers: c.req.valid('header'),
            params: c.req.valid('param'),
            query: c.req.valid('query'),
          });
          if (!result) {
            throwInternal(FORBIDDEN());
          }
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

  openapi.addMissingExceptions();

  return {
    hono,
    serve: () =>
      serve({
        port: Number(process.env.PORT || 3000) || 3000,
        fetch: hono.fetch,
      }),
  };
}
