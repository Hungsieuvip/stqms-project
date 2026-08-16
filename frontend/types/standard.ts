export interface Requirement {
  id: string;
  criteria_id: string;
  code: string;
  description: string;
  sequence_num: number;
  is_active: boolean;
}

export interface Criterion {
  id: string;
  standard_id: string;
  code: string;
  name: string;
  description?: string | null;
  sequence_num: number;
  is_active: boolean;
  requirements?: Requirement[];
}

export interface Standard {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  issued_date?: string | null;
  is_active: boolean;
  criteria?: Criterion[];
}