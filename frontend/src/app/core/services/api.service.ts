import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

type QueryParams = Record<string, string | number | boolean | readonly (string | number | boolean)[]>;

/**
 * Thin typed wrapper around HttpClient for the versioned Infraon Flow API.
 * Feature services build on this instead of hard-coding the API base URL.
 * Paths are relative to the API root and keep Django's trailing slash, e.g. `tasks/`.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  get<T>(path: string, params?: QueryParams): Observable<T> {
    return this.http.get<T>(this.url(path), { params: params ? new HttpParams({ fromObject: params }) : undefined });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(this.url(path), body);
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(this.url(path), body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path));
  }

  private url(path: string): string {
    return `${environment.apiBaseUrl}/${path.replace(/^\/+/, '')}`;
  }
}

/** True when the request targets the Infraon Flow API (used by interceptors). */
export function isApiRequest(url: string): boolean {
  return url.startsWith(environment.apiBaseUrl);
}
