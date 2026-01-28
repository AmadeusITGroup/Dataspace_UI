import { NgClass, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { SecretInputV3 } from 'management-sdk';
import { PATTERNS } from '../../../../../../../core/constants/patterns.const';
import { I18N } from '../../../../../../../core/i18n/translation.en';
import { CRUD } from '../../../../../../../core/models/crud';
import { atLeastOneRequiredValidator } from '../../../../../../../core/validators/at-least-one-required.validator';
import { makeOthersRequiredValidator } from '../../../../../../../core/validators/make-others-required.validator';
import { FieldLinkComponent } from '../../../../../../../shared/components/field-link/field-link.component';
import { DataAddress, HttpDataAddress } from '../../../../../model/asset/dataAddress';
import {
  authMethods,
  AuthTypesEnum,
  transformInDataAddressRest,
  transformInSecret
} from '../../../../../utils/dataset.util';

@Component({
  selector: 'app-asset-data-address-rest-component',
  templateUrl: './asset-data-address-rest.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ReactiveFormsModule, NgbTooltip, NgTemplateOutlet, NgClass, FieldLinkComponent]
})
export class AssetDataAddressRestComponent {
  protected readonly I18N = I18N;
  protected readonly authMethods = authMethods;
  protected readonly AuthTypesEnum = AuthTypesEnum;

  readonly fb = inject(FormBuilder);

  public dataAddress = input<DataAddress | null>();
  public secret = input<SecretInputV3 | null>();
  public mode = input<CRUD>(CRUD.CREATE);

  public secretAction = output<{
    secret: SecretInputV3 | undefined;
    dataAddress: DataAddress;
    action: CRUD | null;
  }>();

  public formSubmit = output<{
    form: FormGroup;
    dataAddress: DataAddress;
    secretInput: SecretInputV3 | undefined;
    secretAction: CRUD | null;
  }>();

  dataAddressForm: FormGroup = this.fb.group({
    baseUrl: [
      { value: '', disabled: false },
      [Validators.required, Validators.pattern(PATTERNS.URL)]
    ],
    path: [{ value: '', disabled: false }],
    queryParams: [{ value: '', disabled: false }],
    proxyPath: [{ value: false, disabled: false }],
    proxyQueryParams: [{ value: false, disabled: false }],
    authType: [{ value: 'None', disabled: false }]
  });

  baseAuthGroup: FormGroup = this.fb.group(
    {
      authKey: [{ value: '', disabled: false }],
      authCode: [{ value: '', disabled: false }],
      secretName: [{ value: '', disabled: false }]
    },
    { validators: [makeOthersRequiredValidator('secretName', ['authCode'])] }
  );

  oAuth2Group: FormGroup = this.fb.group(
    {
      tokenUrl: [
        { value: '', disabled: false },
        [Validators.required, Validators.pattern(PATTERNS.URL)]
      ],
      clientId: [{ value: '', disabled: false }, Validators.required],
      clientSecretKey: [{ value: '', disabled: false }],
      privateKeyName: [{ value: '', disabled: false }],
      secretValue: [{ value: '', disabled: false }, Validators.required],
      kid: [{ value: '', disabled: false }]
    },
    { validators: [atLeastOneRequiredValidator(['clientSecretKey', 'privateKeyName'])] }
  );

  showSecret = false;

  private get httpDataAddress(): HttpDataAddress | null {
    const dataAddress = this.dataAddress();
    return dataAddress?.type !== 'Kafka' ? (dataAddress as HttpDataAddress) : null;
  }

  constructor() {
    effect(() => {
      if (this.dataAddress()) {
        this.initializeForm();
      }
      this.dataAddressForm.get('authType')?.valueChanges.subscribe((authType) => {
        this.initializeAuthType(authType);
      });
    });
  }

  private initializeForm(): void {
    if (!this.dataAddress()) {
      return;
    }
    const authType = this.getAuthType();
    const httpData = this.httpDataAddress;
    this.dataAddressForm.patchValue({
      baseUrl: httpData?.baseUrl || '',
      path: httpData?.path || '',
      queryParams: httpData?.queryParams || '',
      proxyPath: httpData?.proxyPath === 'true',
      proxyQueryParams: httpData?.proxyQueryParams === 'true',
      authType: authType
    });
    this.initializeAuthType(authType);
  }

  private initializeAuthType(authType: string | undefined): void {
    const httpData = this.httpDataAddress;
    if (authType === AuthTypesEnum.BaseAuth) {
      if (this.dataAddressForm.get('oAuth2')) {
        this.dataAddressForm.removeControl('oAuth2');
      }
      this.baseAuthGroup.patchValue({
        authKey: httpData?.authKey || '',
        authCode: httpData?.authCode || this.secret()?.value || '',
        secretName: httpData?.secretName || this.secret()?.['@id'] || ''
      });
      this.dataAddressForm.addControl('baseAuth', this.baseAuthGroup);
      if (this.secret()) {
        this.baseAuthGroup.get('secretName')?.disable();
      } else {
        this.baseAuthGroup.get('secretName')?.enable();
      }
    } else if (authType === AuthTypesEnum.OAuth2) {
      if (this.dataAddressForm.get('baseAuth')) {
        this.dataAddressForm.removeControl('baseAuth');
      }
      this.oAuth2Group.patchValue({
        tokenUrl: httpData?.['oauth2:tokenUrl'] || '',
        clientId: httpData?.['oauth2:clientId'] || '',
        clientSecretKey: httpData?.['oauth2:clientSecretKey'] || '',
        privateKeyName: httpData?.['oauth2:privateKeyName'] || '',
        secretValue: this.secret()?.value || '',
        kid: httpData?.['oauth2:kid'] || ''
      });
      this.dataAddressForm.addControl('oAuth2', this.oAuth2Group);
      if (this.secret()) {
        this.oAuth2Group.get('clientSecretKey')?.disable();
        this.oAuth2Group.get('privateKeyName')?.disable();
      } else {
        this.oAuth2Group.get('clientSecretKey')?.enable();
        this.oAuth2Group.get('privateKeyName')?.enable();
      }
    } else {
      // ensure no leftover groups
      if (this.dataAddressForm.get('baseAuth')) {
        this.dataAddressForm.removeControl('baseAuth');
      }
      if (this.dataAddressForm.get('oAuth2')) {
        this.dataAddressForm.removeControl('oAuth2');
      }
    }
  }

  getAuthType(): string | undefined {
    const httpData = this.httpDataAddress;
    if (httpData && (httpData?.['oauth2:tokenUrl'] || httpData?.['oauth2:clientId'])) {
      return AuthTypesEnum.OAuth2;
    }
    if (httpData?.authKey || httpData?.authCode || httpData?.secretName) {
      return AuthTypesEnum.BaseAuth;
    }
    return AuthTypesEnum.None;
  }

  public isFormValid(): boolean {
    this.dataAddressForm.markAllAsTouched();
    this.dataAddressForm.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    const authType = this.dataAddressForm.get('authType')?.value;
    if (authType === AuthTypesEnum.BaseAuth) {
      this.baseAuthGroup.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    } else if (authType === AuthTypesEnum.OAuth2) {
      this.oAuth2Group.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    }
    return this.dataAddressForm.valid;
  }

  public emitFormSubmit(): void {
    // Get secret action and input
    const { secretAction, secretInput } = this.getSecretActionAndInput();
    const dataAddress: Partial<DataAddress> = transformInDataAddressRest(
      this.dataAddressForm.getRawValue(),
      secretAction === CRUD.DELETE
    );
    // Only emit if form is valid and dirty, or if secret was deleted
    if (
      this.isFormValid() &&
      (this.dataAddressForm.dirty || (secretAction === CRUD.DELETE && this.dataAddressForm.valid))
    ) {
      if (secretAction) {
        this.secretAction.emit({
          secret: secretInput,
          dataAddress: dataAddress as DataAddress,
          action: secretAction
        });
      }
      this.formSubmit.emit({
        form: this.dataAddressForm,
        dataAddress: dataAddress as DataAddress,
        secretInput,
        secretAction
      });
    }
  }

  private getSecretActionAndInput(): {
    secretAction: CRUD | null;
    secretInput: SecretInputV3 | undefined;
  } {
    const secret = transformInSecret(this.dataAddressForm.getRawValue());
    const hadSecret = !!this.secret();
    const hasSecretNow = !!secret?.value || !!secret?.['@id'];

    let secretAction: CRUD | null = null;
    let secretInput: SecretInputV3 | undefined = undefined;

    if (hadSecret && !hasSecretNow) {
      secretAction = CRUD.DELETE;
      secretInput = this.secret()!;
    } else if (!hadSecret && hasSecretNow) {
      secretAction = CRUD.CREATE;
      secretInput = secret;
    } else if (hadSecret && hasSecretNow) {
      const isSecretUnchanged =
        secret?.value === this.secret()?.value && secret?.['@id'] === this.secret()?.['@id'];
      secretAction = isSecretUnchanged ? null : CRUD.UPDATE;
      secretInput = isSecretUnchanged ? undefined : secret;
    }

    return { secretAction, secretInput };
  }

  enableForm(): void {
    this.dataAddressForm.enable();
    // Check and enable dynamically added controls
    if (this.dataAddressForm.get('baseAuth')) {
      this.dataAddressForm.get('baseAuth')?.enable();
    }

    if (this.dataAddressForm.get('oAuth2')) {
      this.dataAddressForm.get('oAuth2')?.enable();
    }
  }

  toggleSecret(): void {
    this.showSecret = !this.showSecret;
  }

  deleteSecret() {
    if (this.dataAddressForm.get('authType')?.value === AuthTypesEnum.BaseAuth) {
      this.dataAddressForm.get('baseAuth.secretName')?.patchValue('');
      this.dataAddressForm.get('baseAuth.secretName')?.enable();
      this.dataAddressForm.get('baseAuth.authCode')?.patchValue('');
    } else {
      this.dataAddressForm.get('oAuth2.clientSecretKey')?.patchValue('');
      this.dataAddressForm.get('oAuth2.clientSecretKey')?.enable();
      this.dataAddressForm.get('oAuth2.privateKeyName')?.patchValue('');
      this.dataAddressForm.get('oAuth2.privateKeyName')?.enable();
      this.dataAddressForm.get('oAuth2.secretValue')?.patchValue('');
      this.dataAddressForm.get('oAuth2')?.markAsDirty();
    }
    const secret = this.secret();
    this.dataAddressForm.markAsDirty();
    const dataAddress = transformInDataAddressRest(this.dataAddressForm.getRawValue());
    if (secret) {
      this.secretAction.emit({ secret, dataAddress, action: CRUD.DELETE });
    }
  }
}
