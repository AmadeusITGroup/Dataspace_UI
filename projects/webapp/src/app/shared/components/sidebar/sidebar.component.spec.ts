import '@angular/localize/init'; // DF's SideNav uses $localize; the app loads it as a polyfill
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SidebarComponent } from './sidebar.component';
import { sidebarMenu } from './sidebar.constant';

@Component({ template: '' })
class BlankPageComponent {}

describe('SidebarComponent', () => {
  let harness: RouterTestingHarness;
  let host: HTMLElement;

  const links = (): HTMLAnchorElement[] => Array.from(host.querySelectorAll('a'));
  const linkByText = (text: string): HTMLAnchorElement | undefined =>
    links().find((a) => a.textContent?.trim() === text);
  const groupButton = (label: string): HTMLButtonElement | undefined =>
    Array.from(host.querySelectorAll<HTMLButtonElement>('button[aria-expanded]')).find(
      (button) => button.textContent?.trim() === label
    );

  async function render(url: string, desktop = true) {
    // jsdom has no layout: report every media query as matching (desktop) or none (small screen).
    window.matchMedia = jest.fn().mockImplementation((media: string) => ({
      matches: desktop,
      media,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn()
    }));
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', component: BlankPageComponent }])]
    });
    harness = await RouterTestingHarness.create(url);
    const fixture = TestBed.createComponent(SidebarComponent);
    await settle(fixture);
    host = fixture.nativeElement;
    return fixture;
  }

  // routerLinkActive reports the active link after the first check; render once more for it.
  async function settle(fixture: ComponentFixture<SidebarComponent>) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeAll(() => {
    // jsdom does not implement scrolling; DF scrolls the active link into view.
    Element.prototype.scrollTo = jest.fn();
  });

  it('renders every menu entry with its link and icon', async () => {
    await render('/catalog');

    const titles = sidebarMenu.flatMap((item) =>
      item.items.length ? [item.title, ...item.items.map((sub) => sub.title)] : [item.title]
    );
    for (const title of titles) {
      expect(host.textContent).toContain(title);
    }
    expect(linkByText('Catalog')?.getAttribute('href')).toBe('/catalog');
    expect(linkByText('My Policies')?.getAttribute('href')).toBe('/dataset-management/policy');
    expect(host.querySelector('.bi-boxes')).toBeTruthy();
    expect(host.querySelector('.bi-diagram-2')).toBeTruthy();
  });

  it('marks only the link of the current route as the current page', async () => {
    await render('/dataset-management/policy');

    const current = links().filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current.map((a) => a.textContent?.trim())).toEqual(['My Policies']);
  });

  it('expands the group that owns the current route and keeps the others collapsed', async () => {
    await render('/contract-management/contract-transfer');

    expect(groupButton('Contract Management')?.getAttribute('aria-expanded')).toBe('true');
    expect(groupButton('Dataset Management')?.getAttribute('aria-expanded')).toBe('false');
    expect(groupButton('Settings')?.getAttribute('aria-expanded')).toBe('false');
  });

  it('lets the user expand and collapse a group', async () => {
    const fixture = await render('/catalog');
    const button = groupButton('Settings')!;
    expect(button.getAttribute('aria-expanded')).toBe('false');

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('expands a group when the user navigates into it', async () => {
    const fixture = await render('/catalog');
    expect(groupButton('Dataset Management')?.getAttribute('aria-expanded')).toBe('false');

    await harness.navigateByUrl('/dataset-management/dataset');
    await settle(fixture);

    expect(groupButton('Dataset Management')?.getAttribute('aria-expanded')).toBe('true');
    expect(linkByText('My Datasets')?.getAttribute('aria-current')).toBe('page');
  });

  it('keeps the full menu open on a small screen (no mobile panel, not minimised)', async () => {
    await render('/catalog', false);

    const sidenav = host.querySelector('df-sidenav')!;
    expect(sidenav.classList).not.toContain('df-hidden');
    expect(sidenav.classList).not.toContain('df-sidenav-minimized');
    expect(linkByText('Catalog')?.getAttribute('aria-current')).toBe('page');
    expect(groupButton('Settings')).toBeTruthy();
  });
});
