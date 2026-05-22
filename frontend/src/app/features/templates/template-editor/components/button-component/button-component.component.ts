import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { TemplateComponents } from '../../../../../core/shared/dataAccess/models/template-components';
import { CommonModule } from '@angular/common';
import { DialogService } from '../../../../../core/shared/components/generic-dialog/generic-dialog.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ColorPickerModule } from 'primeng/colorpicker';
import { TemplateComponentService } from '../../../../../core/shared/dataAccess/services/template-component.service';
import { I18nStore } from '../../../../../core/i18n/i18n.store';

@Component({
  selector: 'template-button-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ColorPickerModule],
  templateUrl: './button-component.component.html',
  styleUrl: './button-component.component.css',
})
export class ButtonComponentComponent implements OnInit {
  @Input() button!: TemplateComponents;
  @Input() infoMode: boolean = false;
  @Input() readonly: boolean = false;

  showContext: boolean = false;
  @ViewChild('editButton') editButton!: any;

  @Output() onDeleteElement: EventEmitter<void> = new EventEmitter<void>();
  @Output() onEditElement: EventEmitter<TemplateComponents> = new EventEmitter<TemplateComponents>();
  @Output() onInsertLeft: EventEmitter<void> = new EventEmitter<void>();
  @Output() onInsertRight: EventEmitter<void> = new EventEmitter<void>();
  @Output() onInsertTop: EventEmitter<void> = new EventEmitter<void>();
  @Output() onInsertBottom: EventEmitter<void> = new EventEmitter<void>();

  public buttonForm!: FormGroup;

  constructor(
    private dialog: DialogService,
    private fb: FormBuilder,
    private template: TemplateComponentService,
    public readonly i18nStore: I18nStore
  ) {}

  ngOnInit(): void {
    this.buttonForm = this.fb.group({
      blockName: [this.button.blockName, [Validators.required]],
      blockContent: [this.button.content || '', [Validators.required]],
      blockURL: [this.button.url || '', [Validators.required]],
      styles: this.fb.group({
        backgroundColor: [this.button.styles?.['backgroundColor'] || '#ffffff'],
        textColor: [this.button.styles?.['textColor'] || '#000000'],
        borderRadius: [parseInt(this.button.styles?.['borderRadius']?.replace('%', '') ?? '0') || 0],
      }),
    });
  }

  onDelete(): void {
    this.dialog.open({
      title: this.i18nStore.t('editor.components.button.deleteTitle'),
      description: this.i18nStore.t('editor.components.button.deleteDesc'),
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

  public openDialog(): void {
    this.dialog.open({
      buttons: {
        position: 'right',
        buttons: [
          { text: this.i18nStore.t('editor.components.cancel'), click: () => this.dialog.close(), type: 'cancel' },
          {
            text: this.i18nStore.t('editor.components.saveAction'),
            click: () => {
              if (this.buttonForm.valid) {
                const button: TemplateComponents = {
                  ...this.button,
                  blockName: this.buttonForm.value.blockName,
                  content: this.buttonForm.value.blockContent,
                  url: this.buttonForm.value.blockURL,
                  styles: {
                    backgroundColor: this.buttonForm.value.styles.backgroundColor,
                    textColor: this.buttonForm.value.styles.textColor,
                    borderRadius: this.buttonForm.value.styles.borderRadius + '%',
                  },
                };
 
                this.template.editComponent(button);
                this.button = button;
                this.onEditElement.emit(button);
                this.dialog.close();
              }
            },
            type: 'success',
          },
        ],
      },
      title: this.i18nStore.t('editor.components.button.editTitle'),
      outsideClick: false,
      content: this.editButton,
      onCloseDialog: () => this.buttonForm.reset(),
    });
  }
}
