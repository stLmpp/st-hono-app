import { exception } from '@st-api/core';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

export const FORBIDDEN = exception({
  errorCode: 'CORE-00XX', // TODO define
  error: getReasonPhrase(StatusCodes.FORBIDDEN),
  message: getReasonPhrase(StatusCodes.FORBIDDEN),
  status: 403,
});
