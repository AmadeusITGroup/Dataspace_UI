import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  model,
  output,
  signal
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { NgbActiveModal, NgbDropdownModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ContractDefinitionInputV3, Criterion1 } from 'management-sdk';
import { Policy } from '../../../../../core/models/policy';
import { ToastService } from '../../../../../core/toasts/toast-service';
import { resourceExistsValidator } from '../../../../../core/validators/resource-exists.validator';
import { Asset } from '../../../model/asset/asset';
import { ContractDefinition } from '../../../model/contract/contract-definition.model';
import { ContractDefinitionManagementService } from '../../../services/contract-definition-management.service';
import { CRUD } from '../../../../../core/models/crud';
import { I18N } from '../../../../../core/i18n/translation.en';
import { FooterActionModalComponent } from '../../../../../shared/components/delete-footer-modal/footer-action-modal.component';
import { NgClass } from '@angular/common';
import { EmptyPageMessageComponent } from '../../../../../shared/components/show-error/show-error.component';
import { InputTypeheadComponent } from '../../../../../shared/components/input-typehead/input-typehead.component';
import { convertToTypeheadList } from '../../../../../core/utils/typehead.utils';
import { FooterAction } from '../../../../../core/models/ui-action';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-contract-form-modal',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgbDropdownModule,
    NgbTooltip,
    FooterActionModalComponent,
    NgClass,
    EmptyPageMessageComponent,
    InputTypeheadComponent
  ],
  providers: [ContractDefinitionManagementService],
  templateUrl: './contract-form-modal.component.html'
})
export class ContractFormModalComponent {
  readonly activeModal = inject(NgbActiveModal);
  readonly #contractDefinitionManagementService = inject(ContractDefinitionManagementService);
  readonly #toastService = inject(ToastService);
  readonly fb = inject(FormBuilder);

  public mode = model<CRUD>(CRUD.CREATE);
  public contractDef = model.required<ContractDefinition>();
  public assets = model.required<Asset[]>();
  public policies = model.required<Policy[]>();
  public deleteContract = output<ContractDefinition>();

  public contractForm!: FormGroup;
  public footerAction = signal<FooterAction | null>(null);
  public policiesIds: string[] = [];
  public assetIds: string[] = [];
  readonly I18N = I18N;
  readonly CRUD = CRUD;
  readonly FooterAction = FooterAction;

  public submitPending = computed(() => {
    return (
      this.#contractDefinitionManagementService.createContractDefinitionQuery.isPending() ||
      this.#contractDefinitionManagementService.updateContractDefinitionQuery.isPending()
    );
  });

  constructor() {
    effect(() => {
      this.initForm();
      this.assetIds = convertToTypeheadList(this.assets(), '@id');
      this.policiesIds = convertToTypeheadList(this.policies(), '@id');
      this.updateForm();
    });
  }

  private initForm() {
    this.contractForm = this.fb.group({
      contractId: [null, Validators.required],
      asset: [null, [Validators.required, resourceExistsValidator<Asset>(this.assets(), '@id')]],
      contractPolicyId: [
        null,
        [Validators.required, resourceExistsValidator<Policy>(this.policies(), '@id')]
      ],
      accessPolicyId: [
        null,
        [Validators.required, resourceExistsValidator<Policy>(this.policies(), '@id')]
      ]
    });
  }

  private updateForm() {
    if (this.contractDef()) {
      this.contractForm.reset();
      this.contractForm.patchValue({
        contractId: this.contractDef()['@id'],
        asset: this.contractDef().assetName,
        contractPolicyId: this.contractDef().contractPolicyId,
        accessPolicyId: this.contractDef().accessPolicyId
      });
      this.contractForm.controls['contractId'].disable();
    }
  }

  public cancel() {
    if (this.contractForm.dirty) {
      this.updateForm();
    } else {
      this.activeModal.close();
    }
  }

  public save() {
    // SET THE SUBMITTED CONTROL TO TRUE AND MARK THE FORM AS TOUCHED TO SHOW VALIDATION ERRORS
    this.contractForm.markAllAsTouched();
    // mark typehead controls as dirty to show validation errors
    Object.values(this.contractForm.controls).forEach((control) => {
      control.updateValueAndValidity();
    });
    if (this.contractForm.invalid) {
      return;
    }
    if (this.contractForm.valid && !this.contractForm.dirty) {
      this.activeModal.close();
      return;
    }
    const formValue = this.contractForm.value;
    const criterion: Criterion1 = {
      '@type': 'Criterion',
      operandLeft: 'https://w3id.org/edc/v0.0.1/ns/id' as unknown as object,
      operator: '=',
      operandRight: formValue.asset
    };
    const payload: ContractDefinitionInputV3 = {
      '@id': formValue.contractId || this.contractDef()['@id'],
      '@type': 'ContractDefinition',
      '@context': {},
      contractPolicyId: formValue.contractPolicyId,
      accessPolicyId: formValue.accessPolicyId,
      assetsSelector: formValue.asset ? [criterion] : []
    };
    const action = this.mode() === CRUD.CREATE ? 'created' : 'updated';
    const query =
      this.mode() === CRUD.CREATE
        ? 'createContractDefinitionQuery'
        : 'updateContractDefinitionQuery';

    this.#contractDefinitionManagementService[query].mutate(payload, {
      onSuccess: () => {
        this.activeModal.close(payload);
        this.#toastService.showSuccess(
          `The Offer ${payload['@id']} has been ${action} successfully`
        );
      },
      onError: (error: Error) => {
        const errorBE = error as HttpErrorResponse;
        console.error(error);
        this.#toastService.showError('Error ' + action + ' Offer: ' + errorBE.error[0].message);
      }
    });
  }

  public onActionClicked(event: { action: FooterAction; reason: string }) {
    if (event.action === FooterAction.DELETE) {
      this.delete();
    }
  }

  private delete() {
    this.deleteContract.emit(this.contractDef());
    this.activeModal.close();
  }
}
