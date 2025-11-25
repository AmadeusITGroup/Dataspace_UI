import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  model,
  OnInit,
  output,
  signal
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CRUD } from '../../../../../core/models/crud';
import { Duty } from '../../../../../core/models/duty';
import { PolicyResponse, PolicyType } from '../../../../../core/models/policy';
import { Prohibition } from '../../../../../core/models/prohibition';
import { ToastService } from '../../../../../core/toasts/toast-service';
import { removeEmptyProperties } from '../../../../../core/utils/object.util';
import { jsonValidator } from '../../../../../core/validators/json.validator';
import { PolicyManagementService } from '../../../services/policy-management.service';
import { PolicyDetailsModalFormComponent } from './policy-details-modal-form/policy-details-modal-form.component';
import { PolicyDetailsModalViewComponent } from './policy-details-modal-view/policy-details-modal-view.component';
import { NgClass } from '@angular/common';
import { FooterActionModalComponent } from '../../../../../shared/components/delete-footer-modal/footer-action-modal.component';
import { FooterAction } from '../../../../../core/models/ui-action';

@Component({
  imports: [
    PolicyDetailsModalViewComponent,
    PolicyDetailsModalFormComponent,
    NgClass,
    FooterActionModalComponent
  ],
  providers: [PolicyManagementService],
  templateUrl: 'policy-details-modal.component.html',
  styleUrl: 'policy-details-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PolicyDetailsModalComponent implements OnInit {
  readonly activeModal = inject(NgbActiveModal);
  readonly fb = inject(FormBuilder);
  readonly listQuery = inject(PolicyManagementService).policiesQuery;
  readonly updateQuery = inject(PolicyManagementService).updatePolicyQuery;
  readonly createQuery = inject(PolicyManagementService).createPolicyQuery;
  readonly deleteQuery = inject(PolicyManagementService).deletePolicyQuery;
  readonly toastService = inject(ToastService);

  public policyR = model.required<PolicyResponse>();
  public mode = model.required<CRUD>();
  public deletePolicy = output<PolicyResponse>();

  public policyForm!: FormGroup;
  public footerAction = signal<FooterAction | null>(null);
  public readonly CRUD = CRUD;
  public readonly FooterAction = FooterAction;

  get title(): string {
    return this.mode() === CRUD.READ
      ? this.policyR()?.['@id'] || ''
      : this.policyForm?.get('id')?.value;
  }

  ngOnInit(): void {
    this.initPolicyForm();
    this.handleDisableForm();
  }

  private initPolicyForm() {
    this.policyForm = this.fb.group({
      id: [this.policyR()?.['@id'] || '', Validators.required],
      permission: [
        this.formatJsonPerms(this.policyR()?.policy?.['odrl:permission']),
        jsonValidator()
      ],
      obligation: [
        this.formatJsonPerms(this.policyR()?.policy?.['odrl:obligation']),
        jsonValidator()
      ],
      prohibition: [
        this.formatJsonPerms(this.policyR()?.policy?.['odrl:prohibition']),
        jsonValidator()
      ]
    });
  }

  public handleDisableForm() {
    if (this.mode() === CRUD.UPDATE) {
      this.policyForm.get('id')?.disable();
    }
  }

  private formatJsonPerms(items: Duty[] | Permissions[] | Prohibition[] | undefined): string {
    return Array.isArray(items) ? (items.length ? JSON.stringify(items) : '') : '';
  }

  save(): void {
    // SET THE SUBMITTED CONTROL TO TRUE AND MARK THE FORM AS TOUCHED TO SHOW VALIDATION ERRORS
    this.policyForm.markAllAsTouched();

    if (this.policyForm.invalid) {
      return;
    }
    if (!this.policyForm.dirty) {
      this.activeModal.close();
      return;
    }
    const payload = this.fromFormToPolicyR();
    if (this.mode() === CRUD.UPDATE) {
      this.updateQuery.mutate(payload, {
        onSuccess: () => {
          this.handleSuccess('The policy has been updated successfully', payload['@id']);
        },
        onError: (error: Error) => {
          this.handleError('Error updating policy: ', error);
        }
      });
    } else {
      this.createQuery.mutate(payload, {
        onSuccess: (result) => {
          this.handleSuccess('The policy has been created successfully', result['@id']);
        },
        onError: (error: Error) => {
          this.handleError('Error creating policy: ', error);
        }
      });
    }
  }

  private handleSuccess(content: string, id?: string): void {
    this.toastService.showSuccess(content);
    this.listQuery.refetch();
    this.activeModal.close(id || null);
  }

  private handleError(message: string, error: Error): void {
    const httpError = error as HttpErrorResponse;
    console.error(httpError);
    this.toastService.showError(message + httpError.error[0].message);
  }

  private fromFormToPolicyR(): PolicyResponse {
    const policyForm = this.policyForm;
    const policy = {
      '@context': 'http://www.w3.org/ns/odrl.jsonld',
      '@type': 'http://www.w3.org/ns/odrl/2/Set' as PolicyType,
      'odrl:assignee': policyForm.get('assignee')?.value,
      'odrl:assigner': policyForm.get('assigner')?.value,
      'odrl:permission': policyForm.get('permission')?.value
        ? JSON.parse(policyForm.get('permission')?.value)
        : [],
      'odrl:obligation': policyForm.get('obligation')?.value
        ? JSON.parse(policyForm.get('obligation')?.value)
        : [],
      'odrl:prohibition': this.policyForm.get('prohibition')?.value
        ? JSON.parse(this.policyForm.get('prohibition')?.value)
        : [],
      'odrl:profiles': []
    };
    return {
      '@id': policyForm.get('id')?.value,
      '@type': 'PolicyDefinitionDto',
      policy: removeEmptyProperties(policy)
    };
  }

  cancel(): void {
    if (this.mode() === CRUD.UPDATE) {
      this.policyForm.reset({
        id: this.policyR()?.['@id'] || '',
        assignee: this.policyR()?.policy?.['odrl:assigner'] || '',
        assigner: this.policyR()?.policy?.['odrl:assignee'] || '',
        permission: this.formatJsonPerms(this.policyR()?.policy?.['odrl:permission']),
        obligation: this.formatJsonPerms(this.policyR()?.policy?.['odrl:obligation']),
        prohibition: this.formatJsonPerms(this.policyR()?.policy?.['odrl:prohibition'])
      });
      this.mode.set(CRUD.READ);
    } else {
      this.activeModal.close();
    }
  }

  public onActionChanged(action: { action: FooterAction; reason: string }) {
    if (action.action === 'delete') {
      this.delete();
    }
  }

  private delete(): void {
    this.deletePolicy.emit(this.policyR());
    this.activeModal.close();
  }

  public submitPending = computed(() => {
    return this.createQuery.isPending() || this.updateQuery.isPending();
  });
}
