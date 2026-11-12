import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  TemplateRef
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { retrieveErrorMessage } from '../../../../../../core/utils/object.util';
import { OntologySchemaProperty, OntologySelection } from '../../../../model/ontology';
import { OntologyManagementService } from '../../../../services/ontology-management.service';

@Component({
  selector: 'app-ontology-selector',
  imports: [CommonModule, ReactiveFormsModule],
  providers: [OntologyManagementService],
  templateUrl: './ontology-selector.component.html',
  styleUrl: './ontology-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OntologySelectorComponent {
  readonly #ontologyService = inject(OntologyManagementService);
  readonly #modalService = inject(NgbModal);

  readonly selectedOntologyId = signal('');
  readonly selectedClassName = signal('');
  readonly classSearch = signal('');
  readonly endpointDescription = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^https?:\/\/.+/)]
  });

  readonly ontologiesQuery = injectQuery(() => ({
    queryKey: ['asset-ontologies'],
    queryFn: () => lastValueFrom(this.#ontologyService.getOntologies())
  }));

  readonly ontologyQuery = injectQuery(() => ({
    queryKey: ['asset-ontology', this.selectedOntologyId()],
    queryFn: () => lastValueFrom(this.#ontologyService.getOntology(this.selectedOntologyId())),
    enabled: this.selectedOntologyId().length > 0
  }));

  readonly selectedOntologyDescription = computed(
    () =>
      this.ontologiesQuery.data()?.find(({ id }) => id === this.selectedOntologyId())
        ?.description ?? ''
  );

  readonly filteredClassNames = computed(() => {
    const schemas = this.ontologyQuery.data()?.openApiSchema.components.schemas ?? {};
    const search = this.classSearch().trim().toLowerCase();
    return Object.keys(schemas)
      .filter((name) => !search || name.toLowerCase().includes(search))
      .slice(0, 40);
  });

  readonly selectedSchema = computed(() => {
    const details = this.ontologyQuery.data();
    return details?.openApiSchema.components.schemas[this.selectedClassName()];
  });

  readonly schemaCount = computed(
    () => Object.keys(this.ontologyQuery.data()?.openApiSchema.components.schemas ?? {}).length
  );

  readonly selectedProperties = computed(() => {
    const schema = this.selectedSchema();
    const schemas = this.ontologyQuery.data()?.openApiSchema.components.schemas ?? {};
    const required = new Set(schema?.required ?? []);
    const properties = { ...(schema?.properties ?? {}) };
    required.forEach((name) => {
      if (!properties[name]) {
        properties[name] =
          Object.values(schemas).find((candidate) => candidate.properties?.[name])?.properties?.[
            name
          ] ?? {};
      }
    });
    return Object.entries(properties).map(([name, property]) => ({
      name,
      required: required.has(name),
      description: property.description ?? '',
      type: this.propertyType(property)
    }));
  });

  selectOntology(id: string): void {
    this.selectedOntologyId.set(id);
    this.selectedClassName.set('');
    this.classSearch.set('');
    this.endpointDescription.reset('');
  }

  selectClass(name: string): void {
    this.selectedClassName.update((selected) => (selected === name ? '' : name));
  }

  openSchemaExplorer(content: TemplateRef<unknown>): void {
    this.#modalService.open(content, { centered: true, scrollable: true, size: 'xl' });
  }

  isValid(): boolean {
    if (!this.selectedOntologyId()) {
      return true;
    }
    this.endpointDescription.markAsTouched();
    return this.endpointDescription.valid && this.ontologyQuery.isSuccess();
  }

  isDirty(): boolean {
    return this.selectedOntologyId().length > 0 || this.endpointDescription.dirty;
  }

  selection(): OntologySelection | null {
    const details = this.ontologyQuery.data();
    if (!details || !this.endpointDescription.valid) {
      return null;
    }
    return {
      ontologyId: details.id,
      profileIri: details.profileIri,
      endpointDescription: this.endpointDescription.value
    };
  }

  errorMessage(error: unknown): string {
    return retrieveErrorMessage(error as HttpErrorResponse);
  }

  downloadProfile(): void {
    const details = this.ontologyQuery.data();
    if (!details) return;
    const content = JSON.stringify(details.openApiSchema, null, 2);
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${details.id}-openapi-schema.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  schemaJson(): string {
    return JSON.stringify(this.selectedSchema(), null, 2);
  }

  private propertyType(property: OntologySchemaProperty): string {
    const reference = property.$ref ?? property['x-iata-$ref'] ?? property.items?.$ref;
    if (reference) return reference.split('/').pop() ?? reference;
    if (property.items?.type) return `array<${property.items.type}>`;
    return property.type ?? 'object';
  }
}
