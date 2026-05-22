import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { TemplatesListPageComponent } from './templates-list-page.component';
import { TemplateComponentService } from '../../../core/shared/dataAccess/services/template-component.service';
import { DialogService } from '../../../core/shared/components/generic-dialog/generic-dialog.service';
import { I18nStore } from '../../../core/i18n/i18n.store';
import { EmailTemplate } from '../../../core/shared/dataAccess/models/template-components';

describe('TemplatesListPageComponent', () => {
  let fixture: ComponentFixture<TemplatesListPageComponent>;
  let component: TemplatesListPageComponent;

  let mockTemplateService: any;
  let mockDialogService: any;
  let mockRouter: any;
  let mockI18nStore: any;

  const mockTemplates: EmailTemplate[] = [
    {
      id: 'tpl-1',
      name: 'Newsletter 1',
      workspace_id: 1,
      created_at: '2026-05-20T10:00:00Z',
      updated_at: '2026-05-20T11:00:00Z',
      sections: [],
      versions: [
        {
          id: 'ver-1-1',
          template_id: 'tpl-1',
          version_number: 1,
          state: 'draft',
          created_at: '2026-05-20T10:00:00Z',
          updated_at: '2026-05-20T11:00:00Z',
        },
      ],
    },
    {
      id: 'tpl-2',
      name: 'Promo Campaign',
      workspace_id: 1,
      created_at: '2026-05-21T10:00:00Z',
      updated_at: '2026-05-21T12:00:00Z',
      sections: [],
      versions: [
        {
          id: 'ver-2-1',
          template_id: 'tpl-2',
          version_number: 2,
          state: 'published',
          created_at: '2026-05-21T10:00:00Z',
          updated_at: '2026-05-21T12:00:00Z',
        },
      ],
    },
  ];

  beforeEach(async () => {
    mockTemplateService = {
      listTemplates: vi.fn().mockReturnValue(of({ data: [...mockTemplates] })),
      createTemplate: vi.fn().mockReturnValue(of({ data: { id: 'tpl-new', name: 'New Template' } })),
      deleteTemplate: vi.fn().mockReturnValue(of(null)),
    };

    mockDialogService = {
      open: vi.fn(),
      close: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    mockI18nStore = {
      locale: () => 'en',
      setLocale: vi.fn(),
      t: vi.fn((key: string) => key),
    };

    await TestBed.configureTestingModule({
      imports: [TemplatesListPageComponent],
      providers: [
        { provide: TemplateComponentService, useValue: mockTemplateService },
        { provide: DialogService, useValue: mockDialogService },
        { provide: Router, useValue: mockRouter },
        { provide: I18nStore, useValue: mockI18nStore },
      ],
    }).compileComponents();
  });

  const initComponent = () => {
    fixture = TestBed.createComponent(TemplatesListPageComponent);
    component = fixture.componentInstance;
  };

  it('should create component', () => {
    initComponent();
    expect(component).toBeTruthy();
  });

  it('should load list of templates on init', () => {
    initComponent();
    fixture.detectChanges();

    expect(mockTemplateService.listTemplates).toHaveBeenCalled();
    expect(component.templates.length).toBe(2);
    expect(component.loading).toBe(false);
  });

  it('should show empty state when no templates exist', () => {
    mockTemplateService.listTemplates.mockReturnValue(of({ data: [] }));
    initComponent();
    fixture.detectChanges();

    expect(component.templates.length).toBe(0);
    const compiled = fixture.nativeElement;
    // Check if the empty state message or class exists
    expect(compiled.querySelector('.pi-folder-open')).toBeTruthy();
  });

  it('should navigate to edit template', () => {
    initComponent();
    fixture.detectChanges();

    component.editTemplate('tpl-1');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/templates', 'tpl-1', 'edit']);
  });

  it('should open new template dialog', () => {
    initComponent();
    fixture.detectChanges();

    component.openCreateDialog();

    expect(component.newTemplateName).toBe('');
    expect(component.createError).toBe('');
    expect(mockDialogService.open).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'templates.create.title',
      }),
      component.newTemplateDialog
    );
  });

  it('should show validation error if template name is empty in create dialog', () => {
    initComponent();
    fixture.detectChanges();

    component.newTemplateName = '';
    component.confirmCreateTemplate();

    expect(component.createError).toBe('validation.required');
    expect(mockTemplateService.createTemplate).not.toHaveBeenCalled();
  });

  it('should call createTemplate API and navigate to editor on successful template creation', () => {
    initComponent();
    fixture.detectChanges();

    component.newTemplateName = 'Awesome Layout';
    component.confirmCreateTemplate();

    expect(mockTemplateService.createTemplate).toHaveBeenCalledWith('Awesome Layout');
    expect(mockDialogService.close).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/templates', 'tpl-new', 'edit']);
  });

  it('should show API error in create dialog on createTemplate API failure', () => {
    mockTemplateService.createTemplate.mockReturnValue(
      throwError(() => ({ error: { error: { message: 'Name already exists.' } } }))
    );

    initComponent();
    fixture.detectChanges();

    component.newTemplateName = 'Awesome Layout';
    component.confirmCreateTemplate();

    expect(mockTemplateService.createTemplate).toHaveBeenCalledWith('Awesome Layout');
    expect(component.createError).toBe('Name already exists.');
    expect(mockDialogService.close).not.toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should open delete confirmation dialog', () => {
    initComponent();
    fixture.detectChanges();

    const tpl = mockTemplates[0];
    component.deleteTemplate(tpl);

    expect(mockDialogService.open).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'templates.delete',
        description: 'templates.delete.confirm',
      })
    );
  });

  it('should call deleteTemplate API and refresh list on delete confirm', () => {
    initComponent();
    fixture.detectChanges();

    const tpl = mockTemplates[0];
    component.confirmDeleteTemplate(tpl.id);

    expect(mockTemplateService.deleteTemplate).toHaveBeenCalledWith(tpl.id);
    expect(mockDialogService.close).toHaveBeenCalled();
    // After delete it reloads the templates
    expect(mockTemplateService.listTemplates).toHaveBeenCalledTimes(2);
  });

  it('should show error dialog if delete API fails', () => {
    mockTemplateService.deleteTemplate.mockReturnValue(
      throwError(() => ({ error: { error: { message: 'Cannot delete published templates.' } } }))
    );

    initComponent();
    fixture.detectChanges();

    const tpl = mockTemplates[0];
    component.confirmDeleteTemplate(tpl.id);

    expect(mockTemplateService.deleteTemplate).toHaveBeenCalledWith(tpl.id);
    // Should close the confirmation dialog and then open the error dialog
    expect(mockDialogService.close).toHaveBeenCalled();
    expect(mockDialogService.open).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'templates.error.title',
        description: 'Cannot delete published templates.',
      })
    );
  });

  it('should correctly format version helpers', () => {
    initComponent();
    fixture.detectChanges();

    const tplDraft = mockTemplates[0];
    const tplPublished = mockTemplates[1];

    expect(component.getLatestVersionNumber(tplDraft)).toBe(1);
    expect(component.getLatestVersionState(tplDraft)).toBe('draft');
    expect(component.getFormattedDate(tplDraft)).toBeInstanceOf(Date);

    expect(component.getLatestVersionNumber(tplPublished)).toBe(2);
    expect(component.getLatestVersionState(tplPublished)).toBe('published');
  });
});
