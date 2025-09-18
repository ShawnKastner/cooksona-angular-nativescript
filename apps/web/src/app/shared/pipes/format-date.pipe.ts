import { Pipe, PipeTransform } from '@angular/core';
import { formatDate as formatDateHelper } from '../utils/helper';

@Pipe({ name: 'formatDate', standalone: true, pure: true })
export class FormatDatePipe implements PipeTransform {
  transform(
    value: Date | string | number | null | undefined,
    emptyLabel = '-'
  ): string {
    if (value === null || value === undefined || value === '')
      return emptyLabel;
    try {
      let iso: string;
      if (value instanceof Date) {
        iso = value.toISOString();
      } else if (typeof value === 'number') {
        iso = new Date(value).toISOString();
      } else {
        iso = String(value);
      }
      const out = formatDateHelper(iso);
      return out || emptyLabel;
    } catch {
      return emptyLabel;
    }
  }
}
