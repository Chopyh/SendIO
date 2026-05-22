import {
  CommonModule,
} from '@angular/common';
import {
  Component,
  ComponentRef,
  ElementRef,
  Injector,
  OnInit,
  TemplateRef,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { DialogService } from './generic-dialog.service';

export interface DialogConfig {
  buttons: {
    position?: 'center' | 'right' | 'left' | 'justify' | 'none';
    order?: 'normal' | 'reverse';
    buttons: ButtonTypes[];
  };
  title: string;
  description?: string;
  content?: TemplateRef<any>;
  component?: Type<any>;
  onCloseDialog?: () => void;
  onOpenDialog?: () => void;
  exitButton?: boolean;
  outsideClick?: boolean;
}

export interface ButtonTypes {
  text: string;
  click: () => void;
  type: 'success' | 'cancel' | 'warning' | 'info' | 'danger';
}

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-generic-dialog',
  templateUrl: 'generic-dialog.component.html',
})
export class GenericDialogComponent implements OnInit {
  @ViewChild('dialogContainer', { static: true }) dialogContainer!: ElementRef;
  @ViewChild('componentContainer', { read: ViewContainerRef }) componentContainer!: ViewContainerRef;

  private componentRef?: ComponentRef<any>;

  config!: DialogConfig;
  content!: TemplateRef<any>;

  constructor(private dialog: DialogService) {}

  ngOnInit(): void {
    this.loadComponent();
  }

  get buttonAlignment() {
    return {
      'text-center justify-center': this.config.buttons.position === 'center',
      'text-right justify-end': this.config.buttons.position === 'right',
      'text-left justify-start': this.config.buttons.position === 'left',
      'justify-between': this.config.buttons.position === 'justify',
      hidden: this.config.buttons.position === 'none',
    };
  }

  get buttonOrder() {
    return {
      'flex flex-row': this.config.buttons.order === 'normal',
      'flex flex-row-reverse': this.config.buttons.order === 'reverse',
    };
  }

  private loadComponent(): void {
    if (this.componentContainer && this.config.component) {
      this.componentContainer.clear();
      const injector = Injector.create([]);
      this.componentRef = this.componentContainer.createComponent(this.config.component, { injector });
    }
  }

  public buttonTypeStyles(button: ButtonTypes) {
    return {
      'text-gray-50 font-bold bg-lime-500 hover:bg-green-600': button.type === 'success',
      'text-gray-700 bg-gray-200 hover:bg-gray-300': button.type === 'cancel',
      'text-white bg-yellow-500 hover:bg-yellow-500': button.type === 'warning',
      'text-white bg-blue-500 hover:bg-blue-500': button.type === 'info',
      'text-white bg-red-500 hover:bg-red-500': button.type === 'danger',
    };
  }

  closeDialog(caller: string = ''): void {
    if (caller === 'outside' && !this.config.outsideClick) {
      return;
    }

    if (this.config.onCloseDialog) {
      this.config.onCloseDialog();
    }
    this.dialog.close();
  }
}
