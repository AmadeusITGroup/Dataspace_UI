import { Signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, switchMap, tap, timer } from 'rxjs';

export const timedFeedback = (
  trigger: Signal<boolean>,
  duration: number,
  onStart: () => void,
  onTimeout: () => void
) =>
  toObservable(trigger)
    .pipe(
      switchMap((value) => {
        if (value) {
          onStart();
          return timer(duration).pipe(tap(onTimeout));
        }
        return EMPTY;
      }),
      takeUntilDestroyed()
    )
    .subscribe();
