import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast-service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty toasts array', () => {
    expect(service.toasts()).toEqual([]);
  });

  it('should add a toast when show is called', () => {
    const toast = { content: 'Test message' };
    service.show(toast);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0]).toEqual(toast);
  });

  it('should add a success toast with correct styling', () => {
    service.showSuccess('Success message');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].content).toBe('Success message');
    expect(service.toasts()[0].classname).toBe('bg-success text-light');
  });

  it('should add an error toast with correct styling', () => {
    service.showError('Error message');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].content).toBe('Error message');
    expect(service.toasts()[0].classname).toBe('bg-danger text-light');
  });

  it('should add multiple toasts', () => {
    service.show({ content: 'First' });
    service.show({ content: 'Second' });
    service.show({ content: 'Third' });
    expect(service.toasts().length).toBe(3);
  });

  it('should remove a specific toast', () => {
    const toast1 = { content: 'Toast 1' };
    const toast2 = { content: 'Toast 2' };
    const toast3 = { content: 'Toast 3' };

    service.show(toast1);
    service.show(toast2);
    service.show(toast3);

    service.remove(toast2);

    expect(service.toasts().length).toBe(2);
    expect(service.toasts()).toContain(toast1);
    expect(service.toasts()).toContain(toast3);
    expect(service.toasts()).not.toContain(toast2);
  });

  it('should clear all toasts', () => {
    service.show({ content: 'Toast 1' });
    service.show({ content: 'Toast 2' });
    service.show({ content: 'Toast 3' });

    expect(service.toasts().length).toBe(3);

    service.clear();

    expect(service.toasts().length).toBe(0);
    expect(service.toasts()).toEqual([]);
  });

  it('should handle toast with custom classname and delay', () => {
    const toast = {
      content: 'Custom toast',
      classname: 'custom-class',
      delay: 5000
    };

    service.show(toast);

    expect(service.toasts()[0]).toEqual(toast);
  });
});
