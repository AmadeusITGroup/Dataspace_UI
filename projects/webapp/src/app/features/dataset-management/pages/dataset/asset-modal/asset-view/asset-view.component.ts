import { NgClass, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgbCollapseModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { SecretInputV3 } from 'management-sdk';
import { CopyButtonComponent } from '../../../../../../core/components/copy-button.component';
import { I18N } from '../../../../../../core/i18n/translation.en';
import { Asset } from '../../../../model/asset/asset';

@Component({
  selector: 'app-asset-view',
  templateUrl: './asset-view.component.html',
  styleUrls: ['./asset-view.component.scss'],
  imports: [
    NgTemplateOutlet,
    NgClass,
    NgbTooltip,
    CopyButtonComponent,
    CopyButtonComponent,
    NgbCollapseModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetViewComponent {
  public asset = input.required<Asset>();
  public secret = input<SecretInputV3 | null>();

  showMask = true;
  protected readonly I18N = I18N;
  isCollapsed = true;

  get authType(): string | undefined {
    if (
      this.asset()?.dataAddress?.authKey ||
      this.asset()?.dataAddress?.authCode ||
      this.asset()?.dataAddress?.secretName
    ) {
      return 'Basic';
    } else if (
      this.asset()?.dataAddress &&
      (this.asset()?.dataAddress['oauth2:tokenUrl'] || this.asset()?.dataAddress['oauth2:clientId'])
    ) {
      return 'OAuth2';
    }
    return ''; // Default if no authType-related properties exist
  }

  toggleMask() {
    this.showMask = !this.showMask;
  }
}
