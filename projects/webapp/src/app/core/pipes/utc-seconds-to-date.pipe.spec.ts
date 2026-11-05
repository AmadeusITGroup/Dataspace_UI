import { DatePipe } from '@angular/common';
import { UtcSecondsToDatePipe } from './utc-seconds-to-date.pipe';

describe('UtcSecondsToDatePipe', () => {
  let pipe: UtcSecondsToDatePipe;
  let datePipe: DatePipe;

  beforeEach(() => {
    datePipe = new DatePipe('en-US');
    pipe = new UtcSecondsToDatePipe(datePipe);
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should transform UTC seconds to formatted date', () => {
    // January 1, 2024, 00:00:00 UTC
    const utcSeconds = 1704067200;
    const result = pipe.transform(utcSeconds);
    expect(result).toBe('Jan 1, 2024');
  });

  it('should return empty string for null', () => {
    const result = pipe.transform(null);
    expect(result).toBe('');
  });

  it('should return empty string for undefined', () => {
    const result = pipe.transform(undefined);
    expect(result).toBe('');
  });

  it('should return empty string for 0', () => {
    const result = pipe.transform(0);
    expect(result).toBe('');
  });

  it('should handle different dates correctly', () => {
    // December 31, 2023, 00:00:00 UTC
    const utcSeconds = 1703980800;
    const result = pipe.transform(utcSeconds);
    expect(result).toBe('Dec 31, 2023');
  });

  it('should convert seconds to milliseconds correctly', () => {
    // February 3, 2027, 00:00:00 UTC (1801656000 seconds)
    const utcSeconds = 1801656000;
    const result = pipe.transform(utcSeconds);
    expect(result).toContain('2027');
  });
});
