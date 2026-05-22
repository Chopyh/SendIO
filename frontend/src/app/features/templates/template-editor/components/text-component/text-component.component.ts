import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { TemplateComponents } from '../../../../../core/shared/dataAccess/models/template-components';
import { DialogService } from '../../../../../core/shared/components/generic-dialog/generic-dialog.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TemplateComponentService } from '../../../../../core/shared/dataAccess/services/template-component.service';
import { DomSanitizer } from '@angular/platform-browser';
import { EditorModule } from 'primeng/editor';
import { I18nStore } from '../../../../../core/i18n/i18n.store';

@Component({
  selector: 'template-text-component',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, EditorModule],
  templateUrl: './text-component.component.html',
  styleUrl: './text-component.component.css',
})
export class TextComponentComponent implements OnInit {
  @Input() text!: TemplateComponents;
  @Input() infoMode: boolean = false;
  @Input() readonly: boolean = false;

  showContext: boolean = false;
  @ViewChild('editText') editText!: any;

  @Output() onDeleteElement: EventEmitter<void> = new EventEmitter<void>();
  @Output() onEditElement: EventEmitter<TemplateComponents> = new EventEmitter<TemplateComponents>();
  @Output() onInsertLeft: EventEmitter<void> = new EventEmitter<void>();
  @Output() onInsertRight: EventEmitter<void> = new EventEmitter<void>();
  @Output() onInsertTop: EventEmitter<void> = new EventEmitter<void>();
  @Output() onInsertBottom: EventEmitter<void> = new EventEmitter<void>();

  public textForm!: FormGroup;

  constructor(
    private dialog: DialogService,
    private template: TemplateComponentService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    public readonly i18nStore: I18nStore
  ) {}

  ngOnInit(): void {
    this.textForm = this.fb.group({
      blockName: [this.text.blockName || '', [Validators.required]],
      blockContent: [this.text.content || '', [Validators.required]],
    });
  }

  onDelete(): void {
    this.dialog.open({
      title: this.i18nStore.t('editor.components.text.deleteTitle'),
      description: this.i18nStore.t('editor.components.text.deleteDesc'),
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
              if (this.textForm.valid) {
                const text: TemplateComponents = {
                  ...this.text,
                  blockName: this.textForm.get('blockName')?.value,
                  content: this.textForm.get('blockContent')?.value,
                };
                this.template.editComponent(text);
                this.text = text;
                this.onEditElement.emit(text);
                this.dialog.close();
              }
            },
            type: 'success',
          },
        ],
      },
      title: this.i18nStore.t('editor.components.text.editTitle'),
      outsideClick: false,
      content: this.editText,
      onCloseDialog: () => this.textForm.reset(),
    });
  }

  get content() {
    return this.sanitizer.bypassSecurityTrustHtml(this.text.content || '');
  }
}
