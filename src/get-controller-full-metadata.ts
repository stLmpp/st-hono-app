import { ZParams, ZParamsMetadata } from './decorator/params.decorator.js';
import { ZQuery, ZQueryMetadata } from './decorator/query.decorator.js';
import { Headers, HeadersMetadata } from './decorator/headers.decorator.js';
import { ZBody, ZBodyMetadata } from './decorator/body.decorator.js';
import { ZRes, ZResMetadata } from './decorator/response.decorator.js';
import {
  Controller,
  ControllerOptions,
} from './decorator/controller.decorator.js';
import { Class } from 'type-fest';
import { Handler } from '../test-app/root.controller.js';

interface ControllerFullMetadata {
  controller: ControllerOptions;
  params: ZParamsMetadata | undefined;
  query: ZQueryMetadata | undefined;
  headers: HeadersMetadata | undefined;
  body: ZBodyMetadata | undefined;
  response: ZResMetadata | undefined;
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
    params: ZParams.getMetadata(target, propertyKey),
    query: ZQuery.getMetadata(target, propertyKey),
    headers: Headers.getMetadata(target, propertyKey),
    body: ZBody.getMetadata(target, propertyKey),
    response: ZRes.getMetadata(target, propertyKey),
  };
}
