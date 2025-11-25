import { Injectable, signal } from '@angular/core';

export interface Toast {
  content: string;
  classname?: string;
  delay?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(toast: Toast) {
    this.toasts.update((toasts) => [...toasts, toast]);
  }

  showSuccess(content: string) {
    this.show({ content, classname: 'bg-success text-light' });
  }

  showError(content: string) {
    this.show({ content, classname: 'bg-danger text-light' });
  }

  remove(toast: Toast) {
    this.toasts.update((toasts) => toasts.filter((t) => t !== toast));
  }

  clear() {
    this.toasts.set([]);
  }
}
