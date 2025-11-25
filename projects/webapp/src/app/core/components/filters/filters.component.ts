import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  OnDestroy,
  output
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { InputTypeheadComponent } from '../../../shared/components/input-typehead/input-typehead.component';
import { SearchInputComponent } from '../search-input/search-input.component';
import { FilterOption } from './filter-option.model';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchInputComponent, InputTypeheadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FiltersComponent implements OnDestroy {
  filters = input<FilterOption[]>([]);
  title = input<string>();
  filtersChanged = output<Record<string, string>>();

  private subscriptions: Subscription[] = [];

  constructor() {
    effect(() => {
      const filters = this.filters();
      if (filters && filters.length) {
        // The filters have changed, unsubscribe from previous filters() values
        // Seems to be an issue if we subscribe multiple times to the same control.valueChanges
        this.unsubscribeAll();
        filters.forEach((f) => {
          this.subscriptions.push(
            f.control.valueChanges.subscribe((value) => {
              if (f.type === 'typehead' && !value) {
                return; // When you input a text not in typeahead list, a valueChanges event is emitted with undefined
              }
              this.emitFilterValues();
            })
          );
        });
      }
      this.emitFilterValues();
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll();
  }

  private unsubscribeAll() {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = [];
  }

  emitFilterValues() {
    const values: Record<string, string> = {};
    this.filters().forEach((f) => {
      values[f.id] = f.control.value;
    });
    this.filtersChanged.emit(values);
  }

  clearAll() {
    this.filters().forEach((f) => {
      f.control.setValue(f.defaultValue ?? '');
      f.extraCallbackForReset?.();
    });
    this.emitFilterValues();
  }

  get anyFilterSet(): boolean {
    return this.filters().some((f) => {
      const value = f.control.value ?? '';
      const defaultValue = f.defaultValue ?? '';
      return value !== defaultValue;
    });
  }
}
