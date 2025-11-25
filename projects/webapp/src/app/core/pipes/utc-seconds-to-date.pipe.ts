import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'utcSecondsToDate',
  standalone: true
})
export class UtcSecondsToDatePipe implements PipeTransform {
  constructor(private datePipe: DatePipe) {}
  transform(value: number | null | undefined): string {
    if (!value) return '';
    const date = new Date(value * 1000);
    return this.datePipe.transform(date, 'MMM d, y') || '';
  }
}
