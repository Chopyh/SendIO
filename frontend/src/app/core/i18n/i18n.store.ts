import { Injectable, computed, signal } from '@angular/core';
import { Locale, translations } from './translations';

const LANGUAGE_KEY = 'sendio.language';

@Injectable({ providedIn: 'root' })
export class I18nStore {
  private readonly localeSignal = signal<Locale>(this.detectSystemLocale());

  readonly locale = computed(() => this.localeSignal());

  initialize(): void {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (stored === 'en' || stored === 'es') {
      this.localeSignal.set(stored);
      return;
    }

    this.localeSignal.set(this.detectSystemLocale());
  }

  setLocale(locale: Locale): void {
    this.localeSignal.set(locale);
    localStorage.setItem(LANGUAGE_KEY, locale);
  }

  t(key: string): string {
    const locale = this.localeSignal();
    return translations[locale][key] ?? key;
  }

  private detectSystemLocale(): Locale {
    const browserLocale = navigator.language.toLowerCase();

    return browserLocale.startsWith('es') ? 'es' : 'en';
  }
}
