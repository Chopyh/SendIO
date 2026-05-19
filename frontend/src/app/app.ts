import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { I18nStore } from './core/i18n/i18n.store';
import { ThemeStore } from './core/theme/theme.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly themeStore = inject(ThemeStore);
  private readonly i18nStore = inject(I18nStore);

  constructor() {
    this.themeStore.initialize();
    this.i18nStore.initialize();
  }
}
