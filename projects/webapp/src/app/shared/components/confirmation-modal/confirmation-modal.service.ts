import { inject, Injectable } from '@angular/core';
import { ConfirmationModalComponent } from './confirmation-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationModalService {
  readonly #modalService = inject(NgbModal);

  showConfirmationModal(
    title: string,
    message: string,
    confirmButtonText: string,
    cancelButtonText: string,
    skin: 'positive' | 'danger' = 'positive'
  ) {
    const modalRef = this.#modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.title.set(title);
    modalRef.componentInstance.message.set(message);
    modalRef.componentInstance.confirmButtonText.set(confirmButtonText);
    modalRef.componentInstance.cancelButtonText.set(cancelButtonText);
    modalRef.componentInstance.skin.set(skin);
    return modalRef.result;
  }

  showDefaultConfirmationModal(title: string, message: string) {
    return this.showConfirmationModal(title, message, 'Confirm', 'Cancel', 'positive');
  }

  showDeleteConfirmationModal(title: string, message: string) {
    return this.showConfirmationModal(title, message, 'Delete', 'Cancel', 'danger');
  }

  showConfirmationModalWithReason(title: string, message: string) {
    const modalRef = this.#modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.title.set(title);
    modalRef.componentInstance.message.set(message);
    modalRef.componentInstance.confirmButtonText.set('Confirm');
    modalRef.componentInstance.cancelButtonText.set('Cancel');
    modalRef.componentInstance.requireReason.set(true);
    modalRef.componentInstance.skin.set('danger');
    return modalRef.result;
  }
}
