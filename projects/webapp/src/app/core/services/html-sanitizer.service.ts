import { inject, Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class HtmlSanitizerService {
  private sanitizer = inject(DomSanitizer);

  /**
   * Sanitizes HTML and returns SafeHtml for use in [innerHTML]
   * Converts escape sequences like \n and &lt;br&gt; to actual HTML
   */
  getSafeHtml(html: string): SafeHtml {
    if (!html) return '';

    // Convert escaped newlines and HTML entities to actual HTML
    const processed = html
      // Replace literal \n with <br>
      .replace(/\\n/g, '<br>')
      // Replace literal <br> text with actual <br> tag
      .replace(/&lt;br&gt;/g, '<br>')
      .replace(/&lt;\/br&gt;/g, '')
      // Handle other escaped HTML tags
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    // Then sanitize the HTML to only allow safe tags
    const sanitized = this.sanitizeHtml(processed);
    return this.sanitizer.bypassSecurityTrustHtml(sanitized);
  }

  /**
   * Sanitizes HTML to only allow safe tags - returns string
   * Use this for form values or when you don't need SafeHtml
   */
  sanitizeHtml(html: string): string {
    if (!html) return '';
    // Create a temporary div to parse HTML
    const div = document.createElement('div');
    div.innerHTML = html;

    // Allowed tags only
    const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'br', 'ul', 'ol', 'li', 'p', 'div'];

    // Recursively clean the DOM tree
    this.cleanNode(div, allowedTags);

    return div.innerHTML;
  }

  private cleanNode(node: Node, allowedTags: string[]): void {
    const children = Array.from(node.childNodes);

    children.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        const tagName = element.tagName.toLowerCase();

        if (!allowedTags.includes(tagName)) {
          // Replace disallowed tag with its text content
          const textNode = document.createTextNode(element.textContent || '');
          node.replaceChild(textNode, element);
        } else {
          // Remove all attributes
          Array.from(element.attributes).forEach((attr) => {
            element.removeAttribute(attr.name);
          });
          // Recursively clean children
          this.cleanNode(element, allowedTags);
        }
      }
    });
  }
}
