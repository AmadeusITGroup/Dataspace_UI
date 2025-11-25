import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  model,
  OnDestroy,
  signal
} from '@angular/core';
import { ATTR_FORM } from './show-error.model';
import { transformInArray } from '../../../core/utils/object.util';
import { AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-error-message',
  template: `
    @if (isError()) {
      <div [class]="'text-' + type()"><ng-content></ng-content></div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyPageMessageComponent implements OnDestroy {
  public fc = model<AbstractControl | null>();
  public attributes = input<ATTR_FORM | ATTR_FORM[]>();
  public errorKey = input<string>();
  public errorValue = input<string>();
  public type = input<'danger' | 'warning' | 'info'>('danger');

  public isError = signal<boolean>(false);

  public subscriptions: Subscription[] = [];

  constructor() {
    effect(() => {
      const fc = this.fc();
      const attributes = transformInArray(this.attributes());
      const errorAttribute = this.errorKey();
      if (fc && attributes.length && errorAttribute) {
        this.unsubscribeAll();
        this.subscriptions.push(
          fc.statusChanges.subscribe(() => this.checkError(fc, attributes, errorAttribute))
        );
        this.checkError(fc, attributes, errorAttribute);
      }
    });
  }

  private checkError(fc: AbstractControl, attributes: ATTR_FORM[], errorAttribute: string) {
    const checkAttributes = attributes.every((atr) => fc[atr]);
    let checkErrorAttribute: unknown = true;
    if (errorAttribute) {
      checkErrorAttribute = fc?.errors?.[errorAttribute];
      checkErrorAttribute = this.errorValue()
        ? checkErrorAttribute === this.errorValue()
        : !!checkErrorAttribute;
    }
    this.isError.set(checkAttributes && !!checkErrorAttribute);
  }

  private unsubscribeAll() {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = [];
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
  }
}
