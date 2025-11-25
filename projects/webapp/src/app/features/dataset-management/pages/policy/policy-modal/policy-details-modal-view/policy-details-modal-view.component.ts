import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { PolicyResponse } from '../../../../../../core/models/policy';
import { PolicyViewerComponent } from '../../../../../../core/components/policy-viewver/policy-viewer.component';

@Component({
  selector: 'app-policy-details-modal-view',
  imports: [DatePipe, PolicyViewerComponent],
  templateUrl: 'policy-details-modal-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PolicyDetailsModalViewComponent {
  policyR = model.required<PolicyResponse>();
}
