import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ContactsApiService } from '../../core/contacts/contacts-api.service';
import { ContactsListPageComponent } from './contacts-list-page.component';

describe('ContactsListPageComponent', () => {
  let fixture: ComponentFixture<ContactsListPageComponent>;
  let component: ContactsListPageComponent;

  const contactsApi = {
    listContacts: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    contactsApi.listContacts.mockReturnValue(
      of([
        { id: 'contact-1', email: 'one@example.com', first_name: 'One', last_name: 'Person' },
        { id: 'contact-2', email: 'two@example.com' },
      ]),
    );

    await TestBed.configureTestingModule({
      imports: [ContactsListPageComponent],
      providers: [{ provide: ContactsApiService, useValue: contactsApi }],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactsListPageComponent);
    component = fixture.componentInstance;
    await Promise.resolve();
  });

  it('loads contacts on page init', () => {
    expect(contactsApi.listContacts).toHaveBeenCalledTimes(1);
    expect(component.contacts()).toHaveLength(2);
    expect(component.loading()).toBe(false);
    expect(component.loadError()).toBe(false);
  });

  it('sets error state when request fails', async () => {
    contactsApi.listContacts.mockReturnValue(throwError(() => new Error('failed')));

    fixture = TestBed.createComponent(ContactsListPageComponent);
    component = fixture.componentInstance;
    await Promise.resolve();

    expect(component.loading()).toBe(false);
    expect(component.loadError()).toBe(true);
    expect(component.contacts()).toEqual([]);
  });
});
