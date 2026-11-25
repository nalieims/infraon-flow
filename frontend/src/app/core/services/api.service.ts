import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

/** Query string values a GET request can send. */
export type QueryParams = Record<
  string,
  string | number | boolean | readonly (string | number | boolean)[]
>;

/**
 * Base class for every API service. Each module's service extends it and calls
 * `this.get`, `this.post`, … with a path relative to the API root that keeps Django's
 * trailing slash, for example `tags/`. Interceptors add the auth token, request id and
 * workspace header, so services never add them.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  protected readonly http = inject(HttpClient);

  /** GET `urlSuffix` with optional query params. */
  protected get<T>(urlSuffix: string, params: QueryParams = {}): Observable<T> {
    return this.http.get<T>(this.url(urlSuffix), {
      params: new HttpParams({ fromObject: params }),
    });
  }

  /**
   * POST `body` to `urlSuffix`.
   * Pass `{ withCredentials: true }` only for login, refresh and logout: it lets the browser
   * save and send the `infraon_refresh` cookie.
   */
  protected post<T>(
    urlSuffix: string,
    body: unknown = {},
    options: { withCredentials?: boolean } = {},
  ): Observable<T> {
    return this.http.post<T>(this.url(urlSuffix), body, options);
  }

  /** PUT `body` to `urlSuffix` (replace the whole record). */
  protected put<T>(urlSuffix: string, body: unknown = {}): Observable<T> {
    return this.http.put<T>(this.url(urlSuffix), body);
  }

  /** PATCH `body` to `urlSuffix` (change some fields). */
  protected patch<T>(urlSuffix: string, body: unknown = {}): Observable<T> {
    return this.http.patch<T>(this.url(urlSuffix), body);
  }

  /** DELETE `urlSuffix`. */
  protected delete<T>(urlSuffix: string): Observable<T> {
    return this.http.delete<T>(this.url(urlSuffix));
  }

  /** Full URL for a path relative to the API root. */
  private url(urlSuffix: string): string {
    return `${environment.apiBaseUrl}/${urlSuffix.replace(/^\/+/, '')}`;
  }
}

/** True when the request targets the Infraon Flow API (used by interceptors). */
export function isApiRequest(url: string): boolean {
  return url.startsWith(environment.apiBaseUrl);
}
