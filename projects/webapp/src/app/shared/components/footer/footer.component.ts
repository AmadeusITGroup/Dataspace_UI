import { ChangeDetectionStrategy, Component } from '@angular/core';
import { organizationConfig } from '../../../config/organization/organization.config';

/**
 * Page footer on Design Factory's footer styles (`.df-app-footer`), following DF's footer
 * markup. Its content comes from the organization config only.
 */
@Component({
  selector: 'app-footer',
  templateUrl: 'footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {
  protected readonly organizationConfig = organizationConfig;
  protected readonly year = new Date().getFullYear();
}
