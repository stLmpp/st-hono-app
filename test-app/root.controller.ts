import { z } from 'zod';
import { Controller } from '../src/decorator/controller.decorator.js';
import { ZParams } from '../src/decorator/params.decorator.js';
import { ParamIntSchema } from '@st-api/core';
import { ZQuery } from '../src/decorator/query.decorator.js';
import { Headers } from '../src/decorator/headers.decorator.js';
import { ZBody } from '../src/decorator/body.decorator.js';
import { ZRes } from '../src/decorator/response.decorator.js';
import { StatusCodes } from 'http-status-codes';

export interface Handler {
  handle(...args: any[]): any | Promise<any>;
}

const ParamsSchema = z.object({
  id: ParamIntSchema,
});
type ParamsType = z.output<typeof ParamsSchema>;

@Controller({
  path: '/:id',
  method: 'POST',
})
export class RootController implements Handler {
  @ZRes(
    z.object({
      id: z.number(),
    }),
    StatusCodes.CREATED,
  )
  async handle(
    @ZParams(ParamsSchema) params: ParamsType,
    @ZQuery(ParamsSchema) query: ParamsType,
    @Headers() headers: Record<string, string>,
    @ZBody(ParamsSchema) body: ParamsType,
  ): Promise<any> {
    return {
      id: params.id,
    };
  }
}
