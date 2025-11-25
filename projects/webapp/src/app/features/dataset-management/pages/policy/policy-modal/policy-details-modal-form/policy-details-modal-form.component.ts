import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbAccordionModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { I18N } from '../../../../../../core/i18n/translation.en';

@Component({
  selector: 'app-policy-details-modal-form',
  imports: [NgbAccordionModule, FormsModule, ReactiveFormsModule, NgbTooltipModule],
  templateUrl: 'policy-details-modal-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PolicyDetailsModalFormComponent {
  policyForm = input.required<FormGroup>();

  readonly I18N = I18N;
  readonly EXAMPLE = [
    {
      'odrl:action': { '@id': 'odrl:use' },
      'odrl:constraint': {
        'odrl:leftOperand': { '@id': 'eox-policy:Membership' },
        'odrl:operator': { '@id': 'odrl:eq' },
        'odrl:rightOperand': 'active'
      }
    }
  ];

  insertExample(field: 'permission' | 'obligation' | 'prohibition'): void {
    this.policyForm().get(field)?.setValue(JSON.stringify(this.EXAMPLE));
    this.policyForm().get(field)?.markAsDirty();
  }

  redirectToModel() {
    window.open('https://www.w3.org/TR/odrl-model/', '_blank');
  }

  protected readonly FormGroup = FormGroup;
}
