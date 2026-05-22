import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  ApiEnvelope,
  CampaignCreatePayload,
  CampaignRecord,
  CampaignSummary,
  ContactOption,
  PublishedTemplateOption,
  RememberedCampaign,
} from './campaign.models';

const RECENT_CAMPAIGNS_KEY = 'sendio.campaigns.recent';
const RECENT_CAMPAIGNS_LIMIT = 25;

@Injectable({ providedIn: 'root' })
export class CampaignApiService {
  private readonly http = inject(HttpClient);

  private normalizePublishedTemplate(template: unknown): PublishedTemplateOption | null {
    if (!template || typeof template !== 'object') {
      return null;
    }

    const record = template as Record<string, unknown>;
    const rawVersions = Array.isArray(record['versions'])
      ? record['versions']
      : Array.isArray(record['template_versions'])
        ? record['template_versions']
        : [];

    const publishedVersions = rawVersions
      .filter((version): version is Record<string, unknown> => !!version && typeof version === 'object')
      .filter((version) => String(version['state'] ?? '').toLowerCase() === 'published')
      .map((version) => Number(version['version_number']))
      .filter((version) => Number.isFinite(version) && version > 0)
      .sort((a, b) => b - a);

    if (publishedVersions.length === 0) {
      return null;
    }

    const id = record['id'];
    const name = record['name'];

    if (!id || !name) {
      return null;
    }

    return {
      id: String(id),
      name: String(name),
      versions: [...new Set(publishedVersions)],
    };
  }

  private normalizeContact(contact: unknown): ContactOption | null {
    if (!contact || typeof contact !== 'object') {
      return null;
    }

    const record = contact as Record<string, unknown>;
    const id = record['id'];
    const email = record['email'];

    if (!id || typeof email !== 'string' || email.trim().length === 0) {
      return null;
    }

    return {
      id: String(id),
      email,
      first_name: typeof record['first_name'] === 'string' ? record['first_name'] : null,
      last_name: typeof record['last_name'] === 'string' ? record['last_name'] : null,
    };
  }

  createCampaign(payload: CampaignCreatePayload): Observable<ApiEnvelope<CampaignRecord>> {
    return this.http.post<ApiEnvelope<CampaignRecord>>('/api/campaigns', payload);
  }

  dispatchCampaign(campaignId: string): Observable<ApiEnvelope<CampaignRecord>> {
    return this.http.post<ApiEnvelope<CampaignRecord>>(`/api/campaigns/${campaignId}/dispatch`, {});
  }

  getCampaignSummary(campaignId: string): Observable<ApiEnvelope<CampaignSummary>> {
    return this.http.get<ApiEnvelope<CampaignSummary>>(`/api/campaigns/${campaignId}/summary`);
  }

  listPublishedTemplates(): Observable<PublishedTemplateOption[]> {
    return this.http.get<ApiEnvelope<any[]>>('/api/templates').pipe(
      map((response) => {
        const templates = Array.isArray(response.data) ? response.data : [];
        return templates
          .map((template) => this.normalizePublishedTemplate(template))
          .filter((template): template is PublishedTemplateOption => template !== null);
      }),
    );
  }

  listContacts(): Observable<ContactOption[]> {
    return this.http.get<ApiEnvelope<unknown[]>>('/api/contacts').pipe(
      map((response) => {
        const contacts = Array.isArray(response.data) ? response.data : [];
        return contacts
          .map((contact) => this.normalizeContact(contact))
          .filter((contact): contact is ContactOption => contact !== null);
      }),
    );
  }

  rememberCampaign(id: string, name: string): void {
    const previous = this.getRememberedCampaigns().filter((campaign) => campaign.id !== id);
    const next: RememberedCampaign[] = [{ id, name, createdAt: new Date().toISOString() }, ...previous].slice(
      0,
      RECENT_CAMPAIGNS_LIMIT,
    );

    localStorage.setItem(RECENT_CAMPAIGNS_KEY, JSON.stringify(next));
  }

  getRememberedCampaigns(): RememberedCampaign[] {
    const raw = localStorage.getItem(RECENT_CAMPAIGNS_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter((item) => typeof item?.id === 'string' && typeof item?.name === 'string');
    } catch {
      return [];
    }
  }
}
