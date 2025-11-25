import { ChangeDetectionStrategy, Component, computed, input, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  merge,
  Observable,
  OperatorFunction,
  Subject
} from 'rxjs';
import { filter } from 'rxjs/operators';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { ATTR_FORM } from '../show-error/show-error.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-input-typehead',
  standalone: true,
  imports: [NgbTypeahead, ReactiveFormsModule],
  template: `
    @if (label()) {
      <label [for]="id()">{{ label() }}</label>
    }
    <input
      [id]="id()"
      type="text"
      class="form-control"
      [class]="classes()"
      [editable]="editable()"
      [formControl]="formControl()"
      [ngbTypeahead]="search"
      [placeholder]="placeholder()"
      (focus)="focus$.next($any($event).target.value)"
      (click)="click$.next($any($event).target.value)"
      [class.is-invalid]="isInvalid()"
      popupClass="typeahead-popup"
      #instance="ngbTypeahead"
    />
  `,
  styles: `
    .filter {
      height: 60px;
    }
  `
})
export class InputTypeheadComponent {
  public fc = input.required<AbstractControl | null>();
  public id = input<string>('typeahead-focus');
  public label = input<string>('');
  public placeholder = input<string>('');
  public list = input<string[]>([]);
  public editable = input<boolean>(false);
  public classes = input<string>('');
  public displayInvalidOn = input<ATTR_FORM[]>([]);
  // Angular compiler not happy so i have to do this cast
  public formControl = computed(() => this.fc() as FormControl);

  public isInvalid() {
    return (
      this.displayInvalidOn().length &&
      this.displayInvalidOn().every((attr) => this.formControl()[attr])
    );
  }

  @ViewChild('instance', { static: true }) instance!: NgbTypeahead;

  focus$ = new Subject<string>();
  click$ = new Subject<string>();

  search: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.instance.isPopupOpen()));
    const inputFocus$ = this.focus$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      map((term) =>
        term === ''
          ? this.list()
          : this.list().filter((v) => v.toLowerCase().indexOf(term.toLowerCase()) > -1)
      )
    );
  };
}
