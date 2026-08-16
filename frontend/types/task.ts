export interface Plan {
  id: string;
  title: string;
  progress: number; // 0 - 100%
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  plan_id: string;
  plan_title: string;
  assignee_id: string;
  assignee_name: string; // Tên người được phân công
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  deadline: string;
  attachment_url?: string;
  attachment_name?: string;
}

export interface TaskListResponse {
  items: Task[];
  total: number;
  page: number;
  size: number;
}