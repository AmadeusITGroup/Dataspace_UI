import { NgClass, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgbCollapseModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { SecretInputV3 } from 'management-sdk';
import { CopyButtonComponent } from '../../../../../../core/components/copy-button.component';
import { I18N } from '../../../../../../core/i18n/translation.en';
import { Asset } from '../../../../model/asset/asset';
import { HttpDataAddress, KafkaCompleteDataAddress } from '../../../../model/asset/dataAddress';

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
    const dataAddress = this.asset()?.dataAddress;
    if (!dataAddress || dataAddress.type === 'Kafka') {
      return '';
    }
    const httpDataAddress = dataAddress as HttpDataAddress;
    if (httpDataAddress.authKey || httpDataAddress.authCode || httpDataAddress.secretName) {
      return 'Basic';
    } else if (httpDataAddress['oauth2:tokenUrl'] || httpDataAddress['oauth2:clientId']) {
      return 'OAuth2';
    }
    return ''; // Default if no authType-related properties exist
  }

  get httpDataAddress(): HttpDataAddress | null {
    const dataAddress = this.asset()?.dataAddress;
    return dataAddress?.type !== 'Kafka' ? (dataAddress as HttpDataAddress) : null;
  }

  get kafkaDataAddress(): KafkaCompleteDataAddress | null {
    const dataAddress = this.asset()?.dataAddress;
    return dataAddress?.type === 'Kafka' ? (dataAddress as KafkaCompleteDataAddress) : null;
  }

  toggleMask() {
    this.showMask = !this.showMask;
  }
}
