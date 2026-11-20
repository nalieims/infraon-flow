import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../../core/services/api.service';
import { RegisterRequest, RegisterResponse } from '../models/register.model';

/** Sign-up API calls. The page component owns form state; this service only talks to the server. */
@Injectable({ providedIn: 'root' })
export class SignupService extends ApiService {
  /** POST auth/register/ (public). Resolves with 201 and the new user; sends no token. */
  register(body: RegisterRequest): Observable<RegisterResponse> {
    return this.post<RegisterResponse>('auth/register/', body);
  }
}
