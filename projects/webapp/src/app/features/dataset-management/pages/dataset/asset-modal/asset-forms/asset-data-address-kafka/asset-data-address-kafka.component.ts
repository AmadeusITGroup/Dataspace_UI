import { NgClass, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { SecretInputV3 } from 'management-sdk';
import { I18N } from '../../../../../../../core/i18n/translation.en';
import { CRUD } from '../../../../../../../core/models/crud';
import { makeOthersRequiredValidator } from '../../../../../../../core/validators/make-others-required.validator';
import { DataAddress, KafkaCompleteDataAddress } from '../../../../../model/asset/dataAddress';
import {
  kafkaSaslMechanisms,
  KafkaSecurityProtocolEnum,
  kafkaSecurityProtocolOptions,
  kafkaSecurityProtocols,
  transformInDataAddressKafka,
  transformInSecretKafka
} from '../../../../../utils/dataset.util';

@Component({
  selector: 'app-asset-data-address-kafka-component',
  templateUrl: './asset-data-address-kafka.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ReactiveFormsModule, NgbTooltip, NgTemplateOutlet, NgClass]
})
export class AssetDataAddressKafkaComponent {
  protected readonly I18N = I18N;
  protected readonly kafkaSecurityProtocolOptions = kafkaSecurityProtocolOptions;
  protected readonly kafkaSaslMechanisms = kafkaSaslMechanisms;
  protected readonly kafkaSecurityProtocols = kafkaSecurityProtocols;
  protected readonly KafkaSecurityProtocolEnum = KafkaSecurityProtocolEnum;

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
    bootstrapServers: [
      { value: '', disabled: false },
      [
        Validators.required,
        Validators.pattern(/^\s*([a-zA-Z0-9.-]+:[0-9]{1,5})(\s*,\s*[a-zA-Z0-9.-]+:[0-9]{1,5})*\s*$/)
      ]
    ],
    topic: [
      { value: '', disabled: false },
      [Validators.required, Validators.pattern(/^[a-zA-Z0-9._-]+$/)]
    ],
    securityProtocol: [{ value: KafkaSecurityProtocolEnum.PLAINTEXT, disabled: false }]
  });

  saslAuthGroup!: FormGroup;

  sslAuthGroup: FormGroup = this.fb.group({
    tlsCaSecret: [{ value: '', disabled: false }, Validators.required],
    mutualTls: [false],
    tlsClientCert: [''],
    tlsClientKey: ['']
  });

  showSecret = false;

  constructor() {
    effect(() => {
      if (this.dataAddress()) {
        this.initializeForm();
      }
      this.dataAddressForm.get('securityProtocol')?.valueChanges.subscribe((protocol) => {
        this.updateAuthenticationSection(protocol);
      });
    });
  }

  private createSaslAuthGroup(
    initialValues: Partial<{
      mechanism: string;
      username: string;
      password: string;
      secretName: string;
      clientId: string;
      clientSecret: string;
      tenantId: string;
      scope: string;
    }> = {}
  ): FormGroup {
    return this.fb.group(
      {
        mechanism: [initialValues.mechanism || 'PLAIN', Validators.required],
        username: [initialValues.username || '', Validators.required],
        password: [initialValues.password || ''],
        secretName: [initialValues.secretName || ''],
        clientId: [initialValues.clientId || ''],
        clientSecret: [initialValues.clientSecret || ''],
        tenantId: [initialValues.tenantId || ''],
        scope: [initialValues.scope || '']
      },
      { validators: [makeOthersRequiredValidator('secretName', ['password'])] }
    );
  }

  private setupSaslAuthSubscriptions(): void {
    // Watch for secretName changes to update password validators
    this.saslAuthGroup.get('secretName')?.valueChanges.subscribe((secretName) => {
      this.updatePasswordValidators(secretName);
    });

    // Watch for mechanism changes to update password validators
    this.saslAuthGroup.get('mechanism')?.valueChanges.subscribe(() => {
      const secretName = this.saslAuthGroup.get('secretName')?.value;
      this.updatePasswordValidators(secretName);
      // Trigger change detection for parent form
      this.dataAddressForm.updateValueAndValidity({ emitEvent: true });
    });
  }

  private setupSslAuthSubscriptions(): void {
    this.sslAuthGroup.get('mutualTls')?.valueChanges.subscribe((enabled) => {
      const certControl = this.sslAuthGroup.get('tlsClientCert');
      const keyControl = this.sslAuthGroup.get('tlsClientKey');

      if (enabled) {
        certControl?.setValidators([Validators.required]);
        keyControl?.setValidators([Validators.required]);
      } else {
        certControl?.clearValidators();
        keyControl?.clearValidators();
      }

      certControl?.updateValueAndValidity();
      keyControl?.updateValueAndValidity();
    });
  }

  private updatePasswordValidators(secretName: string | null): void {
    const passwordControl = this.saslAuthGroup.get('password');
    const usernameControl = this.saslAuthGroup.get('username');
    if (!passwordControl || !usernameControl) return;

    const securityProtocol = this.dataAddressForm.get('securityProtocol')?.value;
    const mechanism = this.saslAuthGroup.get('mechanism')?.value;

    // OAuth mechanism doesn't use username/password (works for both SASL_PLAINTEXT and SASL_SSL)
    if (mechanism === 'OAUTHBEARER') {
      passwordControl.clearValidators();
      usernameControl.clearValidators();
      this.updateOAuthValidators();
    }
    // For PLAIN mechanism, password and username are always required
    else if (mechanism === 'PLAIN') {
      passwordControl.setValidators([Validators.required]);
      usernameControl.setValidators([Validators.required]);
      this.clearOAuthValidators();
    }
    // For SCRAM mechanisms with SASL_PLAINTEXT, password is always required
    else if (securityProtocol === KafkaSecurityProtocolEnum.SASL_PLAINTEXT) {
      passwordControl.setValidators([Validators.required]);
      usernameControl.setValidators([Validators.required]);
      this.clearOAuthValidators();
    }
    // For SCRAM mechanisms with SASL_SSL, password is required only when secretName is not provided
    else if (securityProtocol === KafkaSecurityProtocolEnum.SASL_SSL) {
      usernameControl.setValidators([Validators.required]);
      if (!secretName || secretName.trim() === '') {
        passwordControl.setValidators([Validators.required]);
      } else {
        passwordControl.clearValidators();
      }
      this.clearOAuthValidators();
    }

    passwordControl.updateValueAndValidity({ emitEvent: false });
    usernameControl.updateValueAndValidity({ emitEvent: false });
  }

  private updateOAuthValidators(): void {
    this.saslAuthGroup.get('clientId')?.setValidators([Validators.required]);
    this.saslAuthGroup.get('clientSecret')?.setValidators([Validators.required]);
    this.saslAuthGroup.get('tenantId')?.setValidators([Validators.required]);
    this.saslAuthGroup.get('scope')?.clearValidators();
    this.saslAuthGroup.get('clientId')?.updateValueAndValidity({ emitEvent: false });
    this.saslAuthGroup.get('clientSecret')?.updateValueAndValidity({ emitEvent: false });
    this.saslAuthGroup.get('tenantId')?.updateValueAndValidity({ emitEvent: false });
    this.saslAuthGroup.get('scope')?.updateValueAndValidity({ emitEvent: false });
  }

  private clearOAuthValidators(): void {
    this.saslAuthGroup.get('clientId')?.clearValidators();
    this.saslAuthGroup.get('clientSecret')?.clearValidators();
    this.saslAuthGroup.get('tenantId')?.clearValidators();
    this.saslAuthGroup.get('scope')?.clearValidators();
    this.saslAuthGroup.get('clientId')?.updateValueAndValidity({ emitEvent: false });
    this.saslAuthGroup.get('clientSecret')?.updateValueAndValidity({ emitEvent: false });
    this.saslAuthGroup.get('tenantId')?.updateValueAndValidity({ emitEvent: false });
    this.saslAuthGroup.get('scope')?.updateValueAndValidity({ emitEvent: false });
  }

  private initializeForm(): void {
    if (!this.dataAddress()) {
      return;
    }
    const data = this.dataAddress() as KafkaCompleteDataAddress;
    const securityProtocol = data?.['security.protocol'] || 'PLAINTEXT';

    this.dataAddressForm.patchValue({
      bootstrapServers: data?.['kafka.bootstrap.servers'] || '',
      topic: data?.topic || '',
      securityProtocol: securityProtocol
    });
    this.updateAuthenticationSection(securityProtocol);
  }

  private updateAuthenticationSection(securityProtocol: string): void {
    const data = this.dataAddress() as KafkaCompleteDataAddress & Record<string, unknown>;

    // Preserve current form values if they exist
    const currentSaslValues = this.dataAddressForm.get('saslAuth')?.value;
    const currentSslValues = this.dataAddressForm.get('sslAuth')?.value;

    // Remove all auth groups first
    if (this.dataAddressForm.get('saslAuth')) {
      this.dataAddressForm.removeControl('saslAuth');
    }
    if (this.dataAddressForm.get('sslAuth')) {
      this.dataAddressForm.removeControl('sslAuth');
    }

    // Add appropriate auth groups based on security protocol
    if (
      securityProtocol === KafkaSecurityProtocolEnum.SASL_PLAINTEXT ||
      securityProtocol === KafkaSecurityProtocolEnum.SASL_SSL
    ) {
      // SASL Authentication - use current values if available, otherwise use data or defaults
      const values = {
        mechanism: currentSaslValues?.mechanism || data?.['sasl.mechanism'] || 'PLAIN',
        username: currentSaslValues?.username || (data?.['sasl.username'] as string) || '',
        password:
          currentSaslValues?.password ||
          (data?.['sasl.password'] as string) ||
          this.secret()?.value ||
          '',
        secretName:
          currentSaslValues?.secretName || data?.secretName || this.secret()?.['@id'] || '',
        // OAuth fields - preserve current values
        clientId: currentSaslValues?.clientId || (data?.['oauth.clientId'] as string) || '',
        clientSecret:
          currentSaslValues?.clientSecret || (data?.['oauth.clientSecret'] as string) || '',
        tenantId: currentSaslValues?.tenantId || (data?.['oauth.tenantId'] as string) || '',
        scope: currentSaslValues?.scope || (data?.['oauth.scope'] as string) || ''
      };

      this.saslAuthGroup = this.createSaslAuthGroup(values);
      this.dataAddressForm.addControl('saslAuth', this.saslAuthGroup);

      // Setup subscriptions for SASL auth controls
      this.setupSaslAuthSubscriptions();

      if (this.secret()) {
        this.saslAuthGroup.get('secretName')?.disable();
      } else {
        this.saslAuthGroup.get('secretName')?.enable();
      }

      // Update password validators based on current secretName value
      const currentSecretName = this.saslAuthGroup.get('secretName')?.value;
      this.updatePasswordValidators(currentSecretName);
    }

    if (
      securityProtocol === KafkaSecurityProtocolEnum.SSL ||
      securityProtocol === KafkaSecurityProtocolEnum.SASL_SSL
    ) {
      // SSL/TLS Authentication - preserve current values
      const mutualTls = currentSslValues?.mutualTls ?? (!!data?.tls_client_cert || false);

      this.sslAuthGroup.patchValue({
        tlsCaSecret: currentSslValues?.tlsCaSecret || data?.tls_ca_secret || '',
        mutualTls: mutualTls,
        tlsClientCert: currentSslValues?.tlsClientCert || data?.tls_client_cert || '',
        tlsClientKey: currentSslValues?.tlsClientKey || data?.tls_client_key || ''
      });

      // Initialize validators based on mutualTls value
      const certControl = this.sslAuthGroup.get('tlsClientCert');
      const keyControl = this.sslAuthGroup.get('tlsClientKey');
      if (mutualTls) {
        certControl?.setValidators([Validators.required]);
        keyControl?.setValidators([Validators.required]);
      } else {
        certControl?.clearValidators();
        keyControl?.clearValidators();
      }

      this.dataAddressForm.addControl('sslAuth', this.sslAuthGroup);
      this.setupSslAuthSubscriptions();
    }
  }

  public isFormValid(): boolean {
    this.dataAddressForm.markAllAsTouched();
    this.dataAddressForm.updateValueAndValidity({ onlySelf: true, emitEvent: false });

    const securityProtocol = this.dataAddressForm.get('securityProtocol')?.value;

    if (
      securityProtocol === KafkaSecurityProtocolEnum.SASL_PLAINTEXT ||
      securityProtocol === KafkaSecurityProtocolEnum.SASL_SSL
    ) {
      this.saslAuthGroup.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    }

    if (
      securityProtocol === KafkaSecurityProtocolEnum.SSL ||
      securityProtocol === KafkaSecurityProtocolEnum.SASL_SSL
    ) {
      this.sslAuthGroup.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    }

    return this.dataAddressForm.valid;
  }

  public emitFormSubmit(): void {
    const { secretAction, secretInput } = this.getSecretActionAndInput();
    const dataAddress = transformInDataAddressKafka(
      this.dataAddressForm.getRawValue(),
      secretAction === CRUD.DELETE
    ) as DataAddress;

    // Only emit if form has changes or a secret deletion is requested
    if (!this.dataAddressForm.dirty && secretAction !== CRUD.DELETE) {
      return;
    }

    this.formSubmit.emit({
      form: this.dataAddressForm,
      dataAddress,
      secretInput,
      secretAction
    });
  }

  private getSecretActionAndInput(): {
    secretAction: CRUD | null;
    secretInput: SecretInputV3 | undefined;
  } {
    const secret = transformInSecretKafka(this.dataAddressForm.getRawValue());
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

    if (this.dataAddressForm.get('saslAuth')) {
      this.dataAddressForm.get('saslAuth')?.enable();
    }

    if (this.dataAddressForm.get('sslAuth')) {
      this.dataAddressForm.get('sslAuth')?.enable();
    }
  }

  toggleSecret(): void {
    this.showSecret = !this.showSecret;
  }

  deleteSecret() {
    const securityProtocol = this.dataAddressForm.get('securityProtocol')?.value;

    if (
      securityProtocol === KafkaSecurityProtocolEnum.SASL_PLAINTEXT ||
      securityProtocol === KafkaSecurityProtocolEnum.SASL_SSL
    ) {
      this.dataAddressForm.get('saslAuth.secretName')?.patchValue('');
      this.dataAddressForm.get('saslAuth.secretName')?.enable();
      this.dataAddressForm.get('saslAuth.password')?.patchValue('');
    }

    const secret = this.secret();
    this.dataAddressForm.markAsDirty();
    const dataAddress = transformInDataAddressKafka(this.dataAddressForm.getRawValue());

    if (secret) {
      this.secretAction.emit({ secret, dataAddress, action: CRUD.DELETE });
    }
  }
}
