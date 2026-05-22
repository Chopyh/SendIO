import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TemplateComponentService } from './template-component.service';
import { EmailTemplate, Section, TemplateVersion } from '../models/template-components';

describe('TemplateComponentService', () => {
  let service: TemplateComponentService;
  let httpTesting: HttpTestingController;

  const mockApiTemplate = {
    id: 'tpl-123',
    name: 'Test Template',
    workspace_id: 1,
    created_at: '2026-05-22T04:00:00.000Z',
    updated_at: '2026-05-22T04:00:00.000Z',
    versions: [
      {
        id: 'ver-2',
        template_id: 'tpl-123',
        version_number: 2,
        state: 'draft' as const,
        snapshot_json: {
          sections: [
            {
              sectionName: 'Header',
              components: [
                {
                  blockId: 1,
                  blockName: 'Title',
                  type: 'text' as const,
                  content: 'Hello World',
                  posX: 0,
                  posY: 0,
                  sizeX: 1,
                },
              ],
            },
          ],
        },
        compliance_unsubscribe_url: false,
        created_at: '2026-05-22T04:10:00.000Z',
        updated_at: '2026-05-22T04:10:00.000Z',
      },
      {
        id: 'ver-1',
        template_id: 'tpl-123',
        version_number: 1,
        state: 'published' as const,
        snapshot_json: {
          sections: [],
        },
        compliance_unsubscribe_url: true,
        created_at: '2026-05-22T04:00:00.000Z',
        updated_at: '2026-05-22T04:00:00.000Z',
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), TemplateComponentService],
    });

    service = TestBed.inject(TemplateComponentService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should load template and map the latest version to sections', () => {
    service.loadTemplate('tpl-123');

    const req = httpTesting.expectOne('/api/templates/tpl-123');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockApiTemplate });

    service.templateComponents$.subscribe((template) => {
      expect(template.id).toBe('tpl-123');
      expect(template.name).toBe('Test Template');
      expect(template.versions?.length).toBe(2);
      expect(template.sections.length).toBe(1);
      expect(template.sections[0].sectionName).toBe('Header');
      expect(template.sections[0].components[0].content).toBe('Hello World');
    });
  });

  it('should save template draft and update BehaviorSubject', () => {
    // Manually load template first to seed service value
    service.loadTemplate('tpl-123');
    const reqGet = httpTesting.expectOne('/api/templates/tpl-123');
    reqGet.flush({ data: mockApiTemplate });

    const newSections: Section[] = [
      {
        sectionName: 'Header',
        components: [
          {
            blockId: 1,
            blockName: 'Title',
            type: 'text' as const,
            content: 'Hello Saved World',
            posX: 0,
            posY: 0,
            sizeX: 1,
          },
        ],
      },
    ];

    const mockSavedVersion: TemplateVersion = {
      id: 'ver-2',
      template_id: 'tpl-123',
      version_number: 2,
      state: 'draft',
      snapshot_json: { sections: newSections },
      compliance_unsubscribe_url: false,
    };

    service.saveTemplate('tpl-123', newSections).subscribe((res) => {
      expect(res.data.version_number).toBe(2);
      expect(res.data.snapshot_json?.sections[0].components[0].content).toBe('Hello Saved World');
    });

    const reqPut = httpTesting.expectOne('/api/templates/tpl-123/versions/2');
    expect(reqPut.request.method).toBe('PUT');
    expect(reqPut.request.body).toEqual({ content: { sections: newSections } });
    reqPut.flush({ data: mockSavedVersion });

    // Verify template components subject is updated
    service.templateComponents$.subscribe((template) => {
      expect(template.sections[0].components[0].content).toBe('Hello Saved World');
    });
  });

  it('should publish template version and update BehaviorSubject', () => {
    service.loadTemplate('tpl-123');
    const reqGet = httpTesting.expectOne('/api/templates/tpl-123');
    reqGet.flush({ data: mockApiTemplate });

    const mockPublishedVersion: TemplateVersion = {
      id: 'ver-2',
      template_id: 'tpl-123',
      version_number: 2,
      state: 'published',
      snapshot_json: mockApiTemplate.versions[0].snapshot_json,
      compliance_unsubscribe_url: true,
    };

    service.publishTemplate('tpl-123', 2).subscribe((res) => {
      expect(res.data.state).toBe('published');
    });

    const reqPost = httpTesting.expectOne('/api/templates/tpl-123/versions/2/publish');
    expect(reqPost.request.method).toBe('POST');
    reqPost.flush({ data: mockPublishedVersion });

    service.templateComponents$.subscribe((template) => {
      expect(template.versions?.[0].state).toBe('published');
    });
  });

  it('should create draft version and update BehaviorSubject', () => {
    service.loadTemplate('tpl-123');
    const reqGet = httpTesting.expectOne('/api/templates/tpl-123');
    reqGet.flush({ data: mockApiTemplate });

    const mockNewVersion: TemplateVersion = {
      id: 'ver-3',
      template_id: 'tpl-123',
      version_number: 3,
      state: 'draft',
      snapshot_json: mockApiTemplate.versions[0].snapshot_json,
      compliance_unsubscribe_url: false,
    };

    service.createDraftVersion('tpl-123').subscribe((res) => {
      expect(res.data.version_number).toBe(3);
    });

    const reqPost = httpTesting.expectOne('/api/templates/tpl-123/versions');
    expect(reqPost.request.method).toBe('POST');
    reqPost.flush({ data: mockNewVersion });

    service.templateComponents$.subscribe((template) => {
      expect(template.versions?.[0].version_number).toBe(3);
      expect(template.versions?.[0].state).toBe('draft');
    });
  });

  it('should delete template', () => {
    service.deleteTemplate('tpl-123').subscribe();

    const req = httpTesting.expectOne('/api/templates/tpl-123');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should create template', () => {
    service.createTemplate('New Template Name').subscribe((res) => {
      expect(res.data.name).toBe('New Template Name');
    });

    const req = httpTesting.expectOne('/api/templates');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'New Template Name' });
    req.flush({ data: { id: 'tpl-999', name: 'New Template Name' } });
  });

  it('should list templates', () => {
    service.listTemplates().subscribe((res) => {
      expect(res.data.length).toBe(1);
      expect(res.data[0].id).toBe('tpl-123');
    });

    const req = httpTesting.expectOne('/api/templates');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [mockApiTemplate] });
  });
});
