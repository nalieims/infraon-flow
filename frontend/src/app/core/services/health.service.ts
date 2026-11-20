import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HealthResponse } from '../models/health.model';
import { ApiService } from './api.service';

/** Checks that the API is reachable. */
@Injectable({ providedIn: 'root' })
export class HealthService extends ApiService {
  /** GET health/ */
  check(): Observable<HealthResponse> {
    return this.get<HealthResponse>('health/');
  }
}
