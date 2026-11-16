import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailChipsInputComponent } from './email-chips-input.component';

@Component({
  imports: [EmailChipsInputComponent],
  template: `<app-email-chips-input
    inputId="invites"
    hint="They join as Members."
    [(emails)]="emails"
  />`,
})
class Host {
  readonly emails = signal<string[]>(['arjun@labs.com']);
}

@Component({
  imports: [EmailChipsInputComponent],
  template: `<app-email-chips-input
    inputId="labelled"
    listLabel="Teammates to invite"
    [emails]="['a@labs.com']"
  />`,
})
class LabelledHost {}

describe('EmailChipsInputComponent', () => {
  let fixture: ComponentFixture<Host>;
  let el: HTMLElement;
  let field: HTMLInputElement;

  const typeText = (value: string) => {
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const press = (key: string) => {
    field.dispatchEvent(new KeyboardEvent('keydown', { key }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    field = el.querySelector<HTMLInputElement>('#invites')!;
  });

  it('renders chips with named remove buttons and the hint', () => {
    expect(el.querySelector('li')?.textContent).toContain('arjun@labs.com');
    expect(el.querySelector('button')?.getAttribute('aria-label')).toBe('Remove arjun@labs.com');
    expect(field.getAttribute('aria-describedby')).toBe('invites-hint');
    expect(field.placeholder).toBe('Add another email');
  });

  it('names the chip list from listLabel, with a generic default', () => {
    expect(el.querySelector('ul')?.getAttribute('aria-label')).toBe('Added emails');
    const labelled = TestBed.createComponent(LabelledHost);
    labelled.detectChanges();
    expect(
      (labelled.nativeElement as HTMLElement).querySelector('ul')?.getAttribute('aria-label'),
    ).toBe('Teammates to invite');
  });

  it('adds an email on Enter', () => {
    typeText('ananya@labs.com');
    press('Enter');
    expect(fixture.componentInstance.emails()).toEqual(['arjun@labs.com', 'ananya@labs.com']);
    expect(field.value).toBe('');
  });

  it('adds several pasted emails at once', () => {
    typeText('a@labs.com, b@labs.com');
    expect(fixture.componentInstance.emails()).toEqual([
      'arjun@labs.com',
      'a@labs.com',
      'b@labs.com',
    ]);
  });

  it('keeps an invalid email in the field with the designed error', () => {
    typeText('ananya@labs');
    press('Enter');
    expect(fixture.componentInstance.emails()).toEqual(['arjun@labs.com']);
    expect(field.value).toBe('ananya@labs');
    expect(el.querySelector('#invites-error')?.textContent).toContain(
      'Add the domain ending, e.g. name@company.com.',
    );
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(field.getAttribute('aria-describedby')).toBe('invites-error');

    typeText('ananya@labs.co');
    expect(el.querySelector('#invites-error')).toBeNull();
  });

  it('rejects duplicates', () => {
    typeText('ARJUN@labs.com');
    press('Enter');
    expect(fixture.componentInstance.emails()).toHaveLength(1);
    expect(el.textContent).toContain('That email is already on the list.');
  });

  it('removes a chip by button and the last chip by Backspace', () => {
    el.querySelector<HTMLButtonElement>('button')!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.emails()).toEqual([]);

    fixture.componentInstance.emails.set(['a@labs.com', 'b@labs.com']);
    fixture.detectChanges();
    press('Backspace');
    expect(fixture.componentInstance.emails()).toEqual(['a@labs.com']);
  });

  it('commits on blur', () => {
    typeText('c@labs.com');
    field.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.emails()).toContain('c@labs.com');
  });
});
