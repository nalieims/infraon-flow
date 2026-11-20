import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AppHeaderComponent } from './app-header.component';

@Component({ template: '' })
class EmptyPageComponent {}

describe('AppHeaderComponent', () => {
  let fixture: ComponentFixture<AppHeaderComponent>;
  let element: HTMLElement;

  async function goTo(url: string): Promise<void> {
    await TestBed.inject(Router).navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function breadcrumbLabels(): (string | undefined)[] {
    return Array.from(element.querySelectorAll('nav[aria-label="Breadcrumb"] a'), (link) =>
      link.textContent?.trim(),
    );
  }

  function phoneTitle(): string | undefined {
    return element.querySelector('.lg\\:hidden span.truncate')?.textContent?.trim();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
      providers: [provideRouter([{ path: '**', component: EmptyPageComponent }])],
    }).compileComponents();

    fixture = TestBed.createComponent(AppHeaderComponent);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('shows the section of the current page in the breadcrumb and the phone title', async () => {
    await goTo('/teams');
    expect(breadcrumbLabels()).toEqual(['Infraon Labs', 'Teams']);
    expect(phoneTitle()).toBe('Teams');

    await goTo('/my-day');
    expect(breadcrumbLabels()).toEqual(['Infraon Labs', 'My Day']);
    expect(phoneTitle()).toBe('My Day');
  });

  it('shows "Objective" as the phone title on an objective page and keeps OKRs in the breadcrumb', async () => {
    await goTo('/okrs/123');
    expect(breadcrumbLabels()).toEqual(['Infraon Labs', 'OKRs']);
    expect(phoneTitle()).toBe('Objective');

    await goTo('/okrs');
    expect(phoneTitle()).toBe('OKRs');
  });

  it('names the notification buttons with the unread count and shows the badge', () => {
    const buttons = element.querySelectorAll('button[aria-label="Notifications (3 unread)"]');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent?.trim()).toBe('3');
  });

  it('emits menuToggle from the menu button and reflects menuOpen in aria-expanded', async () => {
    const toggled = vi.fn();
    fixture.componentInstance.menuToggle.subscribe(toggled);
    const menuButton = element.querySelector<HTMLButtonElement>('button[aria-label="Open menu"]');

    expect(menuButton?.getAttribute('aria-expanded')).toBe('false');
    menuButton?.click();
    expect(toggled).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('menuOpen', true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(menuButton?.getAttribute('aria-expanded')).toBe('true');
  });
});
