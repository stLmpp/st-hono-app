import { z } from 'zod';
import { Controller } from '../src/decorator/controller.decorator.js';
import { ZParams } from '../src/decorator/z-params.decorator.js';
import { exception, ParamIntSchema } from '@st-api/core';
import { ZQuery } from '../src/decorator/z-query.decorator.js';
import { ZHeaders } from '../src/decorator/z-headers.decorator.js';
import { ZBody } from '../src/decorator/z-body.decorator.js';
import { ZRes } from '../src/decorator/z-res.decorator.js';
import { StatusCodes } from 'http-status-codes';
import { Exceptions } from '../src/decorator/exceptions.decorator.js';
import { UseGuards } from '../src/guard/use-guards.decorator.js';
import { Guard } from './guard.js';

// TODO move this interface
export interface Handler {
  handle(...args: any[]): any | Promise<any>;
}

const ParamsSchema = z.object({
  id: ParamIntSchema,
});
type ParamsType = z.output<typeof ParamsSchema>;

const exception_1 = exception({
  message: 'teste',
  status: 502,
  error: 'teste',
  errorCode: '123',
});

@Exceptions([exception_1])
@ZRes(
  z.object({
    id: z.number(),
  }),
  StatusCodes.CREATED,
)
@UseGuards(Guard)
@Controller({
  path: '/:id',
  method: 'POST',
})
export class RootController implements Handler {
  async handle(
    @ZParams(ParamsSchema) params: ParamsType,
    @ZQuery(ParamsSchema) query: ParamsType,
    @ZHeaders(ParamsSchema.partial()) headers: Record<string, string>,
    @ZBody(ParamsSchema) body: ParamsType,
  ): Promise<any> {
    return {
      id: params.id,
    };
  }
}
