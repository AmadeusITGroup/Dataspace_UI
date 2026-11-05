import { TestBed } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationModalService } from './confirmation-modal.service';
import { ConfirmationModalComponent } from './confirmation-modal.component';

describe('ConfirmationModalService', () => {
  let service: ConfirmationModalService;
  let mockModalService: Partial<NgbModal>;
  let mockModalRef: Partial<NgbModalRef>;

  beforeEach(() => {
    const mockComponentInstance = {
      title: { set: jest.fn() },
      message: { set: jest.fn() },
      confirmButtonText: { set: jest.fn() },
      cancelButtonText: { set: jest.fn() },
      skin: { set: jest.fn() },
      requireReason: { set: jest.fn() }
    };

    mockModalRef = {
      componentInstance: mockComponentInstance,
      result: Promise.resolve(true)
    };

    mockModalService = {
      open: jest.fn().mockReturnValue(mockModalRef)
    };

    TestBed.configureTestingModule({
      providers: [ConfirmationModalService, { provide: NgbModal, useValue: mockModalService }]
    });

    service = TestBed.inject(ConfirmationModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should open confirmation modal with correct parameters', () => {
    service.showConfirmationModal('Test Title', 'Test Message', 'OK', 'Cancel', 'positive');

    expect(mockModalService.open).toHaveBeenCalledWith(ConfirmationModalComponent);
    expect(mockModalRef.componentInstance.title.set).toHaveBeenCalledWith('Test Title');
    expect(mockModalRef.componentInstance.message.set).toHaveBeenCalledWith('Test Message');
    expect(mockModalRef.componentInstance.confirmButtonText.set).toHaveBeenCalledWith('OK');
    expect(mockModalRef.componentInstance.cancelButtonText.set).toHaveBeenCalledWith('Cancel');
    expect(mockModalRef.componentInstance.skin.set).toHaveBeenCalledWith('positive');
  });

  it('should open confirmation modal with danger skin', () => {
    service.showConfirmationModal('Delete', 'Are you sure?', 'Delete', 'Cancel', 'danger');

    expect(mockModalRef.componentInstance.skin.set).toHaveBeenCalledWith('danger');
  });

  it('should open default confirmation modal', () => {
    service.showDefaultConfirmationModal('Default Title', 'Default Message');

    expect(mockModalService.open).toHaveBeenCalled();
    expect(mockModalRef.componentInstance.confirmButtonText.set).toHaveBeenCalledWith('Confirm');
    expect(mockModalRef.componentInstance.cancelButtonText.set).toHaveBeenCalledWith('Cancel');
    expect(mockModalRef.componentInstance.skin.set).toHaveBeenCalledWith('positive');
  });

  it('should open delete confirmation modal', () => {
    service.showDeleteConfirmationModal('Delete Item', 'Are you sure you want to delete?');

    expect(mockModalService.open).toHaveBeenCalled();
    expect(mockModalRef.componentInstance.confirmButtonText.set).toHaveBeenCalledWith('Delete');
    expect(mockModalRef.componentInstance.cancelButtonText.set).toHaveBeenCalledWith('Cancel');
    expect(mockModalRef.componentInstance.skin.set).toHaveBeenCalledWith('danger');
  });

  it('should open confirmation modal with reason', () => {
    service.showConfirmationModalWithReason('Action Required', 'Please provide a reason');

    expect(mockModalService.open).toHaveBeenCalled();
    expect(mockModalRef.componentInstance.requireReason.set).toHaveBeenCalledWith(true);
    expect(mockModalRef.componentInstance.skin.set).toHaveBeenCalledWith('danger');
  });

  it('should return modal result promise', async () => {
    const result = service.showConfirmationModal('Title', 'Message', 'OK', 'Cancel');

    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBe(true);
  });
});
