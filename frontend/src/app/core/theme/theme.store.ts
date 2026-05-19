import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'sendio.theme';

@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly document = inject(DOCUMENT);
  private readonly themeSignal = signal<ThemeMode>('light');

  readonly theme = computed(() => this.themeSignal());
  readonly isDark = computed(() => this.themeSignal() === 'dark');

  initialize(): void {
    const stored = localStorage.getItem(THEME_KEY);
    const theme: ThemeMode = stored === 'dark' ? 'dark' : 'light';
    this.themeSignal.set(theme);
    this.applyTheme(theme);
  }

  toggle(): void {
    const next: ThemeMode = this.themeSignal() === 'dark' ? 'light' : 'dark';
    this.themeSignal.set(next);
    localStorage.setItem(THEME_KEY, next);
    this.applyTheme(next);
  }

  private applyTheme(theme: ThemeMode): void {
    const root = this.document.documentElement;
    const body = this.document.body;

    if (theme === 'dark') {
      root.classList.add('sendio-dark');
      root.classList.add('dark');
      body.classList.add('sendio-dark');
      body.classList.add('dark');
      return;
    }

    root.classList.remove('sendio-dark');
    root.classList.remove('dark');
    body.classList.remove('sendio-dark');
    body.classList.remove('dark');
  }
}
