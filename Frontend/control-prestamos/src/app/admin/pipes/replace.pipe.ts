import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'replace',
  standalone: true
})
export class ReplacePipe implements PipeTransform {
  transform(value: string, search: string, replacement: string): string {
    if (!value || !search || !replacement) {
      return value;
    }
    return value.split(search).join(replacement);
  }
}