import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ContactsApiEnvelope, WorkspaceContact } from './contacts.models';

@Injectable({ providedIn: 'root' })
export class ContactsApiService {
  private readonly http = inject(HttpClient);

  listContacts(): Observable<WorkspaceContact[]> {
    return this.http
      .get<ContactsApiEnvelope<WorkspaceContact[]>>('/api/contacts')
      .pipe(map((response) => response.data ?? []));
  }
}
