import { Component, ChangeDetectionStrategy, input, InputSignal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PATTERNS } from '../../../core/constants/patterns.const';

@Component({
  selector: 'app-field-link',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./field-link.component.scss'],
  template: ` @if (validHref()) {
    <a
      class="input-group-text bg-white border-start-0"
      [href]="url()"
      target="_blank"
      rel="noopener noreferrer"
      [attr.title]="title()"
    >
      <i class="bi bi-arrow-right"></i>
    </a>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldLinkComponent {
  url: InputSignal<string> = input('');
  title: InputSignal<string> = input('Validate link');

  validHref = computed(() => {
    if (!this.url()) return null;
    const pattern = PATTERNS.URL as RegExp | string;
    const regex = pattern instanceof RegExp ? pattern : new RegExp(String(pattern));
    return regex.test(this.url()) ? this.url() : null;
  });
}
