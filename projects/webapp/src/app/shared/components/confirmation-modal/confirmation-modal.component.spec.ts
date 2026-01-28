import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationModalComponent } from './confirmation-modal.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

describe('ConfirmationModalComponent', () => {
  let component: ConfirmationModalComponent;
  let fixture: ComponentFixture<ConfirmationModalComponent>;
  let mockActiveModal: jest.Mocked<NgbActiveModal>;

  beforeEach(async () => {
    mockActiveModal = {
      close: jest.fn(),
      dismiss: jest.fn()
    } as unknown as jest.Mocked<NgbActiveModal>;

    await TestBed.configureTestingModule({
      imports: [ConfirmationModalComponent],
      providers: [{ provide: NgbActiveModal, useValue: mockActiveModal }]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default title', () => {
    expect(component.title()).toBe('Confirm Action');
  });

  it('should have default message', () => {
    expect(component.message()).toBe('Are you sure you want to proceed?');
  });

  it('should have default confirm button text', () => {
    expect(component.confirmButtonText()).toBe('Confirm');
  });

  it('should have default cancel button text', () => {
    expect(component.cancelButtonText()).toBe('Cancel');
  });

  it('should have default positive skin', () => {
    expect(component.skin()).toBe('positive');
  });

  it('should have requireReason disabled by default', () => {
    expect(component.requireReason()).toBe(false);
  });

  it('should emit confirm event and close modal without reason', () => {
    let emitted = false;
    component.confirm.subscribe(() => {
      emitted = true;
    });

    component.onConfirm();

    expect(emitted).toBe(true);
    expect(mockActiveModal.close).toHaveBeenCalledWith(true);
  });

  it('should emit confirm event with reason when requireReason is true', () => {
    component.requireReason.set(true);
    component.reason.set('Test reason');

    let emittedReason: string | void = '';
    component.confirm.subscribe((reason) => {
      emittedReason = reason;
    });

    component.onConfirm();

    expect(emittedReason).toBe('Test reason');
    expect(mockActiveModal.close).toHaveBeenCalledWith('Test reason');
  });

  it('should close modal with false on cancel', () => {
    component.onCancel();
    expect(mockActiveModal.close).toHaveBeenCalledWith(false);
  });

  it('should allow setting custom title', () => {
    component.title.set('Custom Title');
    expect(component.title()).toBe('Custom Title');
  });

  it('should allow setting custom message', () => {
    component.message.set('Custom message');
    expect(component.message()).toBe('Custom message');
  });

  it('should allow setting danger skin', () => {
    component.skin.set('danger');
    expect(component.skin()).toBe('danger');
  });
});
