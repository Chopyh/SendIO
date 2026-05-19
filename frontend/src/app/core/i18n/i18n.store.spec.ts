import { TestBed } from '@angular/core/testing';
import { I18nStore } from './i18n.store';

describe('I18nStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('uses Spanish when the system language is Spanish and no preference exists', () => {
    Object.defineProperty(navigator, 'language', {
      configurable: true,
      value: 'es-ES',
    });

    const store = TestBed.inject(I18nStore);
    store.initialize();

    expect(store.locale()).toBe('es');
    expect(store.t('auth.signIn')).toBe('Iniciar sesion');
  });

  it('keeps a stored language over the system language', () => {
    Object.defineProperty(navigator, 'language', {
      configurable: true,
      value: 'es-ES',
    });
    localStorage.setItem('sendio.language', 'en');

    const store = TestBed.inject(I18nStore);
    store.initialize();

    expect(store.locale()).toBe('en');
  });

  it('switches language and persists locale', () => {
    const store = TestBed.inject(I18nStore);
    store.setLocale('es');

    expect(store.locale()).toBe('es');
    expect(store.t('auth.signIn')).toBe('Iniciar sesion');
    expect(localStorage.getItem('sendio.language')).toBe('es');
  });
});
