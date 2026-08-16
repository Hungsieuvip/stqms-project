export interface Evidence {
  id: string;
  title: string;
  description?: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; // Workflow states
  created_at: string;
  uploader_name: string;
}

export interface EvidenceListResponse {
  items: Evidence[];
  total: number;
  page: number;
  size: number;
}