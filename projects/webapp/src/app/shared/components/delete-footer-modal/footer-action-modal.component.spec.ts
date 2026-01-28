import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterActionModalComponent } from './footer-action-modal.component';
import { FooterAction } from '../../../core/models/ui-action';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

describe('FooterActionModalComponent', () => {
  let component: FooterActionModalComponent;
  let fixture: ComponentFixture<FooterActionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterActionModalComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(FooterActionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display default content when no footer action is set', () => {
    expect(component.footerAction()).toBeUndefined();
  });

  it('should display delete confirmation message for DELETE action', () => {
    component.footerAction.set(FooterAction.DELETE);
    fixture.detectChanges();
    expect(component.labelMessage()).toBe('Are you sure you want to delete this resource?');
    expect(component.labelAction()).toBe('Delete');
  });

  it('should display revoke confirmation message for REVOKE action', () => {
    component.footerAction.set(FooterAction.REVOKE);
    fixture.detectChanges();
    expect(component.labelMessage()).toBe('Are you sure you want to revoke this resource?');
    expect(component.labelAction()).toBe('Revoke');
  });

  it('should display resume confirmation message for RESUME action', () => {
    component.footerAction.set(FooterAction.RESUME);
    fixture.detectChanges();
    expect(component.labelMessage()).toBe('Are you sure you want to resume this resource?');
    expect(component.labelAction()).toBe('Resume');
  });

  it('should display terminate action label for TERMINATE action', () => {
    component.footerAction.set(FooterAction.TERMINATE);
    fixture.detectChanges();
    expect(component.labelAction()).toBe('Terminate');
  });

  it('should show reason input for TERMINATE action', () => {
    component.footerAction.set(FooterAction.TERMINATE);
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css('input#reason'));
    expect(input).toBeTruthy();
  });

  it('should not show reason input for DELETE action', () => {
    component.footerAction.set(FooterAction.DELETE);
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css('input#reason'));
    expect(input).toBeFalsy();
  });

  it('should emit actionClicked with action and reason', () => {
    let emittedData: { action: FooterAction; reason: string } | undefined;
    component.actionClicked.subscribe((data) => {
      emittedData = data;
    });

    component.footerAction.set(FooterAction.TERMINATE);
    component.reason = 'Test reason';
    component.emitAction();

    expect(emittedData).toEqual({ action: FooterAction.TERMINATE, reason: 'Test reason' });
  });

  it('should reset display when resetDisplay is called', () => {
    component.footerAction.set(FooterAction.DELETE);
    component.reason = 'Some reason';

    component.resetDisplay();

    expect(component.footerAction()).toBeNull();
    expect(component.reason).toBe('');
  });

  it('should reset display when cancel button is clicked', () => {
    component.footerAction.set(FooterAction.DELETE);
    fixture.detectChanges();

    const cancelButton = fixture.debugElement.query(By.css('.btn-outline-danger'));
    cancelButton.nativeElement.click();

    expect(component.footerAction()).toBeNull();
  });

  it('should enable animation after first footerAction is set', () => {
    expect(component.canAnimateNgContent()).toBe(false);

    component.footerAction.set(FooterAction.DELETE);
    fixture.detectChanges();

    expect(component.canAnimateNgContent()).toBe(true);
  });
});
