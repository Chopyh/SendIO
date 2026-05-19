import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BootstrapWorkspaceRequest,
  MeResponse,
  TokenResponse,
  WorkspaceResponse,
} from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(email: string, password: string): Observable<TokenResponse> {
    return this.http.post<TokenResponse>('/api/auth/login', { email, password });
  }

  refresh(): Observable<TokenResponse> {
    return this.http.post<TokenResponse>('/api/auth/refresh', {});
  }

  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>('/api/auth/me');
  }

  bootstrapWorkspace(payload: BootstrapWorkspaceRequest): Observable<WorkspaceResponse> {
    return this.http.post<WorkspaceResponse>('/api/workspaces/bootstrap', payload);
  }

  currentWorkspace(): Observable<WorkspaceResponse> {
    return this.http.get<WorkspaceResponse>('/api/workspaces/current');
  }
}
