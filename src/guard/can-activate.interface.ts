import { HandlerContext } from '../handler-context.js';

export interface CanActivate {
  handle(context: HandlerContext): boolean | Promise<boolean>;
}
