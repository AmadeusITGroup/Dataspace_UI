import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { of } from 'rxjs';
import { OntologyDetails } from '../../../../model/ontology';
import { OntologyManagementService } from '../../../../services/ontology-management.service';
import { OntologySelectorComponent } from './ontology-selector.component';

describe('OntologySelectorComponent', () => {
  const modalService = { open: jest.fn() };
  const details: OntologyDetails = {
    id: 'inria-iata-24.4.0',
    ontologyName: 'INRIA DXP IATA Open Air 24.4.0',
    description: 'IATA validation profile',
    version: '24.4.0',
    profileIri: 'https://w3id.org/dse/profile/inria-iata/24.4.0',
    namespace: 'http://www.iata.org/ontology#',
    publication: {
      triggerProperty: 'dcterms:conformsTo',
      triggerValue: 'https://w3id.org/dse/profile/inria-iata/24.4.0',
      openApiDocumentProperty: 'dcat:endpointDescription',
      openApiClassAnnotation: 'x-dxp-ontology-class',
      assetMetadataExample: {},
      openApiSchemaExample: {}
    },
    openApiSchema: {
      components: {
        schemas: {
          Ack: {
            title: 'Acknowledgement',
            required: ['statusCode'],
            properties: {
              statusMessageText: {
                description: 'Additional status information',
                $ref: '#/components/schemas/Text'
              }
            }
          },
          StatusCodeEntity: {
            properties: {
              statusCode: {
                description: 'Status code',
                $ref: '#/components/schemas/Code'
              }
            }
          }
        }
      }
    }
  };

  let component: OntologySelectorComponent;
  let fixture: ComponentFixture<OntologySelectorComponent>;

  beforeEach(async () => {
    modalService.open.mockClear();
    TestBed.configureTestingModule({
      imports: [OntologySelectorComponent],
      providers: [
        provideTanStackQuery(new QueryClient()),
        { provide: NgbModal, useValue: modalService }
      ]
    }).overrideComponent(OntologySelectorComponent, {
      set: {
        providers: [
          {
            provide: OntologyManagementService,
            useValue: {
              getOntologies: jest.fn().mockReturnValue(
                of([
                  {
                    id: details.id,
                    ontologyName: details.ontologyName,
                    description: details.description
                  }
                ])
              ),
              getOntology: jest.fn().mockReturnValue(of(details))
            }
          }
        ]
      }
    });
    fixture = TestBed.createComponent(OntologySelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('allows publication without ontology validation', () => {
    expect(component.isValid()).toBe(true);
    expect(component.selection()).toBeNull();
    expect(component.isDirty()).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('Loading ontology details...');
  });

  it('requires an OpenAPI URL when an ontology is selected', () => {
    component.selectOntology(details.id);

    expect(component.isValid()).toBe(false);
    expect(component.endpointDescription.touched).toBe(true);
    expect(component.isDirty()).toBe(true);
  });

  it('returns validation metadata for a valid selection', async () => {
    await loadDetails();
    component.endpointDescription.setValue('https://api.example.com/openapi.yaml');

    expect(fixture.nativeElement.textContent).toContain(details.description);
    expect(fixture.nativeElement.textContent).not.toContain('Loading ontology details...');
    expect(component.isValid()).toBe(true);
    expect(component.selection()).toEqual({
      ontologyId: details.id,
      profileIri: details.profileIri,
      endpointDescription: 'https://api.example.com/openapi.yaml'
    });
  });

  it('filters classes and highlights inherited mandatory fields', async () => {
    await loadDetails();
    component.classSearch.set('ack');
    component.selectClass('Ack');

    expect(component.filteredClassNames()).toEqual(['Ack']);
    expect(component.schemaCount()).toBe(2);
    expect(component.selectedProperties()).toEqual([
      {
        name: 'statusMessageText',
        required: false,
        description: 'Additional status information',
        type: 'Text'
      },
      {
        name: 'statusCode',
        required: true,
        description: 'Status code',
        type: 'Code'
      }
    ]);

    component.selectClass('Ack');
    expect(component.selectedClassName()).toBe('');
  });

  it('opens the schema explorer in a dedicated popup', async () => {
    await loadDetails();

    const trigger = fixture.debugElement.query(By.css('.schema-explorer-trigger'));
    expect(trigger).not.toBeNull();
    expect(fixture.debugElement.query(By.css('.class-results'))).toBeNull();

    trigger.triggerEventHandler('click');

    expect(modalService.open).toHaveBeenCalledWith(expect.anything(), {
      centered: true,
      scrollable: true,
      size: 'xl'
    });
  });

  it('clears class and endpoint state when changing ontology', () => {
    component.selectedClassName.set('Ack');
    component.classSearch.set('ack');
    component.endpointDescription.setValue('https://api.example.com/openapi.yaml');

    component.selectOntology(details.id);

    expect(component.selectedClassName()).toBe('');
    expect(component.classSearch()).toBe('');
    expect(component.endpointDescription.value).toBe('');
  });

  async function loadDetails(): Promise<void> {
    component.selectOntology(details.id);
    fixture.detectChanges();
    for (let attempt = 0; attempt < 10 && !component.ontologyQuery.isSuccess(); attempt++) {
      await new Promise((resolve) => setTimeout(resolve));
    }
    fixture.detectChanges();
    expect(component.ontologyQuery.isSuccess()).toBe(true);
  }
});
