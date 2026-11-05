import { ChangeDetectionStrategy, Component, inject, model, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StorageAccount, StorageAccountFormData } from '../../model/storage-account.model';

@Component({
  selector: 'app-storage-account-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './storage-account-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StorageAccountModalComponent implements OnInit {
  readonly activeModal = inject(NgbActiveModal);

  /** Set to an existing account when editing; null when creating. */
  readonly account = model<StorageAccount | null>(null);

  /** Whether the account name already exists (passed by parent). */
  readonly existingNames = model<string[]>([]);

  form!: FormGroup;

  get isEditMode(): boolean {
    return this.account() !== null;
  }

  ngOnInit(): void {
    const acct = this.account();
    this.form = new FormGroup({
      accountName: new FormControl({ value: acct?.accountName ?? '', disabled: this.isEditMode }, [
        Validators.required,
        Validators.pattern(/^[a-z0-9]{3,24}$/)
      ]),
      accountKey: new FormControl('', this.isEditMode ? [] : [Validators.required]),
      label: new FormControl(acct?.label ?? '')
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Check for duplicate name (only in create mode)
    const accountName = this.form.getRawValue().accountName;
    if (!this.isEditMode && this.existingNames().includes(accountName)) {
      this.form.get('accountName')?.setErrors({ duplicate: true });
      return;
    }

    const formData: StorageAccountFormData = {
      accountName,
      accountKey: this.form.value.accountKey,
      label: this.form.value.label || undefined
    };

    this.activeModal.close(formData);
  }
}
