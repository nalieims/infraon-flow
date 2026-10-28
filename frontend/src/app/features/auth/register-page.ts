import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PagePlaceholder } from '../../shared/components/page-placeholder/page-placeholder';

@Component({
  selector: 'app-register-page',
  imports: [PagePlaceholder, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-placeholder title="Create account" description="Registration arrives with the authentication API (milestone M1).">
      <p class="mt-4 text-sm text-slate-600">
        Already have an account? <a routerLink="/login" class="underline">Sign in</a>
      </p>
    </app-page-placeholder>
  `,
})
export class RegisterPage {}
