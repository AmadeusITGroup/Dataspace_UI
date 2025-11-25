import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { PolicyCondition } from '../../models/policy-condition';
import { transformInArray } from '../../utils/object.util';

@Component({
  selector: 'app-policy-viewer',
  templateUrl: './policy-viewer.component.html',
  imports: [NgbAccordionModule, NgxJsonViewerModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PolicyViewerComponent {
  policy = input<PolicyCondition>();
  showEmptyItems = input<boolean>();

  protected readonly Array = Array;
  protected readonly transformInArray = transformInArray;
}
