import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldErrorComponent } from './field-error.component';

@Component({
  imports: [FieldErrorComponent],
  template: `<app-field-error [errorId]="errorId()" [alert]="alert()"
    >Enter a name.</app-field-error
  >`,
})
class Host {
  readonly errorId = signal('name-error');
  readonly alert = signal(false);
}

describe('FieldErrorComponent', () => {
  let fixture: ComponentFixture<Host>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    host = (fixture.nativeElement as HTMLElement).querySelector('app-field-error')!;
  });

  it('renders the message with a decorative icon', () => {
    expect(host.textContent?.trim()).toBe('Enter a name.');
    expect(host.querySelector('.icon-error')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('exposes the id that aria-describedby points at', () => {
    expect(host.id).toBe('name-error');
  });

  it('has no role unless alert is set', () => {
    expect(host.getAttribute('role')).toBeNull();
    fixture.componentInstance.alert.set(true);
    fixture.detectChanges();
    expect(host.getAttribute('role')).toBe('alert');
  });

  it('omits the id when none is given', () => {
    fixture.componentInstance.errorId.set('');
    fixture.detectChanges();
    expect(host.hasAttribute('id')).toBe(false);
  });
});
