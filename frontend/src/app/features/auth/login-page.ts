import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PagePlaceholder } from '../../shared/components/page-placeholder/page-placeholder';

@Component({
  selector: 'app-login-page',
  imports: [PagePlaceholder, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-placeholder title="Sign in" description="Email and password sign-in arrives with the authentication API (milestone M1).">
      <p class="mt-4 text-sm text-slate-600">
        New to Infraon Flow? <a routerLink="/register" class="underline">Create an account</a>
      </p>
    </app-page-placeholder>
  `,
})
export class LoginPage {}
