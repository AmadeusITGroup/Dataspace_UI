import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  OnDestroy,
  output
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-search-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  styleUrls: ['./search-input.component.scss'],
  templateUrl: './search-input.component.html'
})
export class SearchInputComponent implements OnDestroy {
  public control = input.required<FormControl>();
  public placeholder = input<string>('Search...');
  public id = input<string>('search-input');
  public type = input<string>('text');
  public cleared = output<void>();

  private sub?: Subscription;

  constructor() {
    effect(() => {
      this.sub = this.control().valueChanges.subscribe((val) => {
        if (val === '') {
          this.cleared.emit();
        }
      });
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  clear() {
    this.control().setValue('');
  }
}
