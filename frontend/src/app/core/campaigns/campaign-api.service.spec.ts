import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CampaignApiService } from './campaign-api.service';

describe('CampaignApiService', () => {
  let service: CampaignApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [CampaignApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(CampaignApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('maps only published template versions from templates endpoint', () => {
    service.listPublishedTemplates().subscribe((templates) => {
      expect(templates).toEqual([{ id: 'tpl-1', name: 'Newsletter', versions: [2, 1] }]);
    });

    const request = httpTesting.expectOne('/api/templates');
    expect(request.request.method).toBe('GET');

    request.flush({
      data: [
        {
          id: 'tpl-1',
          name: 'Newsletter',
          versions: [
            { version_number: 2, state: 'published' },
            { version_number: 1, state: 'published' },
            { version_number: 3, state: 'draft' },
          ],
        },
        {
          id: 'tpl-2',
          name: 'Empty',
          versions: [{ version_number: 1, state: 'draft' }],
        },
      ],
    });
  });

  it('normalizes contacts and drops malformed contacts', () => {
    service.listContacts().subscribe((contacts) => {
      expect(contacts).toEqual([
        {
          id: '101',
          email: 'valid@example.com',
          first_name: 'Ada',
          last_name: 'Lovelace',
        },
      ]);
    });

    const request = httpTesting.expectOne('/api/contacts');
    expect(request.request.method).toBe('GET');

    request.flush({
      data: [
        { id: 101, email: 'valid@example.com', first_name: 'Ada', last_name: 'Lovelace' },
        { id: 'broken-1', email: '' },
        { id: null, email: 'missing-id@example.com' },
      ],
    });
  });
});
