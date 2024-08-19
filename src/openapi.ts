import type {
  ExamplesObject,
  HeadersObject,
  OpenAPIObject,
  OperationObject,
  ResponseObject,
} from 'openapi3-ts/oas30';
import { ControllerFullMetadata } from './get-controller-full-metadata.js';
import { generateSchema } from '@st-api/zod-openapi';
import { getReasonPhrase } from 'http-status-codes';
import {
  addMissingExceptionsOpenapi,
  UNKNOWN_INTERNAL_SERVER_ERROR,
  BAD_REQUEST_PARAMS,
  BAD_REQUEST_QUERY,
  BAD_REQUEST_BODY,
  INVALID_RESPONSE,
  ROUTE_NOT_FOUND,
  TOO_MANY_REQUESTS,
  ExceptionSchema,
  ExceptionFactory,
  Exception,
  arrayUniqBy,
} from '@st-api/core';
import { ZodObject } from 'zod';

export class Openapi {
  constructor(document: OpenAPIObject) {
    this.#document = document;
  }

  readonly #document: OpenAPIObject;

  addPath({
    controller,
    params,
    body,
    query,
    headers,
    response,
    exceptions,
  }: ControllerFullMetadata): this {
    let path = controller.path ?? '/';
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    const method = controller.method ?? 'GET';
    const pathOpenapi = path
      .split('/')
      .map((part) => {
        if (!part.startsWith(':')) {
          return part;
        }
        return `{${part.slice(1)}}`;
      })
      .join('/');
    const pathOperationId = path.replaceAll('/', '_').replaceAll(':', 'p~');
    const operation: OperationObject = {
      responses: {},
      operationId: `${method}-${pathOperationId}`,
    };
    this.#document.paths[pathOpenapi] = Object.assign(
      this.#document.paths[pathOpenapi] ?? {},
      { [method.toLowerCase()]: operation },
    );
    if (body?.schema) {
      operation.requestBody = {
        required: !body.schema.isOptional(),
        content: {
          'application/json': {
            schema: generateSchema(body.schema),
          },
        },
      };
    }
    operation.parameters ??= [];
    if (params?.schema) {
      for (const [key, value] of Object.entries(params.schema.shape)) {
        operation.parameters.push({
          name: key,
          required: !value.isOptional(),
          in: 'query',
          schema: generateSchema(value),
        });
      }
    }
    if (query?.schema) {
      for (const [key, value] of Object.entries(query.schema.shape)) {
        operation.parameters.push({
          name: key,
          required: !value.isOptional(),
          in: 'path',
          schema: generateSchema(value),
        });
      }
    }
    if (headers?.schema) {
      for (const [key, value] of Object.entries(headers.schema.shape)) {
        operation.parameters.push({
          name: key,
          required: !value.isOptional(),
          in: 'header',
          schema: generateSchema(value),
        });
      }
    }
    if (response) {
      operation.responses[response.statusCode] = {
        description: getReasonPhrase(response.statusCode),
        content: {
          'application/json': {
            schema: generateSchema(response.schema),
          },
        },
      } satisfies ResponseObject;
    }
    if (exceptions?.factories.length) {
      for (const exception of getOpenapiExceptions(exceptions.factories)) {
        operation.responses[exception.status] = exception;
      }
    }
    return this;
  }

  addMissingExceptions() {
    addMissingExceptionsOpenapi(this.#document, getOpenapiExceptions([]));
  }

  getDocument(): OpenAPIObject {
    return this.#document;
  }
}

// TODO all below already exists on core
const CORRELATION_ID_EXAMPLE = '66811850-87e9-493b-b956-0b563e69297d';
const EXCEPTION_OPENAPI_SCHEMA = generateSchema(ExceptionSchema);
export const COMMON_HEADERS_OPENAPI = {
  'x-correlation-id': {
    schema: {
      type: 'string',
      example: '66811850-87e9-493b-b956-0b563e69297d',
    },
    // TODO add description
  },
  'x-trace-id': {
    schema: {
      type: 'string',
      example: '66811850-87e9-493b-b956-0b563e69297d',
    },
    // TODO add description
  },
  'x-execution-id': {
    schema: {
      type: 'string',
      example: '66811850-87e9-493b-b956-0b563e69297d',
    },
    // TODO add description
  },
} as const satisfies HeadersObject;

export function getOpenapiExceptions(
  exceptionsOrFactories: Array<ExceptionFactory | Exception>,
) {
  const exceptions = [
    ...exceptionsOrFactories,
    UNKNOWN_INTERNAL_SERVER_ERROR,
    BAD_REQUEST_PARAMS,
    BAD_REQUEST_QUERY,
    BAD_REQUEST_BODY,
    INVALID_RESPONSE,
    ROUTE_NOT_FOUND,
    TOO_MANY_REQUESTS,
  ].map((exceptionOrFactory) =>
    exceptionOrFactory instanceof Exception
      ? exceptionOrFactory
      : exceptionOrFactory(''),
  );
  const statusList = arrayUniqBy(exceptions, (exception) =>
    exception.getStatus(),
  ).map((exception) => exception.getStatus());
  return statusList.map((status) => {
    const exceptionsStatus = exceptions.filter(
      (exception) => exception.getStatus() === status,
    );
    const examples: ExamplesObject = {};
    for (const exception of exceptionsStatus) {
      examples[exception.errorCode] = {
        value: {
          ...exception.toJSON(),
          correlationId: CORRELATION_ID_EXAMPLE,
          traceId: CORRELATION_ID_EXAMPLE,
        },
        description: exception.description,
      };
    }
    return {
      status,
      content: {
        'application/json': {
          schema: EXCEPTION_OPENAPI_SCHEMA,
          examples,
        },
      },
      description: getReasonPhrase(status),
      headers: COMMON_HEADERS_OPENAPI,
    };
  });
}
