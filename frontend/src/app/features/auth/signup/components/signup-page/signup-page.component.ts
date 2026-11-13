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
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { map, startWith } from 'rxjs';

import { EmailChipsInputComponent } from '../../../../../shared/components/email-chips-input/email-chips-input.component';
import { FieldErrorComponent } from '../../../../../shared/components/field-error/field-error.component';
import { workEmailValidator } from '../../../../../shared/utils/email-validators';
import {
  notBlankValidator,
  personNameValidator,
} from '../../../../../shared/utils/form-validators';
import { passwordPolicyValidator } from '../../../../../shared/utils/password-validators';
import { passwordStrength } from '../../../../../shared/utils/password-strength';

export type SignupStep = 1 | 2;

type WorkspaceType = 'business' | 'personal';
type WorkspaceRole = 'admin' | 'team_lead' | 'member';
type TeamSize = '1-10' | '11-50' | '51-200' | '200+';
export type FocusArea =
  'career_growth' | 'learning' | 'health_fitness' | 'side_project' | 'personal_finance';

interface StepItem {
  id: SignupStep;
  title: string;
  description: string;
  state: 'done' | 'current' | 'upcoming';
}

type Field = 'fullName' | 'email' | 'password' | 'terms';

const FIELD_ORDER: readonly Field[] = ['fullName', 'email', 'password', 'terms'];
const FIELD_IDS: Record<Field, string> = {
  fullName: 'signup-full-name',
  email: 'signup-email',
  password: 'signup-password',
  terms: 'signup-terms',
};

const MESSAGES: Record<Field, Record<string, string>> = {
  fullName: {
    required: 'Enter your full name.',
    personName: 'Use letters only. Spaces, hyphens and apostrophes are allowed.',
  },
  email: {
    required: 'Enter your work email.',
    email: 'Enter a valid email address, e.g. name@company.com.',
    domainEnding: 'Add the domain ending, e.g. name@company.com.',
  },
  password: { required: 'Enter a password.' },
  terms: { required: 'Agree to the Terms of Service and Privacy Policy to continue.' },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Q4 2026 (1 Oct – 31 Dec)" for the quarter containing `date`. */
export function quarterLabel(date: Date): string {
  const quarter = Math.floor(date.getMonth() / 3);
  const year = date.getFullYear();
  const startMonth = quarter * 3;
  const lastDay = new Date(year, startMonth + 3, 0).getDate();
  return `Q${quarter + 1} ${year} (1 ${MONTHS[startMonth]} – ${lastDay} ${MONTHS[startMonth + 2]})`;
}

/**
 * Two-step sign-up on one route: step 1 (account) and step 2 (workspace) switch inside this
 * component. UI and client-side field validation only; nothing is sent to the backend.
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
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly step = signal<SignupStep>(1);
  protected readonly year = new Date().getFullYear();
  protected readonly ids = FIELD_IDS;

  protected readonly accountForm = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, notBlankValidator, personNameValidator],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, workEmailValidator],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, passwordPolicyValidator],
    }),
    terms: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });

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

  /** Personal focus areas picked on step 2 (optional, any number). */
  protected readonly focusAreas = signal<readonly FocusArea[]>([]);
  protected readonly focusChips = computed(() => {
    const picked = this.focusAreas();
    return this.focusOptions.map((option) => ({
      ...option,
      selected: picked.includes(option.value),
    }));
  });

  protected readonly invites = signal<string[]>([]);
  protected readonly accountSubmitted = signal(false);
  protected readonly workspaceSubmitted = signal(false);
  protected readonly passwordVisible = signal(false);

  private readonly accountTick = toSignal(this.accountForm.events.pipe(map(() => ({}))), {
    initialValue: {},
  });
  private readonly workspaceTick = toSignal(this.workspaceForm.events.pipe(map(() => ({}))), {
    initialValue: {},
  });

  private readonly passwordValue = toSignal(
    this.accountForm.controls.password.valueChanges.pipe(
      startWith(this.accountForm.controls.password.value),
    ),
    { initialValue: '' },
  );

  protected readonly isBusiness = toSignal(
    this.workspaceForm.controls.workspaceType.valueChanges.pipe(
      startWith(this.workspaceForm.controls.workspaceType.value),
      map((type) => type === 'business'),
    ),
    { initialValue: true },
  );

  protected readonly firstName = computed(() => {
    this.accountTick();
    return this.accountForm.controls.fullName.value.trim().split(/\s+/)[0];
  });
  protected readonly accountEmail = computed(() => {
    this.accountTick();
    return this.accountForm.controls.email.value.trim();
  });
  protected readonly firstPeriod = quarterLabel(new Date());

  protected readonly heading = computed(() => {
    if (this.step() === 1) {
      return "From quarterly goals to today's to-do list.";
    }
    return this.firstName() ? `Almost there, ${this.firstName()}.` : 'Almost there.';
  });
  protected readonly subtitle = computed(() => {
    if (this.step() === 1) {
      return "Two short steps and you're on your Dashboard.";
    }
    return this.isBusiness()
      ? "Tell us how you'll use Infraon Flow. You can add more workspaces later."
      : 'A personal workspace is just for you. Everything in it stays private.';
  });
  /** Content column width on large screens, in px (420 for step 1, 520 for step 2). */
  protected readonly contentWidth = computed(() => (this.step() === 2 ? 520 : 420));
  protected readonly mainClass = computed(() =>
    this.step() === 2 ? 'lg:px-12 lg:py-10' : 'lg:p-12',
  );

  protected readonly steps = computed<StepItem[]>(() => {
    const onWorkspace = this.step() === 2;
    return [
      {
        id: 1,
        title: 'Create your account',
        description: onWorkspace
          ? `${this.accountEmail()} · confirmed`
          : 'Name, work email and password',
        state: onWorkspace ? 'done' : 'current',
      },
      {
        id: 2,
        title: 'Set up your workspace',
        description:
          onWorkspace && !this.isBusiness()
            ? 'Personal · private to you'
            : 'Business or personal, and who to invite',
        state: onWorkspace ? 'current' : 'upcoming',
      },
    ];
  });

  protected readonly strength = computed(() => passwordStrength(this.passwordValue()));
  protected readonly strengthRule = computed(() =>
    this.strength().tone === 'warn'
      ? 'Use at least 12 characters with a number and a symbol.'
      : 'At least 12 characters with a number and a symbol.',
  );
  protected readonly strengthAria = computed(() => {
    const level = this.strength().label.replace('.', '').toLowerCase();
    return level ? `Password strength: ${level}` : 'Password strength: not set';
  });

  /** Visible error message per step 1 field, or null. Shown after blur or a submit attempt. */
  protected readonly errors = computed(() => {
    this.accountTick();
    const submitted = this.accountSubmitted();
    const result = {} as Record<Field, string | null>;
    for (const field of FIELD_ORDER) {
      result[field] = this.messageFor(field, submitted);
    }
    return result;
  });

  /** The password policy failure is shown by the strength line itself, not a separate error. */
  protected readonly passwordPolicyInvalid = computed(() => {
    this.accountTick();
    const control = this.accountForm.controls.password;
    return (this.accountSubmitted() || control.touched) && control.hasError('passwordPolicy');
  });

  protected readonly nameError = computed(() => {
    this.workspaceTick();
    const control = this.workspaceForm.controls.name;
    if (!control.invalid || !(this.workspaceSubmitted() || control.touched)) {
      return null;
    }
    return 'Enter a workspace name.';
  });

  protected toggleFocus(area: FocusArea): void {
    this.focusAreas.update((areas) =>
      areas.includes(area) ? areas.filter((item) => item !== area) : [...areas, area],
    );
  }

  protected togglePassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected submitAccount(): void {
    this.accountSubmitted.set(true);
    this.accountForm.markAllAsTouched();
    if (this.accountForm.invalid) {
      this.focusFirstInvalid();
      return;
    }
    this.goToStep(2);
  }

  /** Validates step 2. Creating the workspace is not wired yet, so a valid form stops here. */
  protected submitWorkspace(): void {
    this.workspaceSubmitted.set(true);
    this.workspaceForm.markAllAsTouched();
    if (this.workspaceForm.invalid) {
      this.focusField('signup-workspace-name');
    }
  }

  /** Switches step in place and moves focus to the first field, since the pressed button is gone. */
  protected goToStep(step: SignupStep): void {
    this.step.set(step);
    afterNextRender(
      () => this.focusField(step === 1 ? FIELD_IDS.fullName : 'signup-workspace-name'),
      { injector: this.injector },
    );
  }

  private messageFor(field: Field, submitted: boolean): string | null {
    const control = this.accountForm.controls[field];
    if (!control.invalid || !(submitted || control.touched)) {
      return null;
    }
    const key = Object.keys(control.errors ?? {}).find((name) => MESSAGES[field][name]);
    return key ? MESSAGES[field][key] : null;
  }

  private focusFirstInvalid(): void {
    const first = FIELD_ORDER.find((field) => this.accountForm.controls[field].invalid);
    if (first) {
      this.focusField(FIELD_IDS[first]);
    }
  }

  private focusField(id: string): void {
    this.host.nativeElement.querySelector<HTMLElement>(`#${id}`)?.focus();
  }
}
