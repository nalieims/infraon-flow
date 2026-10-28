import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HealthResponse } from '../models/health.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly api = inject(ApiService);

  check(): Observable<HealthResponse> {
    return this.api.get<HealthResponse>('health/');
  }
}
