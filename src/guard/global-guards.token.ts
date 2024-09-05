import { InjectionToken } from '@stlmpp/di';
import { CanActivate } from './can-activate.interface.js';

export const GLOBAL_GUARDS = new InjectionToken<CanActivate>(
  'ST_HONO_APP_GLOBAL_GUARDS',
);
