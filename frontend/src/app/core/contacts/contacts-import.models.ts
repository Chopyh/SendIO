export interface ContactsImportRowDiagnostic {
  row: number;
  email: string;
  reason: string;
}

export interface ContactsImportSummary {
  processed: number;
  skipped: number;
  failed: number;
  details: {
    skipped: ContactsImportRowDiagnostic[];
    failed: ContactsImportRowDiagnostic[];
  };
}

export interface ContactsImportResponse {
  data: {
    summary: ContactsImportSummary;
  };
}

export interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, string[]>;
  };
}
