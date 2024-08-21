import { Injectable } from '@stlmpp/di';
import { HandlerContext } from '../src/handler-context.js';
import { CanActivate } from '../src/guard/can-activate.interface.js';

@Injectable()
export class Guard implements CanActivate {
  async handle(context: HandlerContext): Promise<boolean> {
    console.log(context);
    return false;
  }
}
