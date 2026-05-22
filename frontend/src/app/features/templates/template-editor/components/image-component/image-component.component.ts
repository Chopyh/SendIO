import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TemplateComponents } from '../../../../../core/shared/dataAccess/models/template-components';
import { DialogService } from '../../../../../core/shared/components/generic-dialog/generic-dialog.service';
import { I18nStore } from '../../../../../core/i18n/i18n.store';

@Component({
  selector: 'template-image-component',
  imports: [CommonModule],
  templateUrl: './image-component.component.html',
  styleUrl: './image-component.component.css',
})
export class ImageComponentComponent {
  @Input() image!: TemplateComponents;
  @Input() infoMode: boolean = false;
  @Input() readonly: boolean = false;

  showContext: boolean = false;

  @Output() onDeleteElement: EventEmitter<void> = new EventEmitter<void>();
  @Output() onEditElement: EventEmitter<void> = new EventEmitter<void>();
  @Output() onInsertLeft: EventEmitter<void> = new EventEmitter<void>();
  @Output() onInsertRight: EventEmitter<void> = new EventEmitter<void>();
  @Output() onInsertTop: EventEmitter<void> = new EventEmitter<void>();
  @Output() onInsertBottom: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    private dialog: DialogService,
    public readonly i18nStore: I18nStore
  ) {}

  onDelete(): void {
    this.dialog.open({
      title: this.i18nStore.t('editor.components.image.deleteTitle'),
      description: this.i18nStore.t('editor.components.image.deleteDesc'),
      buttons: {
        position: 'right',
        buttons: [
          {
            text: this.i18nStore.t('editor.components.cancel'),
            type: 'cancel',
            click: () => {
              this.dialog.close();
            },
          },
          {
            text: this.i18nStore.t('editor.components.deleteAction'),
            type: 'danger',
            click: () => {
              this.onDeleteElement.emit();
              this.dialog.close();
            },
          },
        ],
      },
      outsideClick: true,
    });
  }
}
