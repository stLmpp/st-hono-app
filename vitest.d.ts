import { Exception } from './test-app/index.js';

interface CustomMatchers<R = unknown> {
  toThrowException(expected: Exception): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
