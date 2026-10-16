export interface Requirement {
  id: string;
  criteria_id: string;
  code: string;
  description: string;
  sequence_num: number;
  sequence?: number;
  is_active: boolean;
  status?: string;
}

export interface Criterion {
  id: string;
  standard_id: string;
  code: string;
  name: string;
  description?: string | null;
  sequence_num: number;
  sequence?: number;
  is_active: boolean;
  status?: string;
  requirements?: Requirement[];
}

export interface Standard {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  issued_date?: string | null;
  sequence?: number;
  sequence_num?: number;
  is_active: boolean;
  status?: string;
  criteria?: Criterion[];
}
