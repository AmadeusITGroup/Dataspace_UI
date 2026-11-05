import { NgClass, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { NgbCollapseModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { SecretInput } from 'management-sdk';
import { CopyButtonComponent } from '../../../../../../core/components/copy-button.component';
import { I18N } from '../../../../../../core/i18n/translation.en';
import { HtmlSanitizerService } from '../../../../../../core/services/html-sanitizer.service';
import { Asset } from '../../../../model/asset/asset';
import {
  AzureBlobDataAddress,
  HttpDataAddress,
  KafkaCompleteDataAddress,
  S3DataAddress
} from '../../../../model/asset/dataAddress';

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
  private htmlSanitizerService = inject(HtmlSanitizerService);
  public asset = input.required<Asset>();
  public secret = input<SecretInput | null>();

  showMask = true;
  protected readonly I18N = I18N;
  isCollapsed = true;

  getSafeHtml(html: string): SafeHtml {
    return this.htmlSanitizerService.getSafeHtml(html);
  }

  get authType(): string | undefined {
    const dataAddress = this.asset()?.dataAddress;
    if (
      !dataAddress ||
      dataAddress.type === 'Kafka' ||
      dataAddress.type === 'AzureStorage' ||
      dataAddress.type === 'S3Bucket'
    ) {
      return '';
    }
    const httpDataAddress = dataAddress as HttpDataAddress;
    if (httpDataAddress.authKey || httpDataAddress.authCode || httpDataAddress.secretName) {
      return 'Basic';
    } else if (httpDataAddress['oauth2:tokenUrl'] || httpDataAddress['oauth2:clientId']) {
      return 'OAuth2';
    }
    return '';
  }

  get httpDataAddress(): HttpDataAddress | null {
    const dataAddress = this.asset()?.dataAddress;
    return dataAddress?.type !== 'Kafka' &&
      dataAddress?.type !== 'AzureStorage' &&
      dataAddress?.type !== 'S3Bucket'
      ? (dataAddress as HttpDataAddress)
      : null;
  }

  get kafkaDataAddress(): KafkaCompleteDataAddress | null {
    const dataAddress = this.asset()?.dataAddress;
    return dataAddress?.type === 'Kafka' ? (dataAddress as KafkaCompleteDataAddress) : null;
  }

  get azureBlobDataAddress(): AzureBlobDataAddress | null {
    const dataAddress = this.asset()?.dataAddress;
    return dataAddress?.type === 'AzureStorage' ? (dataAddress as AzureBlobDataAddress) : null;
  }

  get s3DataAddress(): S3DataAddress | null {
    const dataAddress = this.asset()?.dataAddress;
    return dataAddress?.type === 'S3Bucket' ? (dataAddress as S3DataAddress) : null;
  }

  toggleMask() {
    this.showMask = !this.showMask;
  }
}
