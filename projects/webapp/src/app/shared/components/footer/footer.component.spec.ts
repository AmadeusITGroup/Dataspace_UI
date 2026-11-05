import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';

interface OrgConfig {
  ORG_NAME?: string;
  ORG_ADDRESS?: string;
  ORG_LOGO?: string;
}

describe('FooterComponent', () => {
  let fixture: ComponentFixture<FooterComponent>;

  function render(config: OrgConfig) {
    TestBed.configureTestingModule({ imports: [FooterComponent] });
    fixture = TestBed.createComponent(FooterComponent);
    (fixture.componentInstance as unknown as { organizationConfig: OrgConfig }).organizationConfig =
      config;
    fixture.detectChanges();
  }

  const host = (): HTMLElement => fixture.nativeElement;
  const links = (): HTMLAnchorElement[] => Array.from(host().querySelectorAll('a'));

  it('links the organization name to ORG_ADDRESS in a new tab', () => {
    render({ ORG_NAME: 'Acme', ORG_ADDRESS: 'https://acme.example/' });

    expect(links()).toHaveLength(1);
    const [brand] = links();
    expect(brand.classList).toContain('df-footer-brand');
    expect(brand.getAttribute('href')).toBe('https://acme.example/');
    expect(brand.getAttribute('target')).toBe('_blank');
    expect(brand.getAttribute('rel')).toBe('noopener');
    expect(brand.querySelector('.fw-bold')?.textContent?.trim()).toBe('Acme');
    // The link's accessible name says that it opens in a new tab.
    expect(brand.querySelector('.visually-hidden')?.textContent?.trim()).toBe(
      '(opens in a new tab)'
    );
  });

  it('shows the logo instead of the name when ORG_LOGO is set', () => {
    render({ ORG_NAME: 'Acme', ORG_ADDRESS: 'https://acme.example/', ORG_LOGO: 'logo.svg' });

    const img = links()[0].querySelector('img');
    expect(img?.getAttribute('src')).toContain('logo.svg');
    expect(img?.getAttribute('alt')).toBe('Acme website');
    // Only the height is fixed, so a wide wordmark keeps its aspect ratio.
    expect(img?.getAttribute('height')).toBe('24');
    expect(img?.hasAttribute('width')).toBe(false);
  });

  it('renders no link when ORG_ADDRESS is not set, but keeps the copyright line', () => {
    render({ ORG_NAME: 'Acme' });

    expect(links()).toHaveLength(0);
    expect(host().textContent).toContain(`© ${new Date().getFullYear()} Acme`);
  });

  it('uses DF footer styles', () => {
    render({ ORG_NAME: 'Acme', ORG_ADDRESS: 'https://acme.example/' });

    expect(host().querySelector('footer.df-app-footer .df-app-footer-line')).toBeTruthy();
  });
});
