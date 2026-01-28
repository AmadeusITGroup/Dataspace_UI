import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContractsLinkCellComponent } from './contracts-link-cell.component';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { DatasetEnriched } from '../../../models/catalog.model';
import { RowData } from '../../../../../shared/components/table/table.model';

describe('ContractsLinkCellComponent', () => {
  let component: ContractsLinkCellComponent;
  let fixture: ComponentFixture<ContractsLinkCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractsLinkCellComponent, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ContractsLinkCellComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display link when dataset is negotiated', () => {
    const mockRow: RowData<DatasetEnriched> = {
      data: {
        negotiated: true,
        shortParticipantId: 'participant1',
        id: 'dataset1'
      } as DatasetEnriched
    };

    fixture.componentRef.setInput('row', mockRow);
    fixture.detectChanges();

    const link = fixture.debugElement.query(By.css('a'));
    expect(link).toBeTruthy();
  });

  it('should not display link when dataset is not negotiated', () => {
    const mockRow: RowData<DatasetEnriched> = {
      data: {
        negotiated: false,
        shortParticipantId: 'participant1',
        id: 'dataset1'
      } as DatasetEnriched
    };

    fixture.componentRef.setInput('row', mockRow);
    fixture.detectChanges();

    const link = fixture.debugElement.query(By.css('a'));
    expect(link).toBeFalsy();
  });

  it('should generate correct router link with query params', () => {
    const mockRow: RowData<DatasetEnriched> = {
      data: {
        negotiated: true,
        shortParticipantId: 'participant1',
        id: 'dataset1'
      } as DatasetEnriched
    };

    fixture.componentRef.setInput('row', mockRow);
    fixture.detectChanges();

    const link = fixture.debugElement.query(By.css('a'));
    expect(link).toBeTruthy();
    expect(link.nativeElement.textContent).toContain('Contracts');
  });

  it('should accept value input', () => {
    fixture.componentRef.setInput('value', 'test-value');
    fixture.detectChanges();
    expect(component.value()).toBe('test-value');
  });
});
