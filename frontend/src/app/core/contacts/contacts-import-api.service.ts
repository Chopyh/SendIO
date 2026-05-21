import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ContactsImportResponse } from './contacts-import.models';

@Injectable({ providedIn: 'root' })
export class ContactsImportApiService {
  private readonly http = inject(HttpClient);

  importCsv(file: File): Observable<ContactsImportResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ContactsImportResponse>('/api/contacts/import', formData);
  }
}
