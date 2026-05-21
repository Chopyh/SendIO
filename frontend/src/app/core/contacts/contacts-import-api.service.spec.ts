import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ContactsImportApiService } from './contacts-import-api.service';

describe('ContactsImportApiService', () => {
  let service: ContactsImportApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ContactsImportApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('posts the selected CSV as multipart form data using the file field', () => {
    const file = new File(['email,first_name,last_name,phone'], 'contacts.csv', { type: 'text/csv' });

    service.importCsv(file).subscribe((response) => {
      expect(response.data.summary.processed).toBe(1);
    });

    const request = httpTesting.expectOne('/api/contacts/import');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeInstanceOf(FormData);
    expect((request.request.body as FormData).get('file')).toBe(file);

    request.flush({
      data: {
        summary: {
          processed: 1,
          skipped: 0,
          failed: 0,
          details: { skipped: [], failed: [] },
        },
      },
    });
  });
});
