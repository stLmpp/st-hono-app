import { z } from 'zod';
import { Controller } from './decorator/controller.decorator.js';
import { Params } from './decorator/params.decorator.js';
import { ParamIntSchema } from '@st-api/core';
import { Query } from './decorator/query.decorator.js';
import { Headers } from './decorator/headers.decorator.js';
import { Body } from './decorator/body.decorator.js';
import { Response } from './decorator/response.decorator.js';
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
  @Response(
    z.object({
      id: z.number(),
    }),
    StatusCodes.CREATED,
  )
  async handle(
    @Params(ParamsSchema) params: ParamsType,
    @Query(ParamsSchema) query: ParamsType,
    @Headers() headers: Record<string, string>,
    @Body(ParamsSchema) body: ParamsType,
  ): Promise<any> {
    return {
      id: params.id,
    };
  }
}
