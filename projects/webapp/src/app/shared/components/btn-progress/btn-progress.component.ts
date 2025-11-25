import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnInit,
  output,
  signal,
  ViewEncapsulation
} from '@angular/core';
import { NgbProgressbar } from '@ng-bootstrap/ng-bootstrap';
import { finalize, takeWhile, timer } from 'rxjs';
import { NgClass } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-btn-progress',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [NgbProgressbar, NgClass],
  template: `
    <button
      class="p-0 btn"
      [ngClass]="btnClasses() + ' ' + classes()"
      (click)="progressDone.set(true); progressEnded.emit()"
    >
      <div class="btn-container" [style.width]="width()" [style.height]="height()">
        <div class="btn-content">{{ label() }}</div>
        <div
          class="btn-progressbar"
          [style.width]="width()"
          [style.height]="height()"
          [style.top]="'-24px'"
        >
          <ngb-progressbar
            [value]="progress()"
            [animated]="true"
            type="light-danger"
          ></ngb-progressbar>
        </div>
      </div>
    </button>
  `,
  styleUrls: ['./btn-progress.component.scss']
})
export class BtnProgressComponent implements OnInit {
  // inputs = By default, the button will be a cancel button in light-danger style
  label = input<string>('Cancel');
  type = input<'light-danger' | 'primary' | 'secondary'>('light-danger');
  width = input('74.63px'); // width of the button
  height = input('38.25px'); // height of the button
  top = input('24px');
  secondsTimer = input(5); // seconds to wait before reverting to default footer
  stepsInterval = input(200); // number of steps to decrease the progress bar (higher value = smoother progress bar)
  classes = input<string>('');
  // outputs
  progressEnded = output<void>();

  // internal state
  public progress = signal(0);
  public progressDone = signal(false);
  public btnClasses = computed(() => {
    switch (this.type()) {
      case 'light-danger':
        return 'btn-outline-danger btn-outline-dark-danger';
      case 'primary':
        return 'btn-outline-primary';
      case 'secondary':
        return 'btn-outline-secondary';
      default:
        return '';
    }
  });

  ngOnInit() {
    timer(0, (this.secondsTimer() * 1000) / this.stepsInterval())
      .pipe(
        takeWhile(() => this.progress() < 100 && !this.progressDone()),
        finalize(() => {
          this.progressEnded.emit();
        })
      )
      .subscribe(() => {
        this.progress.set(this.progress() + 100 / this.stepsInterval());
      });
  }
}
