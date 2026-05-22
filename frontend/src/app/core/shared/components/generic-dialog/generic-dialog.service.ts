import { ApplicationRef, ComponentRef, Injectable, Injector, TemplateRef, createComponent } from '@angular/core';
import { DialogConfig, GenericDialogComponent } from './generic-dialog.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private dialogRef?: ComponentRef<GenericDialogComponent>;

  constructor(private appRef: ApplicationRef, private injector: Injector) {}

  open(config: DialogConfig, content?: TemplateRef<any>): void {
    if (this.dialogRef) return; // Prevent multiple dialogs

    this.dialogRef = createComponent(GenericDialogComponent, {
      environmentInjector: this.appRef.injector,
    });

    this.dialogRef.instance.config = config;
    if (content) {
      this.dialogRef.instance.content = content;
    }

    if (config.content) {
      this.dialogRef.instance.content = config.content;
    }

    this.appRef.attachView(this.dialogRef.hostView);
    document.body.appendChild(this.dialogRef.location.nativeElement);
  }

  close(): void {
    if (this.dialogRef) {
      this.appRef.detachView(this.dialogRef.hostView);
      this.dialogRef.destroy();
      this.dialogRef = undefined;
    }
  }
}
