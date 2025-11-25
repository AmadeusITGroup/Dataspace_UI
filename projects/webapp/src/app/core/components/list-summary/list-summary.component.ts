import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-list-summary',
  templateUrl: './list-summary.component.html',
  imports: [NgbTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListSummaryComponent {
  public shown = input.required<number>();
  public total = input.required<number>();
  public isTableLayout = input.required<boolean>();
  public toggable = input<boolean>(true);

  public toggleLayout = output<void>();

  onToggleLayout() {
    this.toggleLayout.emit();
  }
}
