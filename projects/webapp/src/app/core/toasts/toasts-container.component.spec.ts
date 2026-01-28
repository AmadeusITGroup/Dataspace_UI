import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastsContainerComponent } from './toasts-container.component';
import { ToastService } from './toast-service';

describe('ToastsContainerComponent', () => {
  let component: ToastsContainerComponent;
  let fixture: ComponentFixture<ToastsContainerComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastsContainerComponent],
      providers: [ToastService]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastsContainerComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should inject ToastService', () => {
    expect(component.toastService).toBe(toastService);
  });

  it('should have access to toastService.toasts', () => {
    expect(component.toastService.toasts).toBeDefined();
  });
});
