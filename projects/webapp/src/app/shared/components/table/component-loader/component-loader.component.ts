import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  input,
  ViewChild,
  ViewContainerRef
} from '@angular/core';

@Component({
  selector: 'app-component-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <ng-template #container></ng-template> `
})
export class DynamicComponentLoaderComponent implements AfterViewInit {
  @ViewChild('container', { read: ViewContainerRef, static: true })
  public container!: ViewContainerRef;
  public component = input.required<unknown>();
  public inputs = input.required<Record<string, unknown>>();

  public ngAfterViewInit(): void {
    this.container.clear();

    // @ts-expect-error this.component can be any component type
    const ref = this.container.createComponent(this.component());
    Object.keys(this.inputs()).forEach((key) => {
      ref.setInput(key, this.inputs()[key]);
    });
  }
}
