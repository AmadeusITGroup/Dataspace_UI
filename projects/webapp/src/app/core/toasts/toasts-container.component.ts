import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { CopyButtonComponent } from '../components/copy-button.component';
import { ToastService } from './toast-service';

@Component({
  selector: 'app-toasts',
  imports: [NgbToast, CopyButtonComponent],
  styles: [
    `
      ::ng-deep .toast-button {
        background: transparent;
        border: none;
        color: inherit;
        padding: 0;
      }
      .toast-text {
        width: calc(100% - 4em);
      }
      .toast-icons {
        position: absolute;
        right: 1em;
        width: 4em;
      }
    `
  ],
  template: `
    @if (toastService.toasts().length > 0) {
      @defer {
        @for (toast of toastService.toasts(); track toast) {
          <ngb-toast
            [class]="toast.classname + ' position-relative'"
            [autohide]="true"
            [delay]="toast.delay || 5000"
            (hidden)="toastService.remove(toast)"
          >
            <div class="toast-icons text-end">
              <app-copy-button btnClass="toast-button" [text]="toast.content"></app-copy-button>
              <button
                type="button"
                class="toast-button ms-3 bi bi-x-lg"
                (click)="toastService.remove(toast)"
                title="Close"
              ></button>
            </div>
            <div class="toast-text">
              {{ toast.content }}
            </div>
          </ngb-toast>
        }
      }
    }
  `,
  host: { class: 'toast-container position-fixed top-0 end-0 p-3', style: 'z-index: 1200' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastsContainerComponent {
  toastService = inject(ToastService);
}
