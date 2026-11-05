import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { SecretInput } from 'management-sdk';
import { CRUD } from '../../../../../../../core/models/crud';
import { DataAddress, S3DataAddress } from '../../../../../model/asset/dataAddress';
import { transformInDataAddressS3 } from '../../../../../utils/dataset.util';

@Component({
  selector: 'app-asset-data-address-s3',
  templateUrl: './asset-data-address-s3.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule]
})
export class AssetDataAddressS3Component {
  readonly fb = inject(FormBuilder);

  public dataAddress = input<DataAddress | null>();
  public secret = input<SecretInput | null>();
  public mode = input<CRUD>(CRUD.CREATE);

  public secretAction = output<{
    secret: SecretInput | undefined;
    dataAddress: S3DataAddress;
    action: CRUD | null;
  }>();

  public formSubmit = output<{
    form: FormGroup;
    dataAddress: S3DataAddress;
    secretInput: SecretInput | undefined;
    secretAction: CRUD | null;
  }>();

  dataAddressForm: FormGroup = this.fb.group({
    bucketName: ['', Validators.required],
    region: ['', Validators.required],
    pathPrefix: [''],
    accessKeyId: ['', Validators.required],
    secretAccessKey: ['', Validators.required],
    endpointUrl: ['']
  });

  showSecret = false;

  constructor() {
    effect(() => {
      if (this.dataAddress()) {
        this.initializeForm();
      }
    });
  }

  private initializeForm(): void {
    const address = this.dataAddress() as S3DataAddress | null;
    if (address) {
      this.dataAddressForm.patchValue({
        bucketName: address.bucketName || '',
        region: address.region || '',
        pathPrefix: address.pathPrefix || '',
        accessKeyId: address.accessKeyId || '',
        secretAccessKey: address.secretAccessKey || '',
        endpointUrl: address.endpointUrl || ''
      });
    }
  }

  onSubmit(): void {
    if (this.dataAddressForm.valid) {
      const formValue = this.dataAddressForm.value;
      const dataAddress = transformInDataAddressS3({
        bucketName: formValue.bucketName,
        region: formValue.region,
        pathPrefix: formValue.pathPrefix,
        accessKeyId: formValue.accessKeyId,
        secretAccessKey: formValue.secretAccessKey,
        endpointUrl: formValue.endpointUrl
      }) as S3DataAddress;

      this.formSubmit.emit({
        form: this.dataAddressForm,
        dataAddress,
        secretInput: undefined,
        secretAction: null
      });
    }
  }

  isFormValid(): boolean {
    return this.dataAddressForm.valid;
  }

  emitFormSubmit(): void {
    this.onSubmit();
  }

  enableForm(): void {
    this.dataAddressForm.enable();
  }
}
