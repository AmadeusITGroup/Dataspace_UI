import '@angular/localize/init'; // DF's TopNav uses $localize; the app loads it as a polyfill
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { LoginService } from '../../../core/services/login.service';
import { NavbarComponent } from './navbar.component';

interface OrgConfig {
  ORG_NAME?: string;
  ORG_ADDRESS?: string;
  ORG_ADDRESS_LABEL?: string;
  ORG_LOGO?: string;
}

describe('NavbarComponent', () => {
  let fixture: ComponentFixture<NavbarComponent>;
  let queryClient: QueryClient;
  const logOut = jest.fn();

  function render(config: OrgConfig) {
    // jsdom has no layout: report every media query as matching, so DF renders the desktop
    // TopNav, where quick actions sit in the bar instead of the mobile drawer.
    window.matchMedia = jest.fn().mockImplementation((media: string) => ({
      matches: true,
      media,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn()
    }));
    queryClient = new QueryClient();
    TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        provideTanStackQuery(queryClient),
        { provide: LoginService, useValue: { shortParticipantId: () => 'p-1', logOut } }
      ]
    });
    fixture = TestBed.createComponent(NavbarComponent);
    (fixture.componentInstance as unknown as { organizationConfig: OrgConfig }).organizationConfig =
      config;
    fixture.detectChanges();
  }

  const host = (): HTMLElement => fixture.nativeElement;
  const button = (label: string): HTMLButtonElement | undefined =>
    Array.from(host().querySelectorAll('button')).find((b) => b.textContent?.trim() === label);
  const brandLink = (): HTMLAnchorElement | null => host().querySelector('.df-topnav-brand-link');

  afterEach(() => jest.clearAllMocks());

  it('shows the ORG_NAME wordmark as the brand, linking to the app home, when there is no logo', () => {
    render({ ORG_NAME: 'Acme', ORG_ADDRESS: 'https://acme.example/' });

    expect(brandLink()?.textContent?.trim()).toBe('Acme');
    expect(brandLink()?.getAttribute('href')).toBe('/');
    expect(brandLink()?.querySelector('img')).toBeNull();
  });

  it('shows the logo as the brand when ORG_LOGO is set', () => {
    render({ ORG_NAME: 'Acme', ORG_LOGO: 'logo.svg' });

    const img = brandLink()?.querySelector('img');
    expect(img?.getAttribute('src')).toContain('logo.svg');
    expect(img?.getAttribute('alt')).toBe('Link to homepage');
    expect(brandLink()?.textContent?.trim()).toBe('');
  });

  it('renders no brand when neither a logo nor a name is configured', () => {
    render({});

    expect(brandLink()).toBeNull();
  });

  it('has the brand as its only link, even when ORG_ADDRESS_LABEL is set', () => {
    render({ ORG_NAME: 'Acme', ORG_ADDRESS: 'https://acme.example/', ORG_ADDRESS_LABEL: 'acme' });

    const hrefs = Array.from(host().querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/']);
  });

  it('shows the participant id', () => {
    render({ ORG_NAME: 'Acme' });

    expect(host().textContent).toContain('p-1');
  });

  it('refreshes every query from the Refresh button', () => {
    render({ ORG_NAME: 'Acme' });
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');

    button('Refresh')!.click();

    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it('spins the refresh icon while queries are fetching', () => {
    render({ ORG_NAME: 'Acme' });
    const icon = (): Element | null => host().querySelector('.icon-refresh');
    expect(icon()?.classList).not.toContain('refreshing');

    fixture.componentInstance.isRefreshing.set(true);
    fixture.detectChanges();

    expect(icon()?.classList).toContain('refreshing');
  });

  it('logs out from the Log out button', () => {
    render({ ORG_NAME: 'Acme' });

    const logout = button('Log out')!;
    expect(logout.getAttribute('title')).toBe('Participant id: p-1');
    logout.click();

    expect(logOut).toHaveBeenCalledTimes(1);
  });
});
