import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { TemplateEditorPageComponent } from './template-editor-page.component';
import { TemplateComponentService } from '../../../core/shared/dataAccess/services/template-component.service';
import { DialogService } from '../../../core/shared/components/generic-dialog/generic-dialog.service';
import { DragDropService } from '../../../core/shared/dataAccess/services/drag-drop.service';
import { EmailTemplate, TemplateVersion } from '../../../core/shared/dataAccess/models/template-components';
import { I18nStore } from '../../../core/i18n/i18n.store';
import { translations } from '../../../core/i18n/translations';

describe('TemplateEditorPageComponent', () => {
  let fixture: ComponentFixture<TemplateEditorPageComponent>;
  let component: TemplateEditorPageComponent;

  let mockTemplateService: any;
  let mockDialogService: any;
  let mockDragDropService: any;
  let mockRouter: any;
  let mockI18nStore: any;
  let templateSubject: BehaviorSubject<EmailTemplate>;

  const mockTemplate: EmailTemplate = {
    id: 'tpl-123',
    name: 'Newsletter Template',
    workspace_id: 1,
    sections: [
      {
        sectionName: 'Header',
        components: [
          {
            blockId: 1,
            blockName: 'Header Text',
            type: 'text',
            content: 'Hello {{contact.first_name}}! Please unsub here: {{unsubscribe_url}}',
            posX: 0,
            posY: 0,
            sizeX: 1,
          }
        ]
      }
    ],
    versions: [
      {
        id: 'ver-1',
        template_id: 'tpl-123',
        version_number: 1,
        state: 'draft',
        snapshot_json: { sections: [] },
        compliance_unsubscribe_url: true,
      }
    ]
  };

  beforeEach(async () => {
    templateSubject = new BehaviorSubject<EmailTemplate>(mockTemplate);

    mockTemplateService = {
      templateComponents$: templateSubject.asObservable(),
      loadTemplate: vi.fn(),
      saveTemplate: vi.fn().mockReturnValue(of({ data: mockTemplate.versions![0] })),
      publishTemplate: vi.fn().mockReturnValue(of({ data: { ...mockTemplate.versions![0], state: 'published' } })),
      createDraftVersion: vi.fn().mockReturnValue(of({ data: { id: 'ver-2', template_id: 'tpl-123', version_number: 2, state: 'draft' } })),
      addComponent: vi.fn(),
      updateComponentPosition: vi.fn(),
      moveComponentToSection: vi.fn(),
      removeUsedComponent: vi.fn(),
      editComponent: vi.fn(),
      getLastComponentId: vi.fn().mockReturnValue(1),
      loadData: vi.fn(),
    };

    mockDialogService = {
      open: vi.fn(),
      close: vi.fn(),
    };

    mockDragDropService = {
      $idList: new BehaviorSubject([]),
      $isDragging: new BehaviorSubject(false),
      genUUID: vi.fn().mockReturnValue('uuid-xyz'),
      registerID: vi.fn(),
      unregisterID: vi.fn(),
      getSection: vi.fn().mockReturnValue('Header'),
      startDragging: vi.fn(),
      finishDragging: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    mockI18nStore = {
      locale: () => 'en',
      setLocale: vi.fn(),
      t: vi.fn((key: string) => {
        return translations.en[key] || key;
      }),
    };

    await TestBed.configureTestingModule({
      imports: [TemplateEditorPageComponent],
      providers: [
        { provide: TemplateComponentService, useValue: mockTemplateService },
        { provide: DialogService, useValue: mockDialogService },
        { provide: DragDropService, useValue: mockDragDropService },
        { provide: Router, useValue: mockRouter },
        { provide: I18nStore, useValue: mockI18nStore },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'tpl-123' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();
  });

  function initComponent() {
    fixture = TestBed.createComponent(TemplateEditorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create and load template on init', () => {
    initComponent();
    expect(component).toBeTruthy();
    expect(mockTemplateService.loadTemplate).toHaveBeenCalledWith('tpl-123');
    expect(component.template!.id).toBe('tpl-123');
  });

  it('should call markForCheck when templateComponents$ updates', () => {
    initComponent();
    const cdrSpy = vi.spyOn((component as any).cdr, 'markForCheck');
    templateSubject.next({
      ...mockTemplate,
      id: 'tpl-123',
      name: 'Updated Template',
    });
    expect(cdrSpy).toHaveBeenCalled();
  });

  it('should automatically add columns when placing a component with posX >= grid row length', () => {
    initComponent();
    const largePosXComponent = {
      blockId: 2,
      blockName: 'Right Column Text',
      type: 'text' as const,
      content: 'New Column Content',
      posX: 3,
      posY: 0,
      sizeX: 1,
    };
    const addColSpy = vi.spyOn(component, 'addColumnToSection');
    component.placeComponentInSectionGrid(largePosXComponent, 'Header');
    expect(addColSpy).toHaveBeenCalledWith('Header');
    expect(component.sectionGrids.find(s => s.sectionName === 'Header')?.grid[0].length).toBeGreaterThan(3);
  });

  it('should calculate getters correctly for draft templates', () => {
    initComponent();
    expect(component.currentVersionNumber).toBe(1);
    expect(component.currentVersionState).toBe('draft');
    expect(component.isPublished).toBe(false);
  });

  it('should calculate getters correctly for published templates', () => {
    const publishedTemplate = {
      ...mockTemplate,
      versions: [
        {
          id: 'ver-1',
          template_id: 'tpl-123',
          version_number: 1,
          state: 'published' as const,
          snapshot_json: { sections: [] },
          compliance_unsubscribe_url: true,
        }
      ]
    };
    templateSubject.next(publishedTemplate);
    initComponent();

    expect(component.currentVersionNumber).toBe(1);
    expect(component.currentVersionState).toBe('published');
    expect(component.isPublished).toBe(true);
  });

  it('should navigate back to the templates list when goBack is called', () => {
    initComponent();
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/templates']);
  });

  it('should save template draft and display confirmation dialog', () => {
    initComponent();
    component.saveDraft();
    expect(mockTemplateService.saveTemplate).toHaveBeenCalledWith(
      'tpl-123',
      expect.arrayContaining([
        expect.objectContaining({
          sectionName: 'Header',
          components: [
            expect.objectContaining({
              blockId: 1,
              posX: 0,
              posY: 0,
            }),
          ],
        }),
      ])
    );
    const en = translations.en;
    expect(mockDialogService.open).toHaveBeenCalledWith(
      expect.objectContaining({
        title: en['editor.alert.saveSuccess.title'],
      })
    );
  });

  it('should handle errors when saving template draft fails', () => {
    initComponent();
    mockTemplateService.saveTemplate.mockReturnValueOnce(
      throwError(() => ({
        error: { error: { message: 'Could not save' } }
      }))
    );
    component.saveDraft();
    const en = translations.en;
    expect(mockDialogService.open).toHaveBeenCalledWith(
      expect.objectContaining({
        title: en['editor.alert.saveError.title'],
        description: 'Could not save',
      })
    );
  });

  it('should serialize only positioned canvas components when saving a draft', () => {
    const templateWithUnplacedComponent: EmailTemplate = {
      ...mockTemplate,
      sections: [
        {
          sectionName: 'Header',
          components: [
            mockTemplate.sections[0].components[0],
            {
              blockId: 2,
              blockName: 'Unplaced Text',
              type: 'text',
              content: 'Not on canvas',
            },
          ],
        },
      ],
    };
    templateSubject.next(templateWithUnplacedComponent);
    initComponent();

    component.saveDraft();

    const savedSections = mockTemplateService.saveTemplate.mock.calls[0][1];
    expect(savedSections[0].components).toEqual([
      expect.objectContaining({
        blockId: 1,
        posX: 0,
        posY: 0,
        sizeX: 1,
      }),
    ]);
  });

  it('should assign a numeric canvas position when creating a component', () => {
    initComponent();
    component.currentComponentType = 'text';
    component.textForm.setValue({
      blockName: 'New Text',
      blockContent: 'Created text',
      section: 'Header',
    });

    component.saveComponent();

    expect(mockTemplateService.addComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        blockName: 'New Text',
        posX: 1,
        posY: 0,
        sizeX: 1,
      }),
      'Header'
    );
  });

  it('should publish template and display confirmation dialog', () => {
    initComponent();
    component.publish();
    expect(mockTemplateService.publishTemplate).toHaveBeenCalledWith('tpl-123', 1);
    const en = translations.en;
    expect(mockDialogService.open).toHaveBeenCalledWith(
      expect.objectContaining({
        title: en['editor.alert.publishSuccess.title'],
      })
    );
  });

  it('should handle compliance missing unsubscribe url error on publish', () => {
    initComponent();
    mockTemplateService.publishTemplate.mockReturnValueOnce(
      throwError(() => ({
        error: { error: { code: 'template.missing_unsubscribe', message: 'Missing unsubscribe link' } }
      }))
    );
    component.publish();
    const en = translations.en;
    expect(mockDialogService.open).toHaveBeenCalledWith(
      expect.objectContaining({
        title: en['editor.alert.complianceError.title'],
        description: expect.stringContaining('unsubscribe placeholder'),
      })
    );
  });

  it('should handle compliance invalid placeholders error on publish', () => {
    initComponent();
    mockTemplateService.publishTemplate.mockReturnValueOnce(
      throwError(() => ({
        error: {
          error: {
            code: 'template.invalid_placeholders',
            details: { invalid_placeholders: ['{{foo}}'] }
          }
        }
      }))
    );
    component.publish();
    const en = translations.en;
    expect(mockDialogService.open).toHaveBeenCalledWith(
      expect.objectContaining({
        title: en['editor.alert.invalidVars.title'],
        description: expect.stringContaining('{{foo}}'),
      })
    );
  });

  it('should create a new draft version from a published template', () => {
    initComponent();
    component.createNewDraft();
    expect(mockTemplateService.createDraftVersion).toHaveBeenCalledWith('tpl-123');
    const en = translations.en;
    expect(mockDialogService.open).toHaveBeenCalledWith(
      expect.objectContaining({
        title: en['editor.alert.createDraftSuccess.title'],
        description: expect.stringContaining('v2'),
      })
    );
  });

  describe('removeCell', () => {
    it('should remove a cell, unregister its ID, recalculate widths for remaining cells, and call loadData', () => {
      initComponent();
      const section = component.sectionGrids.find(s => s.sectionName === 'Header');
      expect(section).toBeTruthy();
      
      section!.grid = [
        [
          { id: 'cell-1', content: [], width: '33.33%' },
          { id: 'cell-2', content: [], width: '33.33%' },
          { id: 'cell-3', content: [], width: '33.33%' },
        ]
      ];
      
      component.removeCell('Header', 0, 1);
      
      expect(mockDragDropService.unregisterID).toHaveBeenCalledWith('cell-2');
      expect(section!.grid[0].length).toBe(2);
      expect(section!.grid[0][0].width).toBe('50%');
      expect(section!.grid[0][1].width).toBe('50%');
      expect(mockTemplateService.loadData).toHaveBeenCalled();
    });

    it('should call removeUsedComponent if the removed cell contains a component', () => {
      initComponent();
      const section = component.sectionGrids.find(s => s.sectionName === 'Header');
      expect(section).toBeTruthy();

      const testComponent = {
        blockId: 99,
        blockName: 'To Be Deleted',
        type: 'text' as const,
        content: 'Content'
      };

      section!.grid = [
        [
          { id: 'cell-1', content: [testComponent], width: '50%' },
          { id: 'cell-2', content: [], width: '50%' },
        ]
      ];

      component.removeCell('Header', 0, 0);

      expect(mockTemplateService.removeUsedComponent).toHaveBeenCalledWith(testComponent, 'Header');
      expect(section!.grid[0].length).toBe(1);
      expect(section!.grid[0][0].width).toBe('100%');
      expect(mockTemplateService.loadData).toHaveBeenCalled();
    });

    it('should remove the entire row if it becomes empty after column removal', () => {
      initComponent();
      const section = component.sectionGrids.find(s => s.sectionName === 'Header');
      expect(section).toBeTruthy();

      section!.grid = [
        [
          { id: 'cell-1', content: [], width: '100%' }
        ]
      ];

      component.removeCell('Header', 0, 0);

      expect(section!.grid.length).toBe(0);
      expect(mockTemplateService.loadData).toHaveBeenCalled();
    });
  });

  describe('copyVariable', () => {
    it('should set copiedVariable to the given value after copy', async () => {
      initComponent();
      const variable = '{{contact.first_name}}';

      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        configurable: true,
      });

      await component.copyVariable(variable);

      expect(component.copiedVariable).toBe(variable);
    });

    it('should reset copiedVariable to null after 2 seconds', async () => {
      initComponent();
      vi.useFakeTimers();

      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        configurable: true,
      });

      await component.copyVariable('{{contact.email}}');
      expect(component.copiedVariable).toBe('{{contact.email}}');

      vi.advanceTimersByTime(2100);
      expect(component.copiedVariable).toBeNull();

      vi.useRealTimers();
    });
  });

  describe('initializeEmptySectionGrid', () => {
    it('should add a 1x1 grid row to a section with an empty grid', () => {
      initComponent();
      const section = component.sectionGrids.find(s => s.sectionName === 'Header');
      expect(section).toBeTruthy();

      // Clear grid to simulate empty state
      section!.grid = [];

      component.initializeEmptySectionGrid('Header');

      expect(section!.grid.length).toBe(1);
      expect(section!.grid[0].length).toBe(1);
      expect(section!.grid[0][0].width).toBe('100%');
      expect(mockDragDropService.registerID).toHaveBeenCalled();
    });

    it('should not crash when section is not found', () => {
      initComponent();
      expect(() => component.initializeEmptySectionGrid('NonExistent')).not.toThrow();
    });
  });

  describe('variables sidebar', () => {
    it('should expose contactVariables, workspaceVariables, and systemVariables', () => {
      initComponent();
      expect(component.contactVariables).toContain('{{contact.first_name}}');
      expect(component.contactVariables).toContain('{{contact.email}}');
      expect(component.workspaceVariables).toContain('{{workspace.name}}');
      expect(component.systemVariables).toContain('{{unsubscribe_url}}');
      expect(component.systemVariables).toContain('{{system.unsubscribe_url}}');
    });

    it('should start with variablesExpanded as false', () => {
      initComponent();
      expect(component.variablesExpanded).toBe(false);
    });
  });
});
