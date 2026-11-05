import { NgClass } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  output,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { PATTERNS } from '../../../../../../../core/constants/patterns.const';
import { I18N } from '../../../../../../../core/i18n/translation.en';
import { CRUD } from '../../../../../../../core/models/crud';
import { HtmlSanitizerService } from '../../../../../../../core/services/html-sanitizer.service';
import { FieldLinkComponent } from '../../../../../../../shared/components/field-link/field-link.component';
import { Asset } from '../../../../../model/asset/asset';
import * as datasetUtils from '../../../../../utils/dataset.util';
import { transformInAssetProperties } from '../../../../../utils/dataset.util';

@Component({
  selector: 'app-asset-properties-form',
  templateUrl: './asset-properties-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NgClass, NgbCollapseModule, FieldLinkComponent],
  styleUrls: ['./asset-properties-form.component.scss']
})
export class AssetPropertiesFormComponent implements AfterViewInit {
  protected readonly I18N = I18N;
  readonly fb = inject(FormBuilder);
  private htmlSanitizerService = inject(HtmlSanitizerService);

  public asset = input<Asset | null>();
  public mode = input<CRUD>(CRUD.CREATE);

  public formSubmit = output<{
    form: FormGroup;
    assetInput: Asset | undefined;
  }>();

  public deliveryMethodChange = output<string>();

  assetForm: FormGroup = this.fb.group({
    id: [{ value: '', disabled: false }, Validators.required],
    version: [{ value: '1.0', disabled: false }],
    properties: this.fb.group({
      name: [{ value: '', disabled: false }, Validators.required],
      description: [{ value: '', disabled: false }],
      type: [{ value: '', disabled: false }],
      logoUrl: [{ value: '', disabled: false }, Validators.pattern(PATTERNS.URL)],
      documentationUrl: [{ value: '', disabled: false }, Validators.pattern(PATTERNS.URL)],
      contenttype: [{ value: 'application/json', disabled: false }, Validators.required],
      accessType: [{ value: '', disabled: false }],
      deliveryMethod: [{ value: 'Api', disabled: false }],
      domainCategories: [{ value: [], disabled: false }],
      containsPII: [{ value: '', disabled: false }],
      containsPaymentInfo: [{ value: '', disabled: false }],
      accessLevel: [{ value: '', disabled: false }],
      currentLicense: [{ value: '', disabled: false }],
      licenses: [{ value: [], disabled: false }],
      averageRecordSizeBytes: [{ value: '', disabled: false }],
      // Analytics Dataset specific fields
      coverage: [{ value: '', disabled: false }],
      historyDepth: [{ value: '', disabled: false }],
      timeGranularity: [{ value: '', disabled: false }],
      updateFrequency: [{ value: '', disabled: false }],
      size: [{ value: '', disabled: false }],
      deliveryMethods: [{ value: '', disabled: false }]
    })
  });

  readonly accessTypes = datasetUtils.accessTypes;
  readonly deliveryMethods = datasetUtils.deliveryMethods;
  readonly domainCategories = datasetUtils.domainCategories;
  readonly piiConstraints = datasetUtils.piiConstraints;
  readonly paymentConstraints = datasetUtils.paymentConstraints;
  readonly accessLevels = datasetUtils.accessLevels;
  isCollapsed = true;

  @ViewChild('descriptionEditor') descriptionEditor?: ElementRef<HTMLDivElement>;

  constructor() {
    effect(() => {
      if (this.asset()) {
        this.initializeForm();
      }
    });

    // Subscribe to delivery method changes
    this.assetForm.get('properties.deliveryMethod')?.valueChanges.subscribe((value) => {
      this.deliveryMethodChange.emit(value || '');
      // Update type field with the selected delivery method value
      this.assetForm.get('properties.type')?.setValue(value || '', { emitEvent: false });
    });
  }

  private initializeForm(): void {
    if (!this.asset()) {
      return;
    }
    // Update the form values using patchValue
    this.assetForm.patchValue({
      id: this.asset()?.['@id'] || '',
      version: this.asset()?.properties?.version || '',
      properties: {
        name: this.asset()?.properties?.name || '',
        description: this.asset()?.properties?.description || '',
        logoUrl: this.asset()?.properties?.logoUrl || '',
        documentationUrl: this.asset()?.properties?.documentationUrl || '',
        contenttype: this.asset()?.properties?.contenttype || 'application/json',
        accessType: this.asset()?.properties?.accessType || '',
        deliveryMethod: this.asset()?.properties?.deliveryMethod || 'Api',
        type: this.asset()?.properties?.type || this.asset()?.properties?.deliveryMethod || 'Api',
        domainCategories: this.asset()?.properties?.domainCategories || '',
        containsPaymentInfo: this.asset()?.properties?.containsPaymentInfo || '',
        containsPII: this.asset()?.properties?.containsPII || '',
        accessLevel: this.asset()?.properties?.accessLevel || '',
        licenses:
          typeof this.asset()?.properties?.licenses == 'string'
            ? [this.asset()?.properties?.licenses]
            : this.asset()?.properties?.licenses || [],
        currentLicense: '',
        averageRecordSizeBytes: this.asset()?.properties?.averageRecordSizeBytes || '',
        // Analytics Dataset specific fields
        coverage: this.asset()?.properties?.coverage || '',
        historyDepth: this.asset()?.properties?.historyDepth || '',
        timeGranularity: this.asset()?.properties?.timeGranularity || '',
        updateFrequency: this.asset()?.properties?.updateFrequency || '',
        size: this.asset()?.properties?.size || '',
        deliveryMethods: this.asset()?.properties?.deliveryMethods || ''
      }
    });

    // Explicitly disable the 'id' field
    this.assetForm.get('id')?.disable();

    // Set the editor content without triggering re-render
    this.setEditorContent();

    this.emitFormSubmit();
  }

  ngAfterViewInit(): void {
    // Set initial content when view is ready
    this.setEditorContent();
  }

  private setEditorContent(): void {
    if (this.descriptionEditor) {
      const description = this.assetForm.get('properties.description')?.value || '';
      // Only set if content is different to avoid cursor issues
      if (this.descriptionEditor.nativeElement.innerHTML !== description) {
        this.descriptionEditor.nativeElement.innerHTML = description;
      }
    }
  }

  onKeydownLicense(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      // Add the input content in the licenses array
      const licenses = this.assetForm.get('properties.licenses')?.value;
      const licenseInput = this.assetForm.get('properties.currentLicense')?.value;
      if (licenses) {
        licenses.push(licenseInput);
        this.assetForm.get('properties.currentLicense')?.reset();
        this.assetForm.get('properties.currentLicense')?.markAsDirty();
      }
    }
  }

  public removeLicense(index: number): void {
    const licenses = this.assetForm.get('properties.licenses')?.value;
    if (licenses) {
      licenses.splice(index, 1);
    }
    // this.assetForm.get('properties.licenses')?.reset();
    this.assetForm.get('properties.licenses')?.markAsDirty();
    this.assetForm.get('properties.currentLicense')?.markAsDirty();
  }

  public isFormValid(): boolean {
    this.assetForm.markAllAsTouched();
    this.assetForm.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    return this.assetForm.valid;
  }

  public emitFormSubmit(): void {
    if (this.isFormValid() && this.assetForm.dirty) {
      const assetInput = transformInAssetProperties(
        this.assetForm.getRawValue(),
        this.asset()?.['@id']
      );
      this.formSubmit.emit({
        form: this.assetForm,
        assetInput: assetInput as Asset
      });
    }
  }

  enableForm(): void {
    this.assetForm.enable();
  }

  // Rich text formatting methods
  formatText(command: string, value?: string): void {
    document.execCommand(command, false, value);
    this.updateDescriptionValue();
  }

  onDescriptionInput(): void {
    this.updateDescriptionValue();
  }

  private updateDescriptionValue(): void {
    if (this.descriptionEditor) {
      const htmlContent = this.descriptionEditor.nativeElement.innerHTML;
      // Sanitize to only allow safe tags using shared service
      const sanitized = this.htmlSanitizerService.sanitizeHtml(htmlContent);
      this.assetForm.get('properties.description')?.setValue(sanitized);
      this.assetForm.get('properties.description')?.markAsDirty();
    }
  }
}
