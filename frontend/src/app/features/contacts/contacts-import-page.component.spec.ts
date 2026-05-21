import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ContactsImportApiService } from '../../core/contacts/contacts-import-api.service';
import { ContactsImportPageComponent } from './contacts-import-page.component';

describe('ContactsImportPageComponent', () => {
  let fixture: ComponentFixture<ContactsImportPageComponent>;
  let component: ContactsImportPageComponent;
  let contactsImportApi: { importCsv: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    contactsImportApi = {
      importCsv: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ContactsImportPageComponent],
      providers: [{ provide: ContactsImportApiService, useValue: contactsImportApi }],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactsImportPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the initial CSV instructions', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Import contacts');
    expect(text).toContain('CSV requirements');
    expect(text).toContain('email,first_name,last_name,phone');
  });

  it('enables import after selecting a CSV file', () => {
    component.onFileSelected(fileSelectionEvent(new File(['email,first_name,last_name,phone'], 'contacts.csv', { type: 'text/csv' })));
    fixture.detectChanges();

    expect(component.canImport()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('contacts.csv');
  });

  it('renders processed, skipped, and failed summary after a valid upload', async () => {
    contactsImportApi.importCsv.mockReturnValue(
      of({
        data: {
          summary: {
            processed: 2,
            skipped: 1,
            failed: 1,
            details: { skipped: [], failed: [] },
          },
        },
      }),
    );

    component.onFileSelected(fileSelectionEvent(new File(['valid'], 'contacts.csv', { type: 'text/csv' })));
    await component.importContacts();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Processed');
    expect(text).toContain('Skipped');
    expect(text).toContain('Failed');
    expect(text).toContain('2');
    expect(text).toContain('1');
    expect(text).toContain('Import completed. Review skipped and failed rows before uploading another file.');
  });

  it('detects issue summaries from counts even when diagnostic details are empty', async () => {
    contactsImportApi.importCsv.mockReturnValue(
      of({
        data: {
          summary: {
            processed: 0,
            skipped: 0,
            failed: 1,
            details: { skipped: [], failed: [] },
          },
        },
      }),
    );

    component.onFileSelected(fileSelectionEvent(new File(['invalid'], 'contacts.csv', { type: 'text/csv' })));
    await component.importContacts();
    fixture.detectChanges();

    expect(component.hasIssues()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain(
      'Import completed. Review skipped and failed rows before uploading another file.',
    );
  });

  it('renders skipped and failed row diagnostics from the summary', async () => {
    contactsImportApi.importCsv.mockReturnValue(
      of({
        data: {
          summary: {
            processed: 2,
            skipped: 1,
            failed: 1,
            details: {
              skipped: [{ row: 3, email: 'ana@example.com', reason: 'Duplicate email in workspace.' }],
              failed: [{ row: 4, email: 'invalid-email', reason: 'Invalid email format.' }],
            },
          },
        },
      }),
    );

    component.onFileSelected(fileSelectionEvent(new File(['valid'], 'contacts.csv', { type: 'text/csv' })));
    await component.importContacts();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Skipped rows');
    expect(text).toContain('Failed rows');
    expect(text).toContain('ana@example.com');
    expect(text).toContain('Duplicate email in workspace.');
    expect(text).toContain('invalid-email');
    expect(text).toContain('Invalid email format.');
  });

  it('renders a localized actionable API error', async () => {
    contactsImportApi.importCsv.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: {
              error: {
                code: 'validation.failed',
                message: 'Validation failed.',
                details: { file: ['The file field is required.'] },
              },
            },
          }),
      ),
    );

    component.onFileSelected(fileSelectionEvent(new File(['invalid'], 'contacts.csv', { type: 'text/csv' })));
    await component.importContacts();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'The CSV file could not be accepted. Confirm the file exists and uses the required header order.',
    );
  });

  it('clears the selected native file input when reset is requested', () => {
    const input = { value: 'C:\\fakepath\\contacts.csv' } as HTMLInputElement;

    component.onFileSelected(fileSelectionEvent(new File(['valid'], 'contacts.csv', { type: 'text/csv' })));
    component.reset(input);

    expect(component.state()).toBe('idle');
    expect(component.selectedFile()).toBeNull();
    expect(input.value).toBe('');
  });
});

function fileSelectionEvent(file: File): Event {
  return { target: { files: [file], value: '' } } as unknown as Event;
}
