import 'reflect-metadata';
import { Hono } from 'hono';
import { createHonoApp } from '../src/hono-app.js';
import { RootController } from './root.controller.js';
import { GLOBAL_GUARDS } from '../src/guard/global-guards.token.js';
import { Guard } from './guard.js';

const app = await createHonoApp({
  hono: new Hono(),
  controllers: [RootController],
  providers: [
    Guard,
    {
      provide: GLOBAL_GUARDS,
      multi: true,
      useClass: Guard,
    },
  ],
});

app.serve();

console.log('Listening at http://localhost:3000');
