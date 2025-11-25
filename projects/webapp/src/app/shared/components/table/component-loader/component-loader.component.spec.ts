import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DynamicComponentLoaderComponent } from './component-loader.component';

@Component({
  selector: 'app-test-component',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<div class="test-component">Test Component {{hello()}} {{world()}}</div>'
})
class TestComponent {
  public hello = input<string>();
  public world = input<string>();
}

describe('DynamicComponentLoaderComponent', () => {
  let component: DynamicComponentLoaderComponent;
  let fixture: ComponentFixture<DynamicComponentLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule]
    }).compileComponents();
    fixture = TestBed.createComponent(DynamicComponentLoaderComponent);
    component = fixture.componentInstance;
    // Provide the component type as a signal
    component.component = signal(TestComponent);
    // Provide the inputs as a signal
    component.inputs = signal({ hello: 'bonjour', world: 'monde' });
    fixture.detectChanges();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the dynamic component with their inputs', () => {
    const element = fixture.debugElement.query(By.css('.test-component'));
    expect(element.nativeElement.textContent).toContain('Test Component bonjour monde');
  });
});
