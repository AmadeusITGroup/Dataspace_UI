import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BtnProgressComponent } from './btn-progress.component';
import { By } from '@angular/platform-browser';
import '@angular/localize/init';

describe('BtnProgressComponent', () => {
  let component: BtnProgressComponent;
  let fixture: ComponentFixture<BtnProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BtnProgressComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BtnProgressComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display default label', () => {
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.textContent.trim()).toBe('Cancel');
  });

  it('should display custom label', () => {
    fixture.componentRef.setInput('label', 'Custom Label');
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.textContent.trim()).toBe('Custom Label');
  });

  it('should have default light-danger type', () => {
    fixture.detectChanges();
    expect(component.btnClasses()).toContain('btn-outline-danger');
  });

  it('should apply primary type classes', () => {
    fixture.componentRef.setInput('type', 'primary');
    fixture.detectChanges();
    expect(component.btnClasses()).toBe('btn-outline-primary');
  });

  it('should apply secondary type classes', () => {
    fixture.componentRef.setInput('type', 'secondary');
    fixture.detectChanges();
    expect(component.btnClasses()).toBe('btn-outline-secondary');
  });

  it('should emit progressEnded when button is clicked', () => {
    let emitted = false;
    component.progressEnded.subscribe(() => {
      emitted = true;
    });

    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('button'));
    button.nativeElement.click();

    expect(emitted).toBe(true);
    expect(component.progressDone()).toBe(true);
  });

  it('should increment progress over time', fakeAsync(() => {
    fixture.componentRef.setInput('secondsTimer', 1);
    fixture.componentRef.setInput('stepsInterval', 10);
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.progress()).toBe(0);

    tick(100);
    fixture.detectChanges();

    expect(component.progress()).toBeGreaterThan(0);
    expect(component.progress()).toBeLessThan(100);
  }));

  it('should apply custom width and height', () => {
    fixture.componentRef.setInput('width', '100px');
    fixture.componentRef.setInput('height', '50px');
    fixture.detectChanges();

    const container = fixture.debugElement.query(By.css('.btn-container'));
    expect(container.nativeElement.style.width).toBe('100px');
    expect(container.nativeElement.style.height).toBe('50px');
  });
});
