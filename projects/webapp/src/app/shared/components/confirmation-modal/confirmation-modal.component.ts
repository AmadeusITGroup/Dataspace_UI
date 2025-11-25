import { ChangeDetectionStrategy, Component, model, output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-confirmation-modal',
  imports: [FormsModule],
  templateUrl: './confirmation-modal.component.html',
  styleUrl: './confirmation-modal.component.scss'
})
export class ConfirmationModalComponent {
  public title = model<string>('Confirm Action');
  public message = model<string>('Are you sure you want to proceed?');
  public confirmButtonText = model<string>('Confirm');
  public cancelButtonText = model<string>('Cancel');
  public skin = model<'positive' | 'danger'>('positive');
  public requireReason = model<boolean>(false);
  public reason = model<string>('');

  public confirm = output<string | void>();

  constructor(public activeModal: NgbActiveModal) {}

  onConfirm(): void {
    if (this.requireReason()) {
      this.confirm.emit(this.reason());
      this.activeModal.close(this.reason());
    } else {
      this.confirm.emit();
      this.activeModal.close(true);
    }
  }

  onCancel(): void {
    this.activeModal.close(false);
  }
}
