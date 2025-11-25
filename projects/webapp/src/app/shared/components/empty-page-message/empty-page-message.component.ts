import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-page-message',
  templateUrl: './empty-page-message.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyPageMessageComponent {
  public icon = input.required<string>();
  public message = input.required<string>();
  public errorMessage = input<string>('');
}
