import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NEVER, Subject, of, throwError } from 'rxjs';

import { AuthService } from '../../../../../core/auth/auth.service';
import { LoginResponse } from '../../../../../core/models/auth.model';
import { RegisterResponse } from '../../models/register.model';
import { SignupService } from '../../services/signup.service';
import { SignupPageComponent, quarterLabel } from './signup-page.component';

describe('SignupPageComponent', () => {
  const spyOnRegister = () => vi.spyOn(TestBed.inject(SignupService), 'register');
  const spyOnNavigate = () => vi.spyOn(TestBed.inject(Router), 'navigate');

  let fixture: ComponentFixture<SignupPageComponent>;
  let el: HTMLElement;
  let register: ReturnType<typeof spyOnRegister>;
  let navigate: ReturnType<typeof spyOnNavigate>;

  const input = (id: string) => el.querySelector<HTMLInputElement>(`#${id}`)!;
  const type = (id: string, value: string) => {
    const field = input(id);
    field.value = value;
    field.dispatchEvent(new Event('input'));
    field.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  };
  const submit = () => {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };
  const fillValid = () => {
    type('signup-full-name', 'Priya Raman');
    type('signup-email', 'priya.raman@infraonlabs.com');
    type('signup-password', 'abcdefghij1!');
    input('signup-terms').click();
    fixture.detectChanges();
  };
  // A successful register opens the dashboard, so step 2 is opened directly in these tests.
  const openStep2 = async () => {
    (fixture.componentInstance as unknown as { goToStep(step: 1 | 2): void }).goToStep(2);
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const goToStep2 = async () => {
    fillValid();
    await openStep2();
  };
  const button = (label: string) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent?.includes(label),
    )!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignupPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    // No test reaches a real server: register never answers unless a test says otherwise.
    register = spyOnRegister().mockReturnValue(NEVER);
    navigate = spyOnNavigate().mockResolvedValue(true);
    fixture = TestBed.createComponent(SignupPageComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  describe('layout', () => {
    it('shows the step 1 heading, subtitle and "What you get" list in the sidebar', () => {
      expect(el.querySelector('aside h2')?.textContent).toContain(
        "From quarterly goals to today's to-do list.",
      );
      expect(el.querySelector('aside')?.textContent).toContain(
        "Two short steps and you're on your Dashboard.",
      );
      expect(el.querySelector('aside [aria-label="What you get"]')).not.toBeNull();
    });

    it('marks step 1 current on the account step', () => {
      const items = el.querySelectorAll('ol[aria-label="Sign-up steps"] li');
      expect(items).toHaveLength(2);
      expect(items[0].getAttribute('aria-current')).toBe('step');
      expect(items[1].getAttribute('aria-current')).toBeNull();
      expect(items[0].textContent).toContain('Name, work email and password');
    });

    it('gives the brand an accessible name', () => {
      expect(el.querySelector('main p')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
        'Infraon Flow',
      );
    });
  });

  describe('step 1: account', () => {
    it('renders one h1 and the designed copy', () => {
      expect(el.querySelectorAll('h1')).toHaveLength(1);
      expect(el.querySelector('h1')?.textContent).toContain('Create your account');
      expect(el.textContent).toContain('Step 1 of 2 · Account');
      expect(el.textContent).not.toContain('6-digit code');
    });

    it('sets input types and autocomplete', () => {
      expect(input('signup-email').type).toBe('email');
      expect(input('signup-email').getAttribute('autocomplete')).toBe('email');
      expect(input('signup-password').type).toBe('password');
      expect(input('signup-password').getAttribute('autocomplete')).toBe('new-password');
    });

    it('shows required errors on submit and focuses the first invalid field', () => {
      submit();
      expect(el.textContent).toContain('Enter your full name.');
      expect(el.textContent).toContain('Enter your work email.');
      expect(el.textContent).toContain('Enter a password.');
      expect(el.textContent).toContain(
        'Agree to the Terms of Service and Privacy Policy to continue.',
      );
      expect(document.activeElement).toBe(input('signup-full-name'));
      expect(input('signup-full-name').getAttribute('aria-invalid')).toBe('true');
      expect(input('signup-full-name').getAttribute('aria-describedby')).toBe(
        'signup-full-name-error',
      );
      expect(el.querySelector('h1')?.textContent).toContain('Create your account');
    });

    it('shows the designed domain-ending error after blur and clears it when fixed', () => {
      type('signup-email', 'priya.raman@infraonlabs');
      expect(el.querySelector('#signup-email-error')?.textContent).toContain(
        'Add the domain ending, e.g. name@company.com.',
      );
      expect(input('signup-email').getAttribute('aria-describedby')).toBe('signup-email-error');

      type('signup-email', 'priya.raman@infraonlabs.com');
      expect(el.querySelector('#signup-email-error')).toBeNull();
      expect(input('signup-email').getAttribute('aria-invalid')).toBeNull();
    });

    it('rejects a malformed email and a whitespace-only name', () => {
      type('signup-email', 'priya.raman');
      type('signup-full-name', '   ');
      expect(el.querySelector('#signup-email-error')?.textContent).toContain(
        'Enter a valid email address, e.g. name@company.com.',
      );
      expect(el.querySelector('#signup-full-name-error')?.textContent).toContain(
        'Enter your full name.',
      );
    });

    it.each(['Asha Reddy', 'Mary-Jane', "O'Connor", 'Mary Jane O’Neil-Smith', 'Asha 2', 'José'])(
      'accepts the name %s',
      (name) => {
        type('signup-full-name', name);
        expect(el.querySelector('#signup-full-name-error')).toBeNull();
        expect(input('signup-full-name').getAttribute('aria-invalid')).toBeNull();
      },
    );

    it.each(['12345', '123 456'])(
      'rejects the name %s as only numbers and stays on step 1',
      (name) => {
        fillValid();
        type('signup-full-name', name);
        submit();
        expect(el.querySelector('#signup-full-name-error')?.textContent).toContain(
          'Your name can’t be only numbers.',
        );
        expect(input('signup-full-name').getAttribute('aria-describedby')).toBe(
          'signup-full-name-error',
        );
        expect(el.querySelector('h1')?.textContent).toContain('Create your account');
        expect(document.activeElement).toBe(input('signup-full-name'));
        expect(register).not.toHaveBeenCalled();
      },
    );

    it('allows 150 characters in the name and rejects 151', () => {
      type('signup-full-name', 'a'.repeat(150));
      expect(el.querySelector('#signup-full-name-error')).toBeNull();

      type('signup-full-name', 'a'.repeat(151));
      expect(el.querySelector('#signup-full-name-error')?.textContent).toContain(
        'Use 150 characters or fewer.',
      );
    });

    it('rejects a pasted invalid name and clears the error once fixed', () => {
      const field = input('signup-full-name');
      field.value = '12345';
      field.dispatchEvent(new Event('paste'));
      field.dispatchEvent(new Event('input'));
      field.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(el.querySelector('#signup-full-name-error')).not.toBeNull();

      type('signup-full-name', 'Asha');
      expect(el.querySelector('#signup-full-name-error')).toBeNull();
    });

    it('updates the strength meter as the password changes', () => {
      type('signup-password', 'abc');
      expect(el.querySelector('#signup-password-error')?.textContent).toContain(
        'Use at least 10 characters.',
      );
      expect(input('signup-password').getAttribute('aria-invalid')).toBe('true');

      type('signup-password', 'abcdefghij1!');
      expect(el.querySelector('#signup-password-hint')?.textContent).toContain(
        'Strong. At least 10 characters with a number and a symbol.',
      );
      expect(
        el
          .querySelector('[role="img"][aria-label^="Password strength"]')
          ?.getAttribute('aria-label'),
      ).toBe('Password strength: strong');
    });

    it.each([
      ['abcdefghij', 'Weak.', null],
      ['abcdefghij1', 'Fair.', null],
      ['abcdefgh1!', 'Strong.', null],
      ['Abcdefgh1!', 'Very strong.', null],
    ])(
      'rates %s as %s (10 characters is enough; number and symbol only raise the rating)',
      (password, label, invalid) => {
        type('signup-password', password);
        expect(el.querySelector('#signup-password-hint')?.textContent).toContain(label);
        expect(input('signup-password').getAttribute('aria-invalid')).toBe(invalid);
      },
    );

    it('shows the minimum-length error under 10 characters and accepts 10 without a number or symbol', () => {
      type('signup-password', 'abcdefghi');
      expect(el.querySelector('#signup-password-error')?.textContent).toContain(
        'Use at least 10 characters.',
      );
      expect(input('signup-password').getAttribute('aria-describedby')).toBe(
        'signup-password-error',
      );

      type('signup-password', 'abcdefghij');
      expect(el.querySelector('#signup-password-error')).toBeNull();
      expect(input('signup-password').getAttribute('aria-invalid')).toBeNull();
    });

    it('toggles password visibility with an accessible name', () => {
      const toggle = el.querySelector<HTMLButtonElement>(
        'button[aria-controls="signup-password"]',
      )!;
      expect(toggle.getAttribute('aria-label')).toBe('Show password');
      toggle.click();
      fixture.detectChanges();
      expect(input('signup-password').type).toBe('text');
      expect(toggle.getAttribute('aria-label')).toBe('Hide password');
      expect(toggle.getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('register API', () => {
    const user: RegisterResponse = {
      id: '6f05d3ec-b9df-4a35-ae95-5e67fb98d0c0',
      email: 'priya.raman@infraonlabs.com',
      full_name: 'Priya Raman',
      timezone: 'Asia/Kolkata',
    };
    const failWith = (status: number, body: unknown = null) =>
      throwError(() => new HttpErrorResponse({ status, error: body }));
    const invalid = (details: Record<string, unknown>) =>
      failWith(400, {
        error: {
          code: 'validation_error',
          message: 'The request contains invalid fields.',
          details,
          request_id: null,
        },
      });
    const submitButton = () => el.querySelector<HTMLButtonElement>('form button[type="submit"]')!;
    const formError = () => el.querySelector('#signup-form-error')?.textContent?.trim();

    it('sends trimmed name and email, an untouched password and a boolean accept_terms', () => {
      type('signup-full-name', '  Priya Raman  ');
      type('signup-email', ' priya.raman@infraonlabs.com ');
      type('signup-password', ' abcdefghij1! ');
      input('signup-terms').click();
      submit();

      expect(register).toHaveBeenCalledTimes(1);
      expect(register).toHaveBeenCalledWith({
        full_name: 'Priya Raman',
        email: 'priya.raman@infraonlabs.com',
        password: ' abcdefghij1! ',
        accept_terms: true,
      });
    });

    it('does not call the API while the form is invalid', () => {
      submit();
      expect(register).not.toHaveBeenCalled();
    });

    it('after a 201, logs in with the same email and password, then goes to the dashboard', () => {
      const loginResponse: LoginResponse = { access: 'access-token', user };
      const login = vi
        .spyOn(TestBed.inject(AuthService), 'login')
        .mockReturnValue(of(loginResponse));
      register.mockReturnValue(of(user));
      fillValid();
      submit();

      expect(login).toHaveBeenCalledWith({
        email: 'priya.raman@infraonlabs.com',
        password: 'abcdefghij1!',
      });
      expect(navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('goes to Sign in when the background login fails after a 201', () => {
      vi.spyOn(TestBed.inject(AuthService), 'login').mockReturnValue(failWith(401));
      register.mockReturnValue(of(user));
      fillValid();
      submit();

      expect(navigate).toHaveBeenCalledWith(['/login']);
      expect(navigate).not.toHaveBeenCalledWith(['/dashboard']);
      expect(formError()).toBeUndefined();
    });

    it('shows each 400 field message under its field, focuses the first, and clears it on edit', () => {
      register.mockReturnValue(
        invalid({
          email: ['A user with this email address already exists.'],
          password: ['This password is too common.'],
        }),
      );
      fillValid();
      submit();

      expect(el.querySelector('#signup-email-error')?.textContent).toContain(
        'A user with this email address already exists.',
      );
      expect(el.querySelector('#signup-password-error')?.textContent).toContain(
        'This password is too common.',
      );
      expect(input('signup-email').getAttribute('aria-describedby')).toBe('signup-email-error');
      expect(document.activeElement).toBe(input('signup-email'));
      expect(navigate).not.toHaveBeenCalled();

      type('signup-email', 'other.person@infraonlabs.com');
      expect(el.querySelector('#signup-email-error')).toBeNull();
      expect(el.querySelector('#signup-password-error')).not.toBeNull();
    });

    it.each([
      ['This field is required.', 'Enter your full name.'],
      ['This field may not be blank.', 'Enter your full name.'],
      ['Ensure this field has no more than 150 characters.', 'Use 150 characters or fewer.'],
      ['Some other server rule.', 'Some other server rule.'],
    ])('shows the full name server message "%s" as "%s"', (serverMessage, shown) => {
      register.mockReturnValue(invalid({ full_name: [serverMessage] }));
      fillValid();
      submit();

      expect(el.querySelector('#signup-full-name-error')?.textContent).toContain(shown);
      expect(document.activeElement).toBe(input('signup-full-name'));
    });

    it('shows a terms error from the server under the terms checkbox', () => {
      register.mockReturnValue(
        invalid({ accept_terms: ['You must accept the Terms of Service to create an account.'] }),
      );
      fillValid();
      submit();

      expect(el.querySelector('#signup-terms-error')?.textContent).toContain(
        'You must accept the Terms of Service to create an account.',
      );
    });

    it('shows errors that belong to no field above the form, with a fallback message', () => {
      register.mockReturnValue(invalid({ non_field_errors: ['Something is off.'] }));
      fillValid();
      submit();
      expect(formError()).toBe('Something is off.');

      register.mockReturnValue(invalid({}));
      submit();
      expect(formError()).toBe('The request contains invalid fields.');
    });

    it.each([
      [429, 'Too many registration attempts. Please try again later.'],
      [0, 'Unable to connect. Please check your internet connection and try again.'],
      [500, 'Something went wrong. Please try again later.'],
      [503, 'Something went wrong. Please try again later.'],
    ])('shows the message for HTTP status %i', (status, message) => {
      register.mockReturnValue(failWith(status));
      fillValid();
      submit();

      expect(formError()).toBe(message);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('disables the button while the request runs and ignores a second submit', () => {
      const pending = new Subject<RegisterResponse>();
      register.mockReturnValue(pending);
      fillValid();
      expect(submitButton().textContent?.trim()).toBe('Create account');

      submit();
      expect(submitButton().disabled).toBe(true);
      expect(submitButton().textContent?.trim()).toBe('Creating account...');

      submit();
      expect(register).toHaveBeenCalledTimes(1);

      pending.error(new HttpErrorResponse({ status: 500 }));
      fixture.detectChanges();
      expect(submitButton().disabled).toBe(false);
      expect(submitButton().textContent?.trim()).toBe('Create account');
      expect(formError()).toBe('Something went wrong. Please try again later.');
    });
  });

  describe('step switching', () => {
    it('opens step 2 in place, without navigating', async () => {
      await goToStep2();

      expect(el.querySelector('h1')?.textContent).toContain('Set up your workspace');
      expect(el.textContent).toContain('Step 2 of 2 · Workspace');
      expect(navigate).not.toHaveBeenCalled();
    });

    it('stays on step 1 while step 1 is invalid', () => {
      submit();
      expect(el.querySelector('h1')?.textContent).toContain('Create your account');
      expect(el.textContent).not.toContain('Step 2 of 2 · Workspace');
    });

    it('moves focus to the first field of the new step in each direction', async () => {
      await goToStep2();
      expect(document.activeElement).toBe(input('signup-workspace-name'));

      button('Back').click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(document.activeElement).toBe(input('signup-full-name'));
    });

    it('greets the user and marks step 1 done in the sidebar on step 2', async () => {
      await goToStep2();
      expect(el.querySelector('aside h2')?.textContent).toContain('Almost there, Priya.');
      expect(el.querySelector('aside')?.textContent).toContain(
        'priya.raman@infraonlabs.com · confirmed',
      );
      expect(el.querySelector('aside')?.textContent).toContain('Completed:');
      const items = el.querySelectorAll('ol[aria-label="Sign-up steps"] li');
      expect(items[1].getAttribute('aria-current')).toBe('step');
      expect(el.querySelector('aside #signup-next-heading')).not.toBeNull();
    });

    it('keeps step 1 and step 2 values when going Back and forward', async () => {
      await goToStep2();
      type('signup-workspace-name', 'Infraon Labs');
      el.querySelector<HTMLInputElement>('input[value="personal"]')!.click();
      fixture.detectChanges();

      button('Back').click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(el.querySelector('h1')?.textContent).toContain('Create your account');
      expect(input('signup-full-name').value).toBe('Priya Raman');
      expect(input('signup-terms').checked).toBe(true);
      expect(document.activeElement).toBe(input('signup-full-name'));

      await openStep2();
      expect(input('signup-workspace-name').value).toBe('Infraon Labs');
      expect(el.querySelector<HTMLInputElement>('input[value="personal"]')!.checked).toBe(true);
    });
  });

  describe('step 2: workspace', () => {
    beforeEach(async () => {
      await goToStep2();
    });

    it('defaults to Business and shows role, team size and invites', () => {
      expect(el.querySelector<HTMLInputElement>('input[value="business"]')!.checked).toBe(true);
      expect(el.querySelector('#signup-invites')).not.toBeNull();
      expect(el.querySelector('p-select')).not.toBeNull();
      expect(el.querySelectorAll('input[formcontrolname="teamSize"]')).toHaveLength(4);
    });

    it('hides team fields for a personal workspace', () => {
      el.querySelector<HTMLInputElement>('input[value="personal"]')!.click();
      fixture.detectChanges();
      expect(el.querySelector('#signup-invites')).toBeNull();
      expect(el.querySelector('p-select')).toBeNull();
    });

    it('switches the sidebar and hints to the personal copy', () => {
      el.querySelector<HTMLInputElement>('input[value="personal"]')!.click();
      fixture.detectChanges();
      const aside = el.querySelector('aside')!.textContent!;
      expect(aside).toContain('A personal workspace is just for you.');
      expect(aside).toContain('Personal · private to you');
      expect(aside).toContain('You land on My Day, ready to plan today.');
      expect(aside).toContain('No one else can see or join this workspace.');
      expect(aside).not.toContain('Invited teammates');
      expect(el.querySelector('#signup-workspace-name-hint')?.textContent).toContain(
        'Only you see this name',
      );
      expect(el.textContent).toContain("Personal workspaces don't have");
    });

    it('toggles focus chips with aria-pressed and defaults the weekly reminder on', () => {
      el.querySelector<HTMLInputElement>('input[value="personal"]')!.click();
      fixture.detectChanges();
      expect(input('signup-weekly-reminder').checked).toBe(true);

      const chip = () => button('Learning');
      expect(chip().getAttribute('aria-pressed')).toBe('false');
      chip().click();
      fixture.detectChanges();
      expect(chip().getAttribute('aria-pressed')).toBe('true');
      chip().click();
      fixture.detectChanges();
      expect(chip().getAttribute('aria-pressed')).toBe('false');
      expect(el.querySelectorAll('button[aria-pressed]')).toHaveLength(5);
    });

    it('hides the personal-only fields for a business workspace', () => {
      expect(el.querySelector('#signup-weekly-reminder')).toBeNull();
      expect(el.querySelectorAll('button[aria-pressed]')).toHaveLength(0);
    });

    it('requires a workspace name, linked by aria-describedby, and focuses it', () => {
      submit();
      expect(el.querySelector('#signup-workspace-name-error')?.textContent).toContain(
        'Enter a workspace name.',
      );
      expect(input('signup-workspace-name').getAttribute('aria-invalid')).toBe('true');
      expect(input('signup-workspace-name').getAttribute('aria-describedby')).toBe(
        'signup-workspace-name-error',
      );
      expect(document.activeElement).toBe(input('signup-workspace-name'));

      type('signup-workspace-name', 'Infraon Labs');
      expect(el.querySelector('#signup-workspace-name-error')).toBeNull();
    });

    it('rejects a whitespace-only workspace name', () => {
      type('signup-workspace-name', '   ');
      expect(el.querySelector('#signup-workspace-name-error')?.textContent).toContain(
        'Enter a workspace name.',
      );
    });

    it('adds invited emails as chips', () => {
      const field = input('signup-invites');
      field.value = 'arjun@labs.com';
      field.dispatchEvent(new Event('input'));
      field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      fixture.detectChanges();
      expect(el.textContent).toContain('arjun@labs.com');
    });

    it('accepts a valid name and stays on step 2 without navigating', () => {
      type('signup-workspace-name', 'Infraon Labs');
      submit();
      expect(el.querySelector('#signup-workspace-name-error')).toBeNull();
      expect(el.querySelector('h1')?.textContent).toContain('Set up your workspace');
      expect(navigate).not.toHaveBeenCalled();
    });
  });
});

describe('quarterLabel', () => {
  it.each([
    [new Date(2026, 10, 2), 'Q4 2026 (1 Oct – 31 Dec)'],
    [new Date(2026, 0, 1), 'Q1 2026 (1 Jan – 31 Mar)'],
    [new Date(2026, 5, 30), 'Q2 2026 (1 Apr – 30 Jun)'],
    [new Date(2026, 6, 1), 'Q3 2026 (1 Jul – 30 Sep)'],
  ])('labels %s', (date, label) => {
    expect(quarterLabel(date)).toBe(label);
  });
});
