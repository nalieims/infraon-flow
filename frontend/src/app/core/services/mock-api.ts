/** Dummy-data helpers for feature services while the backend APIs are not built yet. */
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, delay, of, switchMap, throwError, timer } from 'rxjs';

import { ApiErrorResponse } from '../models/api-error.model';

/** Simulated network delay so loading and submitting states stay visible. */
export const MOCK_LATENCY_MS = 400;

/** Emits a copy of `value` after the simulated delay, like a successful API call. */
export function mockResponse<T>(value: T): Observable<T> {
  return of(structuredClone(value)).pipe(delay(MOCK_LATENCY_MS));
}

/** Fails after the simulated delay with the API's standard error envelope. */
export function mockError(status: number, error: ApiErrorResponse['error']): Observable<never> {
  return timer(MOCK_LATENCY_MS).pipe(
    switchMap(() =>
      throwError(
        () => new HttpErrorResponse({ status, statusText: 'Mock error', error: { error } }),
      ),
    ),
  );
}
