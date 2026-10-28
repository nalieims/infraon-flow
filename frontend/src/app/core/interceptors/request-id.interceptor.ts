import { HttpInterceptorFn } from '@angular/common/http';

import { isApiRequest } from '../services/api.service';

export const REQUEST_ID_HEADER = 'X-Request-ID';

/** Adds a correlation id so frontend errors can be matched to backend logs (`request_id` in error responses). */
export const requestIdInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url) || req.headers.has(REQUEST_ID_HEADER)) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { [REQUEST_ID_HEADER]: crypto.randomUUID() } }));
};
