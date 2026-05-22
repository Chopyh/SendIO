import { Component, Input } from '@angular/core';
import { TemplateComponents } from '../../dataAccess/models/template-components';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'shared-element-dragging-view',
  imports: [CommonModule],
  templateUrl: './element-dragging-view.component.html',
  styleUrl: './element-dragging-view.component.css',
})
export class ElementDraggingViewComponent {
  @Input() data!: TemplateComponents;
}
