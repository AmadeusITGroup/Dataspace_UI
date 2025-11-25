import { ChangeDetectionStrategy, Component, input, signal, viewChild } from '@angular/core';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { copyToClipboard } from '../utils/common.util';
import { timedFeedback } from '../utils/timed-feedback.util';

@Component({
  selector: 'app-copy-button',
  imports: [NgbPopover],
  template: `<button
    [class]="btnClass()"
    [autoClose]="false"
    triggers="manual"
    ngbPopover="Copied!"
    (click)="copy($event)"
    [title]="label()"
  >
    <i class="bi" [class.bi-copy]="!showCopyDone()" [class.bi-check]="showCopyDone()"></i>
  </button>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CopyButtonComponent {
  btnClass = input<string>('');
  text = input.required<string>();
  label = input<string>('Copy to clipboard');
  popover = viewChild.required(NgbPopover);

  showCopyDone = signal(false);

  constructor() {
    timedFeedback(
      this.showCopyDone,
      1000,
      () => {
        this.popover().open();
      },
      () => {
        this.popover().close();
        this.showCopyDone.set(false);
      }
    );
  }

  async copy(event: MouseEvent) {
    event.stopPropagation();
    await copyToClipboard(this.text());
    this.showCopyDone.set(true);
  }
}
