import { Directive, ElementRef, inject, input, output } from '@angular/core';
import { timedFeedback } from '../utils/timed-feedback.util';

@Directive({
  selector: '[appHighlight]',
  host: {
    '[class.highlight]': 'appHighlight()'
  },
  standalone: true
})
export class HighlightDirective {
  readonly #el = inject(ElementRef);

  public appHighlight = input.required<boolean>();
  public highlightTimeout = output<void>();

  constructor() {
    timedFeedback(
      this.appHighlight,
      4000,
      () => {
        this.#el.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
      () => {
        this.highlightTimeout.emit();
      }
    );
  }
}
