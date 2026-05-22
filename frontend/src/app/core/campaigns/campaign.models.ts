export interface ApiEnvelope<T> {
  data: T;
}

export interface CampaignCreatePayload {
  name: string;
  template_id: string;
  template_version_number: number;
  recipient_ids: string[];
}

export interface CampaignRecord {
  id: string;
  name: string;
  status: 'draft' | 'queued' | 'sending' | 'sent' | 'failed';
  template_id: string;
  template_version_id: string;
  recipient_count: number;
  dispatched_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignSummary extends CampaignRecord {
  pending_recipients_count: number;
  sent_recipients_count: number;
  failed_recipients_count: number;
}

export interface PublishedTemplateOption {
  id: string;
  name: string;
  versions: number[];
}

export interface ContactOption {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
}

export interface RememberedCampaign {
  id: string;
  name: string;
  createdAt: string;
}
