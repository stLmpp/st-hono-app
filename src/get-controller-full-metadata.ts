import { Params, ParamsMetadata } from './decorator/params.decorator.js';
import { Query, QueryMetadata } from './decorator/query.decorator.js';
import { Headers, HeadersMetadata } from './decorator/headers.decorator.js';
import { Body, BodyMetadata } from './decorator/body.decorator.js';
import { Response, ResponseMetadata } from './decorator/response.decorator.js';
import {
  Controller,
  ControllerOptions,
} from './decorator/controller.decorator.js';
import { Class } from 'type-fest';
import { Handler } from './root.controller.js';

interface ControllerFullMetadata {
  controller: ControllerOptions;
  params: ParamsMetadata | undefined;
  query: QueryMetadata | undefined;
  headers: HeadersMetadata | undefined;
  body: BodyMetadata | undefined;
  response: ResponseMetadata | undefined;
}

export function getControllerFullMetadata(
  target: Class<Handler>,
): ControllerFullMetadata | undefined {
  const controller = Controller.getMetadata(target);
  if (!controller) {
    return undefined;
  }
  const propertyKey: keyof Handler = 'handle';
  return {
    controller,
    params: Params.getMetadata(target, propertyKey),
    query: Query.getMetadata(target, propertyKey),
    headers: Headers.getMetadata(target, propertyKey),
    body: Body.getMetadata(target, propertyKey),
    response: Response.getMetadata(target, propertyKey),
  };
}
