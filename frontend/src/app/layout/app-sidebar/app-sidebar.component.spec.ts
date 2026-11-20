import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AppSidebarComponent } from './app-sidebar.component';

@Component({ template: '' })
class EmptyPageComponent {}

describe('AppSidebarComponent', () => {
  let fixture: ComponentFixture<AppSidebarComponent>;
  let element: HTMLElement;

  async function goTo(url: string): Promise<void> {
    await TestBed.inject(Router).navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppSidebarComponent],
      providers: [provideRouter([{ path: '**', component: EmptyPageComponent }])],
    }).compileComponents();

    fixture = TestBed.createComponent(AppSidebarComponent);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('lists the menu links in Figma order', () => {
    const labels = Array.from(element.querySelectorAll('nav a'), (link) =>
      link.textContent?.trim(),
    );
    expect(labels).toEqual([
      'Dashboard',
      'OKRs',
      'Initiatives',
      'My Tasks',
      'My Day',
      'Teams',
      'Settings',
    ]);
  });

  it('highlights only the link for the current page', async () => {
    await goTo('/okrs/123');

    const active = element.querySelectorAll('nav a[aria-current="page"]');
    expect(active.length).toBe(1);
    expect(active[0].textContent?.trim()).toBe('OKRs');
    expect(active[0].classList).toContain('bg-brand-soft');

    await goTo('/dashboard');
    expect(element.querySelector('nav a[aria-current="page"]')?.textContent?.trim()).toBe(
      'Dashboard',
    );
  });

  it('shows Reports as "Soon" and not as a link', () => {
    const reports = element.querySelector('nav [aria-disabled="true"]');
    expect(reports?.textContent).toContain('Reports');
    expect(reports?.textContent).toContain('Soon');
    expect(reports?.tagName).not.toBe('A');
  });
});
