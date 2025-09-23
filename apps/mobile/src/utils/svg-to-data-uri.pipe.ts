import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'svgToDataUri', standalone: true })
export class SvgToDataUriPipe implements PipeTransform {
  transform(svg: string | null | undefined, color?: string): string {
    if (!svg) return '';
    // Minify and encode to be safe in data URI
    let cleaned = svg
      .replace(/\n+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // If a color is provided, enforce it:
    if (color) {
      // 1) Ensure root <svg> defines a color so `currentColor` inherits
      cleaned = cleaned.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
        if (/style=\"[^\"]*\"/i.test(attrs)) {
          // Prepend color to existing style
          attrs = attrs.replace(
            /style=\"([^\"]*)\"/i,
            (m: string, style: string) => `style="color: ${color}; ${style}"`,
          );
        } else {
          attrs = `${attrs} style=\"color: ${color};\"`;
        }
        return `<svg${attrs}>`;
      });
      // 2) Replace explicit currentColor usages as a fallback
      cleaned = cleaned
        .replace(/stroke=\"currentColor\"/gi, `stroke="${color}"`)
        .replace(/fill=\"currentColor\"/gi, `fill="${color}"`);
    }
    const encoded = encodeURIComponent(cleaned)
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29');
    return `data:image/svg+xml;utf8,${encoded}`;
  }
}
