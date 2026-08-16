export interface Evaluation {
  id: string;
  criterion_id: string;
  criterion_name: string;
  plan_id: string;
  score: number;
  comments: string;
  evaluator_name: string;
  status: 'DRAFT' | 'FINALIZED';
  updated_at: string;
}