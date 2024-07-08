import { Class } from 'type-fest';
import { Injector } from '@stlmpp/di';
import { Hono } from 'hono';
import { serve, ServerType } from '@hono/node-server';
import { Handler } from './root.controller.js';
import { Controller } from './controller.decorator.js';

export interface HonoAppOptions {
  hono: Hono;
  controllers: Class<Handler>[];
}

export interface HonoApp {
  readonly hono: Hono;
  serve(): ServerType;
}

export async function createHonoApp({
  hono,
  controllers,
}: HonoAppOptions): Promise<HonoApp> {
  const injector = Injector.create('App');

  for (const controller of controllers) {
    const metadata = Controller.getMetadata(controller);
    if (!metadata) {
      throw new Error(
        `Could resolve metadata for controller ${controller?.name}. Did you forget to insert it in the controllers array?`,
      );
    }
    injector.register(controller);
    const instance = await injector.resolve(controller);
    hono.get(metadata.path ?? '/', async (c) => {
      const response = await instance.handle();
      return typeof response === 'string' ? c.text(response) : c.json(response);
    });
  }

  return {
    hono,
    serve: () =>
      serve({
        port: Number(process.env.PORT || 3000) || 3030,
        fetch: hono.fetch,
      }),
  };
}
