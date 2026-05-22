export interface ContactsApiEnvelope<T> {
  data: T;
}

export interface WorkspaceContact {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
}
