import { CdkDrag, CdkDragDrop, CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TemplateComponentService } from '../../../core/shared/dataAccess/services/template-component.service';
import { EmailTemplate, Section, TemplateComponents } from '../../../core/shared/dataAccess/models/template-components';
import { HighlightModule, HIGHLIGHT_OPTIONS, HighlightJSOptions } from 'ngx-highlightjs';
import { HighlightLineNumbers } from 'ngx-highlightjs/line-numbers';
import { TextComponentComponent } from './components/text-component/text-component.component';
import { ImageComponentComponent } from './components/image-component/image-component.component';
import { ButtonComponentComponent } from './components/button-component/button-component.component';
import { DialogService } from '../../../core/shared/components/generic-dialog/generic-dialog.service';
import { DragDropService } from '../../../core/shared/dataAccess/services/drag-drop.service';
import { ElementDraggingViewComponent } from '../../../core/shared/components/element-dragging-view/element-dragging-view.component';
import { filter, take, tap } from 'rxjs';
import beautify from 'js-beautify';
import { I18nStore } from '../../../core/i18n/i18n.store';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EditorModule } from 'primeng/editor';

@Component({
  selector: 'app-template-editor-page',
  templateUrl: './template-editor-page.component.html',
  styleUrls: ['./template-editor-page.component.css'],
  imports: [
    DragDropModule,
    CommonModule,
    HighlightModule,
    HighlightLineNumbers,
    TextComponentComponent,
    ImageComponentComponent,
    ButtonComponentComponent,
    ElementDraggingViewComponent,
    FormsModule,
    ReactiveFormsModule,
    EditorModule,
  ],
  providers: [
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: <HighlightJSOptions>{
        lineNumbersOptions: {
          startFrom: 1,
          singleLine: true,
        },
      },
    },
  ],
})
export class TemplateEditorPageComponent implements OnInit {
  /* SIDEBAR & DIALOGS */
  sidebarSectionIds: Map<string, string> = new Map<string, string>();
  expandedSections: Map<string, boolean> = new Map<string, boolean>();

  /* VARIABLES */
  variablesExpanded: boolean = false;
  copiedVariable: string | null = null;
  readonly contactVariables = [
    '{{contact.first_name}}',
    '{{contact.last_name}}',
    '{{contact.email}}',
    '{{contact.phone}}',
  ];
  readonly workspaceVariables = ['{{workspace.name}}'];
  readonly systemVariables = ['{{unsubscribe_url}}', '{{system.unsubscribe_url}}'];

  public textForm!: FormGroup;
  public imageForm!: FormGroup;
  public buttonForm!: FormGroup;
  public separatorForm!: FormGroup;
  public sectionForm!: FormGroup;

  @ViewChild('createSection') createSectionRef!: any;
  @ViewChild('createText') createTextRef!: any;
  @ViewChild('createImage') createImageRef!: any;
  @ViewChild('createButton') createButtonRef!: any;
  @ViewChild('createSeparator') createSeparatorRef!: any;

  /* LAYOUT */
  sectionGrids: {
    sectionName: string;
    grid: {
      id: string;
      width?: string;
      content: TemplateComponents[];
    }[][];
    styles: { [key: string]: string };
  }[] = [];

  allDropLists: string[] = [];
  isDragging: boolean = false;

  /* VIEWS */
  isDesignView: boolean = true;
  isCodeView: boolean = false;
  isPreviewView: boolean = false;

  /* CODE */
  @ViewChild('content') content!: any;
  private _code: string = '';

  /* DATA */
  template?: EmailTemplate;

  get currentVersionNumber(): number {
    return this.template?.versions?.[0]?.version_number ?? 1;
  }

  get currentVersionState(): 'draft' | 'published' {
    return this.template?.versions?.[0]?.state ?? 'draft';
  }

  get isPublished(): boolean {
    return this.currentVersionState === 'published';
  }

  /* RESIZE */
  private resizing = false;
  private currentSection: string = '';
  private currentRowIndex: number = -1;
  private currentColIndex: number = -1;
  private startX: number = 0;

  constructor(
    private templateService: TemplateComponentService,
    private dialog: DialogService,
    private dragDropService: DragDropService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public readonly i18nStore: I18nStore,
    private fb: FormBuilder
  ) {
    this.initializeForms();
  }

  private initializeForms(): void {
    this.sectionForm = this.fb.group({
      sectionName: ['', [Validators.required]],
      backgroundColor: [''],
      backgroundImage: [''],
    });

    this.textForm = this.fb.group({
      blockName: ['', [Validators.required]],
      blockContent: ['', [Validators.required]],
      section: ['', [Validators.required]],
    });

    this.imageForm = this.fb.group({
      blockName: ['', [Validators.required]],
      blockContent: ['', [Validators.required]],
      section: ['', [Validators.required]],
    });

    this.buttonForm = this.fb.group({
      blockName: ['', [Validators.required]],
      blockContent: ['', [Validators.required]],
      blockURL: ['', [Validators.required]],
      section: ['', [Validators.required]],
      styles: this.fb.group({
        backgroundColor: ['#10b981'],
        textColor: ['#ffffff'],
        borderRadius: [4],
      }),
    });

    this.separatorForm = this.fb.group({
      blockName: ['', [Validators.required]],
      blockContent: ['-'],
      section: ['', [Validators.required]],
      height: [2, [Validators.required]],
    });
  }

  goBack(): void {
    this.router.navigate(['/app/templates']);
  }

  saveDraft(): void {
    if (!this.template || this.isPublished) return;
    this.templateService.saveTemplate(this.template.id, this.getSerializableSections()).subscribe({
      next: () => {
        this.dialog.open({
          title: this.i18nStore.t('editor.alert.saveSuccess.title'),
          description: this.i18nStore.t('editor.alert.saveSuccess.desc'),
          buttons: {
            buttons: [
              {
                text: this.i18nStore.t('editor.alert.ok'),
                click: () => this.dialog.close(),
                type: 'success',
              },
            ],
            position: 'right',
          },
          outsideClick: true,
        });
      },
      error: (err) => {
        this.dialog.open({
          title: this.i18nStore.t('editor.alert.saveError.title'),
          description: err.error?.error?.message || this.i18nStore.t('editor.alert.saveError.desc'),
          buttons: {
            buttons: [
              {
                text: this.i18nStore.t('editor.alert.close'),
                click: () => this.dialog.close(),
                type: 'danger',
              },
            ],
            position: 'right',
          },
          outsideClick: true,
        });
      }
    });
  }

  private getSerializableSections(): Section[] {
    if (!this.template) return [];

    return this.template.sections.map((templateSection) => {
      const sectionGrid = this.sectionGrids.find(
        (gridSection) => gridSection.sectionName === templateSection.sectionName
      );

      if (!sectionGrid) {
        return {
          ...templateSection,
          components: templateSection.components.filter(
            (component) => Number.isFinite(component.posX) && Number.isFinite(component.posY)
          ),
        };
      }

      const components = sectionGrid.grid.flatMap((row, rowIndex) => {
        return row.flatMap((cell, colIndex) => {
          return cell.content.map((component) => ({
            ...component,
            posX: colIndex,
            posY: rowIndex,
            sizeX: component.sizeX ?? 1,
            sectionName: templateSection.sectionName,
          }));
        });
      });

      return {
        ...templateSection,
        styles: sectionGrid.styles ?? templateSection.styles,
        components,
      };
    });
  }

  publish(): void {
    if (!this.template || this.isPublished) return;
    this.templateService.publishTemplate(this.template.id, this.currentVersionNumber).subscribe({
      next: () => {
        this.dialog.open({
          title: this.i18nStore.t('editor.alert.publishSuccess.title'),
          description: this.i18nStore.t('editor.alert.publishSuccess.desc').replace('{version}', this.currentVersionNumber.toString()),
          buttons: {
            buttons: [
              {
                text: this.i18nStore.t('editor.alert.ok'),
                click: () => this.dialog.close(),
                type: 'success',
              },
            ],
            position: 'right',
          },
          outsideClick: true,
        });
      },
      error: (err) => {
        const errCode = err.error?.error?.code;
        let title = this.i18nStore.t('editor.alert.publishError.title');
        let desc = err.error?.error?.message || this.i18nStore.t('editor.alert.publishError.desc');

        if (errCode === 'template.missing_unsubscribe') {
          title = this.i18nStore.t('editor.alert.complianceError.title');
          desc = this.i18nStore.t('editor.alert.complianceError.desc');
        } else if (errCode === 'template.invalid_placeholders') {
          const invalidVars = err.error?.error?.details?.invalid_placeholders || [];
          title = this.i18nStore.t('editor.alert.invalidVars.title');
          desc = this.i18nStore.t('editor.alert.invalidVars.desc').replace('{vars}', invalidVars.join(', '));
        }

        this.dialog.open({
          title,
          description: desc,
          buttons: {
            buttons: [
              {
                text: this.i18nStore.t('editor.alert.close'),
                click: () => this.dialog.close(),
                type: 'danger',
              },
            ],
            position: 'right',
          },
          outsideClick: true,
        });
      }
    });
  }

  createNewDraft(): void {
    if (!this.template) return;
    this.templateService.createDraftVersion(this.template.id).subscribe({
      next: (res) => {
        this.dialog.open({
          title: this.i18nStore.t('editor.alert.createDraftSuccess.title'),
          description: this.i18nStore.t('editor.alert.createDraftSuccess.desc').replace('{version}', res.data.version_number.toString()),
          buttons: {
            buttons: [
              {
                text: this.i18nStore.t('editor.alert.ok'),
                click: () => this.dialog.close(),
                type: 'success',
              },
            ],
            position: 'right',
          },
          outsideClick: true,
        });
      },
      error: (err) => {
        this.dialog.open({
          title: this.i18nStore.t('editor.alert.createDraftError.title'),
          description: err.error?.error?.message || this.i18nStore.t('editor.alert.createDraftError.desc'),
          buttons: {
            buttons: [
              {
                text: this.i18nStore.t('editor.alert.close'),
                click: () => this.dialog.close(),
                type: 'danger',
              },
            ],
            position: 'right',
          },
          outsideClick: true,
        });
      }
    });
  }

  ngOnInit(): void {
    // Load template from route param
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.templateService.loadTemplate(id);

    this.dragDropService.$idList.subscribe((list) => {
      this.allDropLists = list.map((item) => item.id);
      this.cdr.markForCheck();
    });

    // Always listen and update template
    this.templateService.templateComponents$.subscribe((template) => {
      this.template = template;
      if (template && template.id !== '') {
        // Register sidebar drop list IDs for any new sections
        template.sections.forEach(sec => {
          if (!this.sidebarSectionIds.has(sec.sectionName)) {
            const id = this.dragDropService.genUUID();
            this.sidebarSectionIds.set(sec.sectionName, id);
            this.dragDropService.registerID(id, 'none');
          }
        });
        
        // Clean up sidebar drop list IDs for deleted sections
        for (const secName of Array.from(this.sidebarSectionIds.keys())) {
          if (!template.sections.some(s => s.sectionName === secName)) {
            const id = this.sidebarSectionIds.get(secName);
            if (id) {
              this.dragDropService.unregisterID(id);
            }
            this.sidebarSectionIds.delete(secName);
          }
        }

        this.updateSectionGridsOrder();
        this.checkSectionGrids();
      }
      this.cdr.markForCheck();
    });

    this.dragDropService.$isDragging.subscribe((isDragging) => {
      this.isDragging = isDragging;
      this.cdr.markForCheck();
    });
  }

  private updateSectionGridsOrder(): void {
    if (!this.template) return;
    const updatedOrder = this.template.sections.map((section) => section.sectionName);
    this.sectionGrids.sort((a, b) => {
      return updatedOrder.indexOf(a.sectionName) - updatedOrder.indexOf(b.sectionName);
    });
  }

  private checkSectionGrids(): void {
    if (!this.template) return;
    if (this.sectionGrids.length > this.template.sections.length) {
      this.sectionGrids = this.sectionGrids.filter((section) => {
        return this.template!.sections.some(
          (templateSection) => templateSection.sectionName === section.sectionName
        );
      });
    }

    this.template.sections.forEach((element) => {
      let section = this.sectionGrids.find(
        (s) => s.sectionName === element.sectionName
      );
      if (!section) {
        section = {
          sectionName: element.sectionName,
          grid: this.createInitialGrid(element.sectionName),
          styles: element.styles ?? {},
        };
        this.sectionGrids.push(section);
      } else {
        section.styles = element.styles ?? {};
        // Clear existing content in grid cells first to prevent duplicates or ghost components
        section.grid.forEach((row) => {
          row.forEach((cell) => {
            cell.content = [];
          });
        });
      }

      element.components.forEach((component) => {
        if (component.posX !== undefined && component.posY !== undefined) {
          this.placeComponentInSectionGrid(component, element.sectionName);
        }
      });
    });

    this.sectionGrids = [...this.sectionGrids];
    this.cdr.markForCheck();
  }

  private createInitialGrid(
    section: string,
    rows: number = 3,
    cols: number = 3
  ): { id: string; content: TemplateComponents[]; width?: string }[][] {
    const grid = [];
    for (let row = 0; row < rows; row++) {
      const newRow = [];
      for (let col = 0; col < cols; col++) {
        const cellId = this.dragDropService.genUUID();
        newRow.push({ id: cellId, content: [], width: '1fr' });
        this.dragDropService.registerID(cellId, section);
      }
      grid.push(newRow);
    }
    return grid;
  }

  public addRowToSection(sectionName: string): void {
    const section = this.sectionGrids.find((s) => s.sectionName === sectionName);
    if (section) {
      const newRow = [];
      for (let col = 0; col < (section.grid[0]?.length || 3); col++) {
        const cellId = this.dragDropService.genUUID();
        newRow.push({ id: cellId, content: [], width: '1fr' });
        this.dragDropService.registerID(cellId, sectionName);
      }
      section.grid.push(newRow);

      section.grid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          cell.content.forEach((component) => {
            component.posX = colIndex;
            component.posY = rowIndex;
            this.templateService.updateComponentPosition(component, sectionName, colIndex, rowIndex, false);
          });
        });
      });
    }
  }

  public addColumnToSection(sectionName: string): void {
    const section = this.sectionGrids.find((s) => s.sectionName === sectionName);
    if (section) {
      section.grid.forEach((row) => {
        const cellId = this.dragDropService.genUUID();
        row.push({ id: cellId, content: [], width: '1fr' });
        this.dragDropService.registerID(cellId, sectionName);

        const totalColumns = row.length;
        const newWidth = 100 / totalColumns;
        row.forEach((cell) => {
          cell.width = `${newWidth}%`;
        });
      });

      section.grid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          cell.content.forEach((component) => {
            component.posX = colIndex;
            component.posY = rowIndex;
            this.templateService.updateComponentPosition(component, sectionName, colIndex, rowIndex, false);
          });
        });
      });
    }
  }

  placeComponentInSectionGrid(component: TemplateComponents, sectionName: string): void {
    const section = this.sectionGrids.find((s) => s.sectionName === sectionName);
    if (!section) {
      console.error(`Section "${sectionName}" not found.`);
      return;
    }

    if (component.posX === undefined || component.posY === undefined) {
      console.error(
        `Component "${component.blockId}" does not have valid position. PosX: ${component.posX}, PosY: ${component.posY}`
      );
      return;
    }

    while (section.grid.length <= component.posY) {
      this.addRowToSection(sectionName);
    }

    while (section.grid[component.posY].length <= component.posX) {
      this.addColumnToSection(sectionName);
    }

    section.grid[component.posY][component.posX].content = [
      {
        ...component,
        posX: component.posX,
        posY: component.posY,
      } as TemplateComponents,
    ];
  }

  public dragStarted(): void {
    this.dragDropService.startDragging();
  }

  public dragEnded(): void {
    this.dragDropService.finishDragging();
  }

  drop(
    event: CdkDragDrop<TemplateComponents[]>,
    sectionName: string,
    rowIndex?: number,
    colIndex?: number
  ): void {
    const section = this.sectionGrids.find((s) => s.sectionName === sectionName);
    if (!section) {
      console.error(`Section "${sectionName}" not found.`);
      return;
    }

    const previousContainer = event.previousContainer;
    const previousIndex = event.previousIndex;
    const movedComponent = previousContainer.data[previousIndex];

    if (!movedComponent) {
      return;
    }

    const previousSection = this.dragDropService.getSection(event.previousContainer.id);

    if (previousSection && previousSection !== sectionName && previousSection !== 'none') {
      this.templateService.moveComponentToSection(
        movedComponent,
        previousSection,
        sectionName,
        colIndex ?? 0,
        rowIndex ?? section.grid.length - 1
      );
    } else {
      if (rowIndex === undefined || colIndex === undefined) {
        outerLoop: for (let r = 0; r < section.grid.length; r++) {
          for (let c = 0; c < section.grid[r].length; c++) {
            if (!section.grid[r][c].content.length) {
              rowIndex = r;
              colIndex = c;
              break outerLoop;
            }
          }
        }
      }
    }

    const resolvedPosition = this.resolveDropPosition(section.grid, rowIndex, colIndex);

    if (resolvedPosition) {
      const targetCell = section.grid[resolvedPosition.rowIndex][resolvedPosition.colIndex];

      if (targetCell.content.length > 0) {
        return;
      }

      targetCell.content = [
        {
          ...movedComponent,
          posX: resolvedPosition.colIndex,
          posY: resolvedPosition.rowIndex,
        },
      ];

      this.templateService.updateComponentPosition(
        movedComponent,
        sectionName,
        resolvedPosition.colIndex,
        resolvedPosition.rowIndex
      );
    }

    if (previousContainer !== event.container && previousSection !== 'none') {
      previousContainer.data.splice(previousIndex, 1);
    }

    section.grid = section.grid.filter((row) => {
      const hasContent = row.some((cell) => cell.content.length > 0);
      if (!hasContent) {
        row.forEach((cell) => this.dragDropService.unregisterID(cell.id));
      }
      return hasContent;
    });
  }

  private resolveDropPosition(
    grid: { id: string; content: TemplateComponents[]; width?: string }[][],
    rowIndex?: number,
    colIndex?: number
  ): { rowIndex: number; colIndex: number } | null {
    if (rowIndex !== undefined && colIndex !== undefined) {
      return { rowIndex, colIndex };
    }

    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c].content.length === 0) {
          return { rowIndex: r, colIndex: c };
        }
      }
    }

    return null;
  }

  dragLimit(drag?: CdkDrag, drop?: CdkDropList): boolean {
    if (drop?.data.length == 1) {
      return false;
    }
    return true;
  }

  get code(): string {
    return this._code;
  }

  set code(value: string) {
    this._code = value;
  }

  toggleView(view: 'design' | 'code'): void {
    switch (view) {
      case 'design':
        this.isDesignView = true;
        this.isPreviewView = false;
        this.isCodeView = false;
        break;
      case 'code':
        this.isCodeView = true;
        this.isDesignView = false;
        this.isPreviewView = false;

        const rawHtml = this.getInnerHtml();
        this.code = beautify.html(rawHtml, {
          indent_size: 2,
        });
        break;
    }
  }

  copyToClipboard(): void {
    navigator.clipboard.writeText(this.code);

    this.dialog.open({
      title: this.i18nStore.t('editor.alert.copySuccess.title'),
      description: this.i18nStore.t('editor.alert.copySuccess.desc'),
      buttons: {
        buttons: [
          {
            text: this.i18nStore.t('editor.alert.close'),
            click: () => {
              this.dialog.close();
            },
            type: 'success',
          },
        ],
        position: 'right',
      },
      outsideClick: true,
    });
  }

  getInnerHtml(): string {
    let html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Email</title><style>body {margin: 0;padding: 0;background-color: #ffffff;font-family: Arial, sans-serif;}table {border-collapse: collapse;}img {max-width: 100%;height: auto;display: block;}a {color: inherit;}</style></head><body><table cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; border-collapse:collapse;">`;

    for (const section of this.sectionGrids) {
      html += `<tr><td colspan="100%" style="padding:10px 0;">`;

      const grid = section.grid;
      const rows = grid.length;
      const cols = grid[0]?.length ?? 0;

      html += `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; border-collapse:collapse;">`;

      for (let y = 0; y < rows; y++) {
        html += `<tr>`;
        for (let x = 0; x < cols; x++) {
          const cell = grid[y][x];

          if (cell && cell.content.length > 0) {
            let cellContent = '';
            for (const component of cell.content) {
              const inlineStyles =
                component.type === 'text' ? '' : this.stylesToString(component.styles);

              switch (component.type) {
                case 'text':
                  cellContent += `${component.content ?? ''}`;
                  break;
                case 'image':
                  cellContent += `<img src="${component.url}" alt="${component.content ?? ''}" style="display:block; width:100%; ${inlineStyles}"/>`;
                  break;
                case 'button':
                  cellContent += `<a href="${component.url}" style="display:inline-block; text-decoration:none; ${inlineStyles}">${component.content}</a>`;
                  break;
                case 'separator':
                  cellContent += `<hr style="${inlineStyles}" />`;
                  break;
              }
            }
            html += `<td style="vertical-align:top;">${cellContent}</td>`;
          } else {
            html += `<td style="vertical-align:top;"></td>`;
          }
        }
        html += `</tr>`;
      }

      html += `</table></td></tr>`;
    }

    html += `</table></body></html>`;
    return html;
  }

  private stylesToString(styles?: { [key: string]: string }): string {
    if (!styles) return '';
    return Object.entries(styles)
      .map(([key, value]) => `${key}:${value};`)
      .join(' ');
  }

  public deleteElement(
    component: TemplateComponents,
    sectionName: string,
    rowIndex: number,
    colIndex: number
  ): void {
    const section = this.sectionGrids.find((s) => s.sectionName === sectionName);
    if (!section) return;

    const cell = section.grid[rowIndex]?.[colIndex];
    if (cell) {
      cell.content = [];
      this.templateService.removeUsedComponent(component, sectionName);
    }
  }

  /* SIDEBAR METHODS */
  editingSection?: Section;
  currentComponentType: 'text' | 'image' | 'button' | 'separator' = 'text';

  toggleSection(sectionName: string): void {
    const isExpanded = this.expandedSections.get(sectionName) || false;
    this.expandedSections.set(sectionName, !isExpanded);
  }

  openCreateSectionDialog(editSection?: Section): void {
    this.editingSection = editSection;
    if (editSection) {
      this.sectionForm.patchValue({
        sectionName: editSection.sectionName,
        backgroundColor: editSection.styles?.['background-color'] || '',
        backgroundImage: editSection.styles?.['background-image']?.replace('url(', '')?.replace(')', '') || '',
      });
    } else {
      this.sectionForm.reset({
        sectionName: '',
        backgroundColor: '',
        backgroundImage: '',
      });
    }

    this.dialog.open({
      title: editSection
        ? this.i18nStore.t('editor.dialog.editSection.title')
        : this.i18nStore.t('editor.dialog.createSection.title'),
      content: this.createSectionRef,
      buttons: {
        position: 'right',
        buttons: [
          {
            text: this.i18nStore.t('editor.components.cancel'),
            click: () => this.dialog.close(),
            type: 'cancel',
          },
          {
            text: this.i18nStore.t('editor.components.saveAction'),
            click: () => this.saveSection(),
            type: 'success',
          },
        ],
      },
      outsideClick: false,
    });
  }

  saveSection(): void {
    if (this.sectionForm.valid) {
      const formValues = this.sectionForm.value;
      const styles: { [key: string]: string } = {};

      if (formValues.backgroundColor) {
        styles['background-color'] = formValues.backgroundColor;
      }

      if (formValues.backgroundImage) {
        styles['background-image'] = `url(${formValues.backgroundImage})`;
        styles['background-size'] = 'cover';
        styles['background-position'] = 'center';
      }

      if (this.editingSection) {
        const oldName = this.editingSection.sectionName;
        this.editingSection.sectionName = formValues.sectionName;
        this.editingSection.styles = styles;

        this.templateService.editSection(this.editingSection);
        
        const gridSec = this.sectionGrids.find(s => s.sectionName === oldName);
        if (gridSec) {
          gridSec.sectionName = formValues.sectionName;
          gridSec.styles = styles;
        }
      } else {
        const newSection: Section = {
          sectionName: formValues.sectionName,
          components: [],
          styles: styles,
        };
        this.templateService.addSection(newSection);
      }

      this.dialog.close();
      this.sectionForm.reset();
    } else {
      this.sectionForm.markAllAsTouched();
    }
  }

  deleteSection(section: Section): void {
    this.dialog.open({
      title: this.i18nStore.t('editor.dialog.deleteSection.title'),
      description: this.i18nStore.t('editor.dialog.deleteSection.confirm'),
      buttons: {
        position: 'right',
        buttons: [
          {
            text: this.i18nStore.t('editor.components.cancel'),
            click: () => this.dialog.close(),
            type: 'cancel',
          },
          {
            text: this.i18nStore.t('editor.components.deleteAction'),
            click: () => {
              this.templateService.removeSection(section);
              this.dialog.close();
            },
            type: 'danger',
          },
        ],
      },
      outsideClick: true,
    });
  }

  openCreateComponentDialog(type: 'text' | 'image' | 'button' | 'separator'): void {
    this.currentComponentType = type;
    let contentRef: any;
    let activeForm: FormGroup;

    switch (type) {
      case 'text':
        contentRef = this.createTextRef;
        activeForm = this.textForm;
        break;
      case 'image':
        contentRef = this.createImageRef;
        activeForm = this.imageForm;
        break;
      case 'button':
        contentRef = this.createButtonRef;
        activeForm = this.buttonForm;
        break;
      case 'separator':
        contentRef = this.createSeparatorRef;
        activeForm = this.separatorForm;
        break;
    }

    activeForm.reset({
      section: this.template?.sections?.[0]?.sectionName || '',
      styles: {
        backgroundColor: '#10b981',
        textColor: '#ffffff',
        borderRadius: 4
      },
      height: 2
    });

    this.dialog.open({
      title: this.i18nStore.t('editor.dialog.createComponent.title'),
      content: contentRef,
      buttons: {
        position: 'right',
        buttons: [
          {
            text: this.i18nStore.t('editor.components.cancel'),
            click: () => this.dialog.close(),
            type: 'cancel',
          },
          {
            text: this.i18nStore.t('editor.components.saveAction'),
            click: () => this.saveComponent(),
            type: 'success',
          },
        ],
      },
      outsideClick: false,
    });
  }

  saveComponent(): void {
    let activeForm: FormGroup;
    switch (this.currentComponentType) {
      case 'text':
        activeForm = this.textForm;
        break;
      case 'image':
        activeForm = this.imageForm;
        break;
      case 'button':
        activeForm = this.buttonForm;
        break;
      case 'separator':
        activeForm = this.separatorForm;
        break;
    }

    if (activeForm.valid) {
      const formValues = activeForm.value;
      const targetSection = formValues.section;
      const blockId = this.templateService.getLastComponentId() + 1;

      const component: TemplateComponents = {
        blockId,
        blockName: formValues.blockName,
        type: this.currentComponentType,
        content: this.currentComponentType === 'separator' ? '-' : formValues.blockContent,
        styles: {},
      };

      if (this.currentComponentType === 'image') {
         component.url = formValues.blockContent;
         component.styles = { height: 'auto' };
      } else if (this.currentComponentType === 'button') {
         component.url = formValues.blockURL;
         component.styles = {
           backgroundColor: formValues.styles?.backgroundColor || '#10b981',
           color: formValues.styles?.textColor || '#ffffff',
           borderRadius: (formValues.styles?.borderRadius || 0) + 'px',
         };
      } else if (this.currentComponentType === 'separator') {
         component.styles = {
           height: (formValues.height || 2) + 'px',
           backgroundColor: '#cccccc',
           border: 'none',
           margin: '10px 0'
         };
      }

      const positionedComponent = this.positionComponentInFirstAvailableCell(component, targetSection);
      this.templateService.addComponent(positionedComponent, targetSection);
      this.dialog.close();
      activeForm.reset();
    } else {
      activeForm.markAllAsTouched();
    }
  }

  private positionComponentInFirstAvailableCell(
    component: TemplateComponents,
    sectionName: string
  ): TemplateComponents {
    const section = this.sectionGrids.find((item) => item.sectionName === sectionName);

    if (!section) {
      return { ...component, posX: 0, posY: 0, sizeX: component.sizeX ?? 1 };
    }

    if (section.grid.length === 0) {
      this.initializeEmptySectionGrid(sectionName);
    }

    for (let rowIndex = 0; rowIndex < section.grid.length; rowIndex++) {
      const colIndex = section.grid[rowIndex].findIndex((cell) => cell.content.length === 0);
      if (colIndex >= 0) {
        const positionedComponent = {
          ...component,
          posX: colIndex,
          posY: rowIndex,
          sizeX: component.sizeX ?? 1,
        };
        section.grid[rowIndex][colIndex].content = [positionedComponent];
        return positionedComponent;
      }
    }

    const rowLength = section.grid[0]?.length || 1;
    const newRow: { id: string; content: TemplateComponents[]; width?: string }[] = [];
    for (let col = 0; col < rowLength; col++) {
      const cellId = this.dragDropService.genUUID();
      newRow.push({ id: cellId, content: [], width: '1fr' });
      this.dragDropService.registerID(cellId, sectionName);
    }

    section.grid.push(newRow);
    const positionedComponent = {
      ...component,
      posX: 0,
      posY: section.grid.length - 1,
      sizeX: component.sizeX ?? 1,
    };
    newRow[0].content = [positionedComponent];
    return positionedComponent;
  }

  public removeCell(sectionName: string, rowIndex: number, colIndex: number): void {
    const section = this.sectionGrids.find((s) => s.sectionName === sectionName);
    if (!section) return;

    const row = section.grid[rowIndex];
    if (!row) return;

    const cell = row[colIndex];
    if (!cell) return;

    if (cell.content && cell.content.length > 0) {
      this.templateService.removeUsedComponent(cell.content[0], sectionName);
    }

    this.dragDropService.unregisterID(cell.id);
    row.splice(colIndex, 1);

    row.forEach((c, index) => {
      if (c.content[0]) {
        c.content[0].posX = index;
        this.templateService.updateComponentPosition(c.content[0], sectionName, index, rowIndex, false);
      }
    });

    if (row.length === 0) {
      section.grid.splice(rowIndex, 1);
      section.grid.forEach((r, rIdx) => {
        r.forEach((c, cIdx) => {
          if (c.content[0]) {
            c.content[0].posY = rIdx;
            this.templateService.updateComponentPosition(c.content[0], sectionName, cIdx, rIdx, false);
          }
        });
      });
    } else {
      const newWidth = 100 / row.length;
      row.forEach((cell) => {
        cell.width = `${newWidth}%`;
      });
    }

    this.templateService.loadData();
    this.cdr.markForCheck();
  }

  public copyVariable(variable: string): void {
    const writeToClipboard = (text: string): Promise<void> => {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        return navigator.clipboard.writeText(text);
      }
      // Fallback for non-secure contexts (JSDOM, HTTP)
      return new Promise<void>((resolve) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        resolve();
      });
    };

    writeToClipboard(variable).then(() => {
      this.copiedVariable = variable;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.copiedVariable = null;
        this.cdr.markForCheck();
      }, 2000);
    });
  }

  public initializeEmptySectionGrid(sectionName: string): void {
    const section = this.sectionGrids.find((s) => s.sectionName === sectionName);
    if (!section) return;
    const cellId = this.dragDropService.genUUID();
    section.grid.push([{ id: cellId, content: [], width: '100%' }]);
    this.dragDropService.registerID(cellId, sectionName);
    this.sectionGrids = [...this.sectionGrids];
    this.cdr.markForCheck();
  }

  public onEditElement(component: TemplateComponents): void {

    this.sectionGrids.forEach((section) => {
      section.grid.forEach((row) => {
        row.forEach((col) => {
          if (col.content[0]?.blockId === component.blockId) {
            col.content[0] = component;
          }
        });
      });
    });
  }

  public onInsertLeft(sectionName: string, rowIndex: number, colIndex: number): void {
    const section = this.sectionGrids.find((s) => s.sectionName === sectionName);
    if (!section) return;

    const cellId = this.dragDropService.genUUID();
    section.grid[rowIndex].splice(colIndex, 0, { id: cellId, content: [], width: '1fr' });
    this.dragDropService.registerID(cellId, sectionName);

    section.grid[rowIndex].forEach((cell, colIdx) => {
      cell.content.forEach((comp) => {
        comp.posX = colIdx;
        comp.posY = rowIndex;
        this.templateService.updateComponentPosition(comp, sectionName, comp.posX, rowIndex, false);
      });
    });

    this.templateService.loadData();
    section.grid[rowIndex][(colIndex - 1) < 0 ? 0 : colIndex - 1].content = [];
  }

  public onInsertRight(sectionName: string, rowIndex: number, colIndex: number): void {
    const section = this.sectionGrids.find((s) => s.sectionName === sectionName);
    if (!section) return;

    const cellId = this.dragDropService.genUUID();
    section.grid[rowIndex].splice(colIndex + 1, 0, { id: cellId, content: [], width: '1fr' });
    this.dragDropService.registerID(cellId, sectionName);

    section.grid[rowIndex].forEach((cell, colIdx) => {
      cell.content.forEach((comp) => {
        comp.posX = colIdx;
        comp.posY = rowIndex;
        this.templateService.updateComponentPosition(comp, sectionName, colIdx, rowIndex, false);
      });
    });

    this.templateService.loadData();
    section.grid[rowIndex][colIndex + 1].content = [];
  }

  public onInsertTop(sectionName: string, rowIndex: number, colIndex: number): void {
    const section = this.sectionGrids.find((s) => s.sectionName === sectionName);
    if (!section) return;

    const newRow = [];
    const rowLength = section.grid[rowIndex]?.length || section.grid[0]?.length || 1;
    for (let col = 0; col < rowLength; col++) {
      const cellId = this.dragDropService.genUUID();
      newRow.push({ id: cellId, content: [], width: '1fr' });
      this.dragDropService.registerID(cellId, sectionName);
    }
    section.grid.splice(rowIndex, 0, newRow);

    section.grid.forEach((row, rowIdx) => {
      row.forEach((cell, colIdx) => {
        cell.content.forEach((comp) => {
          comp.posX = colIdx;
          comp.posY = rowIdx;
          this.templateService.updateComponentPosition(comp, sectionName, colIdx, rowIdx, false);
        });
      });
    });

    this.templateService.loadData();
  }

  public onInsertBottom(sectionName: string, rowIndex: number, colIndex: number): void {
    const section = this.sectionGrids.find((s) => s.sectionName === sectionName);
    if (!section) return;

    const newRow = [];
    const rowLength = section.grid[rowIndex]?.length || section.grid[0]?.length || 1;
    for (let col = 0; col < rowLength; col++) {
      const cellId = this.dragDropService.genUUID();
      newRow.push({ id: cellId, content: [], width: '1fr' });
      this.dragDropService.registerID(cellId, sectionName);
    }
    section.grid.splice(rowIndex + 1, 0, newRow);

    section.grid.forEach((row, rowIdx) => {
      row.forEach((cell, colIdx) => {
        cell.content.forEach((comp) => {
          comp.posX = colIdx;
          comp.posY = rowIdx;
          this.templateService.updateComponentPosition(comp, sectionName, colIdx, rowIdx, false);
        });
      });
    });

    this.templateService.loadData();
  }

  getColumnWidths(sectionName: string, rowIndex: number): string {
    const row = this.sectionGrids.find((s) => s.sectionName === sectionName)?.grid[rowIndex];
    if (!row) return '';
    return row.map((cell) => cell?.width || '1fr').join(' ');
  }

  startResizing(event: MouseEvent, sectionName: string, rowIndex: number, colIndex: number): void {
    event.preventDefault();
    this.resizing = true;
    this.currentSection = sectionName;
    this.currentRowIndex = rowIndex;
    this.currentColIndex = colIndex;
    this.startX = event.clientX;

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.stopResizing);
  }

  onMouseMove = (event: MouseEvent): void => {
    if (!this.resizing) return;

    const deltaX = event.clientX - this.startX;
    const section = this.sectionGrids.find((s) => s.sectionName === this.currentSection);
    if (!section) return;

    const row = section.grid[this.currentRowIndex];
    if (!row) return;

    const containerElement = document.querySelector(
      `[data-section="${this.currentSection}"][data-row="${this.currentRowIndex}"]`
    ) as HTMLElement;
    if (!containerElement) return;

    const containerWidth = containerElement.getBoundingClientRect().width;
    const currentCell = row[this.currentColIndex];
    if (!currentCell) return;

    const currentWidth = parseFloat(currentCell.width || '50');
    const deltaPercent = (deltaX / containerWidth) * 100;

    const newWidths = row.map((cell, index) => {
      if (index === this.currentColIndex) {
        return Math.max(currentWidth + deltaPercent, 5);
      } else {
        const cellWidth = parseFloat(cell.width || '0');
        return Math.max(cellWidth - deltaPercent / (row.length - 1), 5);
      }
    });

    const totalNewWidth = newWidths.reduce((sum, width) => sum + width, 0);

    row.forEach((cell, index) => {
      cell.width = `${(newWidths[index] / totalNewWidth) * 100}%`;
    });

    this.startX = event.clientX;
    this.sectionGrids = [...this.sectionGrids];
  };

  stopResizing = (): void => {
    this.resizing = false;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.stopResizing);
  };
}
