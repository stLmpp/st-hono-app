import 'reflect-metadata';
import { Hono } from 'hono';
import { createHonoApp } from './hono-app.js';
import { RootController } from './root.controller.js';

const app = await createHonoApp({
  hono: new Hono(),
  controllers: [RootController],
});

app.serve();

console.log('Listening at http://localhost:3000 ');
