import { ZodSchema } from 'zod';
import { Controller } from './controller.decorator.js';

export interface Handler {
  handle(...args: any[]): any | Promise<any>;
}

export function Params(schema?: ZodSchema): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {};
}

@Controller()
export class RootController implements Handler {
  async handle(@Params() params: any): Promise<any> {
    return { params: params ?? {} };
  }
}
