import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  model,
  output,
  signal
} from '@angular/core';
import { FooterAction } from '../../../core/models/ui-action';
import { FormsModule } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-footer-action-modal',
  standalone: true,
  imports: [NgClass, FormsModule],
  template: `
    @if (footerAction()) {
      <div class="d-flex justify-content-between gap-2 forward-animated">
        @if (footerAction() !== FooterAction.TERMINATE) {
          <div class="pt-2 d-inline-block">{{ labelMessage() }}</div>
        } @else {
          <div class="w-75">
            <span>Reason</span>
            <div class="d-inline-block ms-2 w-75">
              <input id="reason" type="text" class="form-control" [(ngModel)]="reason" />
            </div>
          </div>
        }

        <div>
          <button class="btn btn-outline-danger" (click)="resetDisplay()">Cancel</button>
          <button class="ms-2 btn btn-danger" (click)="emitAction(); resetDisplay()">
            <i class="bi bi-trash me-2"></i>
            <span>{{ labelAction() }}</span>
          </button>
        </div>
      </div>
    } @else {
      <div [ngClass]="{ 'backward-animated': canAnimateNgContent() }">
        <ng-content></ng-content>
      </div>
    }
  `,
  styleUrls: ['./footer-action-modal.component.scss']
})
export class FooterActionModalComponent {
  // inputs
  footerAction = model<FooterAction | null>();
  // outputs
  actionClicked = output<{ action: FooterAction; reason: string }>();
  // internal state
  public canAnimateNgContent = signal(false);
  public labelMessage = computed(() => {
    switch (this.footerAction()) {
      case FooterAction.DELETE:
        return 'Are you sure you want to delete this resource?';
      case FooterAction.REVOKE:
        return 'Are you sure you want to revoke this resource?';
      case FooterAction.RESUME:
        return 'Are you sure you want to resume this resource?';
      default:
        return '';
    }
  });
  public labelAction = computed(() => {
    switch (this.footerAction()) {
      case FooterAction.DELETE:
        return 'Delete';
      case FooterAction.REVOKE:
        return 'Revoke';
      case FooterAction.TERMINATE:
        return 'Terminate';
      case FooterAction.RESUME:
        return 'Resume';
      default:
        return '';
    }
  });
  public reason = '';
  protected readonly FooterAction = FooterAction;

  constructor() {
    effect(() => {
      // When footerAction is set for the first time, we want to animate the ng-content
      if (this.footerAction() && !this.canAnimateNgContent()) {
        this.canAnimateNgContent.set(true);
      }
    });
  }

  public emitAction() {
    this.actionClicked.emit({ action: this.footerAction() as FooterAction, reason: this.reason });
  }

  public resetDisplay() {
    this.reason = '';
    this.footerAction.set(null);
  }
}
