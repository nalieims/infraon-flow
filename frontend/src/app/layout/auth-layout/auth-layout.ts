import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Unauthenticated shell for login and registration. */
@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="mb-6 text-center text-2xl font-semibold text-slate-900">Infraon Flow</div>
        <router-outlet />
      </div>
    </div>
  `,
})
export class AuthLayout {}
