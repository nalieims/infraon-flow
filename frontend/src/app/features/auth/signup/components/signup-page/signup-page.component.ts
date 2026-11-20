import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { EMPTY, catchError, map } from 'rxjs';

import { ApiErrorResponse } from '../../../../../core/models/api-error.model';
import { EmailChipsInputComponent } from '../../../../../shared/components/email-chips-input/email-chips-input.component';
import { FieldErrorComponent } from '../../../../../shared/components/field-error/field-error.component';
import { workEmailValidator } from '../../../../../shared/utils/email-validators';
import {
  notBlankValidator,
  notOnlyNumbersValidator,
} from '../../../../../shared/utils/form-validators';
import { PASSWORD_MIN_LENGTH } from '../../../../../shared/utils/password-validators';
import { passwordStrength } from '../../../../../shared/utils/password-strength';
import { RegisterRequest } from '../../models/register.model';
import { SignupService } from '../../services/signup.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Step 1 is "Create your account", step 2 is "Set up your workspace". */
export type SignupStep = 1 | 2;

type WorkspaceType = 'business' | 'personal';
type WorkspaceRole = 'admin' | 'team_lead' | 'member';
type TeamSize = '1-10' | '11-50' | '51-200' | '200+';

/** Topics a personal workspace can focus on (step 2, personal only). */
export type FocusArea =
  'career_growth' | 'learning' | 'health_fitness' | 'side_project' | 'personal_finance';

/** One row in the step list on the left panel. */
interface StepItem {
  id: SignupStep;
  title: string;
  description: string;
  state: 'done' | 'current' | 'upcoming';
}

/** The four fields of the step 1 form. */
type Field = 'fullName' | 'email' | 'password' | 'terms';

/** Error messages for each step 1 field, keyed by field. */
type FieldMessages = Partial<Record<Field, string>>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Step 1 fields from top to bottom. Used to focus the first field with a problem. */
const FIELD_ORDER: readonly Field[] = ['fullName', 'email', 'password', 'terms'];

/** HTML `id` of each step 1 input (the template uses these too). */
const FIELD_IDS: Record<Field, string> = {
  fullName: 'signup-full-name',
  email: 'signup-email',
  password: 'signup-password',
  terms: 'signup-terms',
};

/** HTML `id` of the workspace name input on step 2. */
const WORKSPACE_NAME_ID = 'signup-workspace-name';

/** The API names fields in snake_case. This maps each API name to our form field. */
const FIELD_BY_API_KEY: Record<string, Field> = {
  full_name: 'fullName',
  email: 'email',
  password: 'password',
  accept_terms: 'terms',
};

/**
 * The message to show for each validation error, per field.
 * Example: when `fullName` has the `required` error we show "Enter your full name."
 */
const MESSAGES: Record<Field, Record<string, string>> = {
  fullName: {
    required: 'Enter your full name.',
    maxlength: 'Use 150 characters or fewer.',
    onlyNumbers: 'Your name can’t be only numbers.',
  },
  email: {
    required: 'Enter your work email.',
    email: 'Enter a valid email address, e.g. name@company.com.',
    domainEnding: 'Add the domain ending, e.g. name@company.com.',
  },
  password: {
    required: 'Enter a password.',
    minlength: `Use at least ${PASSWORD_MIN_LENGTH} characters.`,
  },
  terms: { required: 'Agree to the Terms of Service and Privacy Policy to continue.' },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ---------------------------------------------------------------------------
// Helper functions (plain functions, no component state)
// ---------------------------------------------------------------------------

/** Label for the quarter that contains `date`, for example "Q4 2026 (1 Oct – 31 Dec)". */
export function quarterLabel(date: Date): string {
  const year = date.getFullYear();
  const quarterIndex = Math.floor(date.getMonth() / 3); // 0 to 3
  const firstMonth = quarterIndex * 3; // 0 = Jan, 3 = Apr, 6 = Jul, 9 = Oct
  const lastMonth = firstMonth + 2;
  // Day 0 of the next month is the last day of `lastMonth`.
  const lastDay = new Date(year, lastMonth + 1, 0).getDate();
  return `Q${quarterIndex + 1} ${year} (1 ${MONTHS[firstMonth]} – ${lastDay} ${MONTHS[lastMonth]})`;
}

/**
 * The server sends a field error either as text or as a list of texts.
 * This returns the first text, or null if there is nothing to show.
 */
function firstMessage(value: unknown): string | null {
  const first = Array.isArray(value) ? value[0] : value;
  if (typeof first !== 'string' || first.trim() === '') {
    return null;
  }
  return first;
}

/**
 * Uses our own wording for the full-name errors the server can return, so the user sees the
 * same text whether the browser or the server found the problem. Other messages stay as sent.
 */
function frontendMessage(field: Field, serverMessage: string): string {
  if (field !== 'fullName') {
    return serverMessage;
  }
  if (/required|blank/i.test(serverMessage)) {
    return MESSAGES.fullName['required'];
  }
  if (/no more than \d+ characters/i.test(serverMessage)) {
    return MESSAGES.fullName['maxlength'];
  }
  return serverMessage;
}

/** Message for a failed request that is not a field error (any status except 400). */
function generalErrorMessage(status: number): string {
  if (status === 429) {
    return 'Too many registration attempts. Please try again later.';
  }
  if (status === 0) {
    // Status 0 means no response at all: offline, server down, or blocked.
    return 'Unable to connect. Please check your internet connection and try again.';
  }
  return 'Something went wrong. Please try again later.';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Two-step sign-up page on one route (/register).
 * Step 1 creates the account with `POST auth/register/` and then opens the dashboard.
 * Step 2 (workspace setup) only validates in the browser; it is not connected to the API yet.
 */
@Component({
  selector: 'app-signup-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    SelectModule,
    FieldErrorComponent,
    EmailChipsInputComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './signup-page.component.html',
  styleUrl: './signup-page.component.css',
  host: { class: 'block' },
})
export class SignupPageComponent {
  // ----- Injected services -----
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly signupService = inject(SignupService);
  private readonly router = inject(Router);

  // ----- Static data used by the template -----
  protected readonly ids = FIELD_IDS;
  protected readonly year = new Date().getFullYear();
  /** The quarter shown as "becomes your first OKR period". */
  protected readonly firstPeriod = quarterLabel(new Date());

  protected readonly roleOptions: { label: string; value: WorkspaceRole }[] = [
    { label: 'Admin', value: 'admin' },
    { label: 'Team Lead', value: 'team_lead' },
    { label: 'Member', value: 'member' },
  ];

  protected readonly teamSizes: { label: string; value: TeamSize }[] = [
    { label: '1–10', value: '1-10' },
    { label: '11–50', value: '11-50' },
    { label: '51–200', value: '51-200' },
    { label: '200+', value: '200+' },
  ];

  protected readonly focusOptions: { label: string; value: FocusArea }[] = [
    { label: 'Career growth', value: 'career_growth' },
    { label: 'Learning', value: 'learning' },
    { label: 'Health & fitness', value: 'health_fitness' },
    { label: 'Side project', value: 'side_project' },
    { label: 'Personal finance', value: 'personal_finance' },
  ];

  // ----- Forms -----

  /** Step 1: account details. */
  protected readonly accountForm = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        notBlankValidator,
        Validators.maxLength(150),
        notOnlyNumbersValidator,
      ],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, workEmailValidator],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)],
    }),
    terms: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });

  /** Step 2: workspace details. */
  protected readonly workspaceForm = new FormGroup({
    workspaceType: new FormControl<WorkspaceType>('business', { nonNullable: true }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, notBlankValidator],
    }),
    role: new FormControl<WorkspaceRole | null>(null),
    teamSize: new FormControl<TeamSize | null>(null),
    weeklyReminder: new FormControl(true, { nonNullable: true }),
  });

  // ----- Page state (signals) -----

  /** Which step is on screen. */
  protected readonly step = signal<SignupStep>(1);
  /** True after the user pressed "Create account" at least once. */
  protected readonly accountSubmitted = signal(false);
  /** True after the user pressed the step 2 submit button at least once. */
  protected readonly workspaceSubmitted = signal(false);
  /** True while the register request is waiting for the server. */
  protected readonly submitting = signal(false);
  /** Whether the password is shown as plain text. */
  protected readonly passwordVisible = signal(false);
  /** Email addresses to invite (step 2, business only). */
  protected readonly invites = signal<string[]>([]);
  /** Focus areas the user picked (step 2, personal only). */
  protected readonly focusAreas = signal<readonly FocusArea[]>([]);
  /** Field errors returned by the server. A field's message is removed when the user edits it. */
  private readonly serverErrors = signal<FieldMessages>({});
  /** Server error that belongs to no single field. Shown above the form. */
  protected readonly formError = signal<string | null>(null);

  // ----- Form values as signals -----
  // Reactive forms do not use signals, so `computed()` cannot see their changes by itself.
  // These signals update whenever a form changes, so the computed values below re-run.

  /** Changes on every step 1 form event (typing, blur, validation). */
  private readonly accountFormChanged = toSignal(this.accountForm.events);
  /** Changes on every step 2 form event (typing, blur, validation). */
  private readonly workspaceFormChanged = toSignal(this.workspaceForm.events);
  /** The current password text. */
  private readonly passwordValue = toSignal(this.accountForm.controls.password.valueChanges, {
    initialValue: '',
  });
  /** The current workspace type: business or personal. */
  private readonly workspaceType = toSignal(
    this.workspaceForm.controls.workspaceType.valueChanges,
    { initialValue: 'business' },
  );

  // ----- Values derived from state (computed) -----

  /** True when the user chose a business workspace on step 2. */
  protected readonly isBusiness = computed(() => this.workspaceType() === 'business');

  /** First word of the full name, for example "Priya" from "Priya Raman". */
  protected readonly firstName = computed(() => {
    this.accountFormChanged();
    const fullName = this.accountForm.controls.fullName.value.trim();
    return fullName.split(/\s+/)[0];
  });

  /** The email typed on step 1, shown in the step list on step 2. */
  protected readonly accountEmail = computed(() => {
    this.accountFormChanged();
    return this.accountForm.controls.email.value.trim();
  });

  /** Text on the step 1 submit button. */
  protected readonly submitLabel = computed(() => {
    if (this.submitting()) {
      return 'Creating account...';
    }
    return 'Create account';
  });

  /** Big heading on the left panel. */
  protected readonly heading = computed(() => {
    if (this.step() === 1) {
      return "From quarterly goals to today's to-do list.";
    }
    if (this.firstName()) {
      return `Almost there, ${this.firstName()}.`;
    }
    return 'Almost there.';
  });

  /** Line under the heading on the left panel. */
  protected readonly subtitle = computed(() => {
    if (this.step() === 1) {
      return "Two short steps and you're on your Dashboard.";
    }
    if (this.isBusiness()) {
      return "Tell us how you'll use Infraon Flow. You can add more workspaces later.";
    }
    return 'A personal workspace is just for you. Everything in it stays private.';
  });

  /** Width of the form column on large screens, in px. Step 2 has more fields, so it is wider. */
  protected readonly contentWidth = computed(() => (this.step() === 1 ? 420 : 520));

  /** Padding of the form area on large screens (from the design of each step). */
  protected readonly mainClass = computed(() =>
    this.step() === 1 ? 'lg:p-12' : 'lg:px-12 lg:py-10',
  );

  /** The two rows of the step list on the left panel. */
  protected readonly steps = computed<StepItem[]>(() => {
    const onStepTwo = this.step() === 2;

    let accountDescription = 'Name, work email and password';
    if (onStepTwo) {
      accountDescription = `${this.accountEmail()} · confirmed`;
    }

    let workspaceDescription = 'Business or personal, and who to invite';
    if (onStepTwo && !this.isBusiness()) {
      workspaceDescription = 'Personal · private to you';
    }

    return [
      {
        id: 1,
        title: 'Create your account',
        description: accountDescription,
        state: onStepTwo ? 'done' : 'current',
      },
      {
        id: 2,
        title: 'Set up your workspace',
        description: workspaceDescription,
        state: onStepTwo ? 'current' : 'upcoming',
      },
    ];
  });

  /** Focus area options, each marked as selected or not. Used to draw the chips. */
  protected readonly focusChips = computed(() => {
    const picked = this.focusAreas();
    return this.focusOptions.map((option) => ({
      label: option.label,
      value: option.value,
      selected: picked.includes(option.value),
    }));
  });

  // ----- Password strength meter -----

  /** How strong the password is (weak, fair, strong, very strong). */
  protected readonly strength = computed(() => passwordStrength(this.passwordValue()));

  /** The rule shown next to the meter. Starts with "Use" while the password is too weak. */
  protected readonly strengthRule = computed(() => {
    if (this.strength().tone === 'warn') {
      return `Use at least ${PASSWORD_MIN_LENGTH} characters with a number and a symbol.`;
    }
    return `At least ${PASSWORD_MIN_LENGTH} characters with a number and a symbol.`;
  });

  /** Text read out by screen readers for the meter, for example "Password strength: weak". */
  protected readonly strengthAria = computed(() => {
    const label = this.strength().label; // for example "Weak." or "" when empty
    if (!label) {
      return 'Password strength: not set';
    }
    const level = label.replace('.', '').toLowerCase();
    return `Password strength: ${level}`;
  });

  // ----- Error messages shown under the fields -----

  /**
   * The error shown under each step 1 field, or null for no error.
   * A server error wins over a browser error for the same field.
   */
  protected readonly errors = computed(() => {
    this.accountFormChanged();
    const server = this.serverErrors();
    return {
      fullName: server.fullName ?? this.browserMessage('fullName'),
      email: server.email ?? this.browserMessage('email'),
      password: server.password ?? this.browserMessage('password'),
      terms: server.terms ?? this.browserMessage('terms'),
    };
  });

  /** The error shown under the workspace name on step 2, or null. */
  protected readonly nameError = computed(() => {
    this.workspaceFormChanged();
    const control = this.workspaceForm.controls.name;
    const userWasHere = this.workspaceSubmitted() || control.touched;
    if (control.valid || !userWasHere) {
      return null;
    }
    return 'Enter a workspace name.';
  });

  constructor() {
    // When the user edits a field, remove the server's message for that field.
    for (const field of FIELD_ORDER) {
      // Typed as AbstractControl so text and checkbox controls can share this one line.
      const control: AbstractControl = this.accountForm.controls[field];
      control.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.clearServerError(field));
    }
  }

  // ----- Actions called from the template -----

  /** Shows or hides the password text. */
  protected togglePassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  /** Adds a focus area if it is not picked yet, or removes it if it is. */
  protected toggleFocus(area: FocusArea): void {
    this.focusAreas.update((areas) => {
      if (areas.includes(area)) {
        return areas.filter((item) => item !== area);
      }
      return [...areas, area];
    });
  }

  /** Step 1 submit: checks the form, then sends it to the API. */
  protected submitAccount(): void {
    // Ignore extra clicks while a request is already running.
    if (this.submitting()) {
      return;
    }

    this.accountSubmitted.set(true);
    this.accountForm.markAllAsTouched();
    if (this.accountForm.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    const formValue = this.accountForm.getRawValue();
    const body: RegisterRequest = {
      full_name: formValue.fullName.trim(),
      email: formValue.email.trim(),
      password: formValue.password,
      accept_terms: formValue.terms,
    };
    this.registerAccount(body);
  }

  /** Step 2 submit: checks the form. Creating the workspace is not connected to the API yet. */
  protected submitWorkspace(): void {
    this.workspaceSubmitted.set(true);
    this.workspaceForm.markAllAsTouched();
    if (this.workspaceForm.invalid) {
      this.focusField(WORKSPACE_NAME_ID);
    }
  }

  /**
   * Shows another step and moves focus to its first field
   * (the button the user pressed is no longer on screen).
   */
  protected goToStep(step: SignupStep): void {
    this.step.set(step);
    const firstFieldId = step === 1 ? FIELD_IDS.fullName : WORKSPACE_NAME_ID;
    // Wait until Angular has drawn the new step, otherwise the field does not exist yet.
    afterNextRender(() => this.focusField(firstFieldId), { injector: this.injector });
  }

  // ----- API call -----

  /** Sends the new account to the API. Success opens the dashboard; failure shows the errors. */
  private readonly registerAccount = (body: RegisterRequest): void => {
    this.serverErrors.set({});
    this.formError.set(null);
    this.submitting.set(true);
    this.signupService
      .register(body)
      .pipe(
        map(() => {
          this.submitting.set(false);
          this.router.navigate(['/dashboard']);
        }),
        catchError((error: unknown) => {
          this.submitting.set(false);
          this.showRegisterError(error);
          return EMPTY;
        }),
      )
      .subscribe();
  };

  /**
   * Shows why registration failed.
   * HTTP 400 means some fields were rejected: each message goes under its field.
   * Any other failure shows one general message above the form.
   */
  private showRegisterError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.formError.set(generalErrorMessage(500));
      return;
    }
    if (error.status !== 400) {
      this.formError.set(generalErrorMessage(error.status));
      return;
    }

    // The error body looks like { error: { message, details: { email: ["..."], ... } } }.
    const body = error.error as Partial<ApiErrorResponse> | null;
    const details = body?.error?.details ?? {};

    const fieldErrors: FieldMessages = {};
    const otherMessages: string[] = [];
    for (const [apiField, value] of Object.entries(details)) {
      const message = firstMessage(value);
      if (!message) {
        continue;
      }
      const field = FIELD_BY_API_KEY[apiField];
      if (field) {
        fieldErrors[field] = frontendMessage(field, message);
      } else {
        otherMessages.push(message);
      }
    }

    this.serverErrors.set(fieldErrors);

    if (otherMessages.length > 0) {
      this.formError.set(otherMessages.join(' '));
    } else if (Object.keys(fieldErrors).length === 0) {
      // Nothing usable in `details`, so fall back to the overall message.
      this.formError.set(body?.error?.message ?? 'The request contains invalid fields.');
    }

    const firstRejected = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (firstRejected) {
      this.focusField(FIELD_IDS[firstRejected]);
    }
  }

  // ----- Small helpers -----

  /**
   * The browser-side error for one step 1 field, or null.
   * Shown only after the user has left the field or pressed submit.
   */
  private browserMessage(field: Field): string | null {
    const control = this.accountForm.controls[field];
    const userWasHere = this.accountSubmitted() || control.touched;
    if (control.valid || !userWasHere) {
      return null;
    }

    // A field can have several errors at once; show the first one we have a message for.
    const errorNames = Object.keys(control.errors ?? {});
    for (const errorName of errorNames) {
      const message = MESSAGES[field][errorName];
      if (message) {
        return message;
      }
    }
    return null;
  }

  /** Removes the server's message for one field. */
  private clearServerError(field: Field): void {
    if (!this.serverErrors()[field]) {
      return;
    }
    this.serverErrors.update((errors) => ({ ...errors, [field]: undefined }));
  }

  /** Moves focus to the first step 1 field that fails validation. */
  private focusFirstInvalidField(): void {
    const firstInvalid = FIELD_ORDER.find((field) => this.accountForm.controls[field].invalid);
    if (firstInvalid) {
      this.focusField(FIELD_IDS[firstInvalid]);
    }
  }

  /** Moves keyboard focus to the element with this `id` inside this page. */
  private focusField(id: string): void {
    this.host.nativeElement.querySelector<HTMLElement>(`#${id}`)?.focus();
  }
}
