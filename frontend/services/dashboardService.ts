import { apiClient } from '../lib/apiClient';

export interface StandardProgress {
  id: string;
  code: string;
  name: string;
  total_criteria: number;
  passed_criteria: number;
  completion_rate: number;
  evidence_count: number;
}

export interface DashboardKPIs {
  totalStandards: number;
  totalCriteria: number;
  totalEvidence: number;
  approvedEvidence: number;
  passedCriteria: number;
  totalTasks: number;
  progress: number;
}

export interface RecentActivity {
  id: string | number;
  user: string;
  action: string;
  table: string;
  time: string;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  standardsProgress: StandardProgress[];
  recentActivities: RecentActivity[];
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'đã tạo mới dữ liệu',
  UPDATE: 'đã cập nhật thông tin',
  DELETE: 'đã xóa bản ghi',
  UPLOAD: 'đã tải lên minh chứng',
  ASSIGN_USER: 'đã phân công phụ trách',
  WORKFLOW_SUBMITTED: 'đã nộp minh chứng chờ duyệt',
  WORKFLOW_APPROVED: 'đã phê duyệt chính thức minh chứng',
  WORKFLOW_NEEDS_REVISION: 'đã yêu cầu chỉnh sửa minh chứng',
  WORKFLOW_REJECTED: 'đã từ chối minh chứng',
  EVALUATE_PASS: 'đã đánh giá ĐẠT tiêu chí',
  EVALUATE_FAIL: 'đã đánh giá CHƯA ĐẠT tiêu chí',
};

const TABLE_LABELS: Record<string, string> = {
  standards: 'Tiêu chuẩn',
  criteria: 'Tiêu chí',
  evidences: 'Minh chứng',
  evaluations: 'Đợt đánh giá',
  users: 'Người dùng',
  academic_years: 'Năm học',
};

export const dashboardService = {
  getDashboardData: async (): Promise<DashboardData> => {
    try {
      const response = await apiClient.get('/dashboard/overview');
      const d = response.data;
      const k = d?.kpis || {};
      
      const standardsProgress: StandardProgress[] = (d?.standards_progress || []).map((sp: any) => ({
        id: sp.id,
        code: sp.code,
        name: sp.name,
        total_criteria: sp.total_criteria ?? 0,
        passed_criteria: sp.passed_criteria ?? 0,
        completion_rate: sp.completion_rate ?? 0,
        evidence_count: sp.evidence_count ?? 0,
      }));

      const recentActivities: RecentActivity[] = (d?.recent_activities || []).map((a: any) => {
        const actionVerb = ACTION_LABELS[a.action] || a.action || 'đã thao tác dữ liệu';
        const tableLabel = TABLE_LABELS[a.table_name] || a.table_name || '';
        return {
          id: a.id,
          user: a.user_name || 'Hệ thống',
          action: tableLabel ? `${actionVerb} (${tableLabel})` : actionVerb,
          table: a.table_name,
          time: a.timestamp 
            ? new Date(a.timestamp).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) 
            : 'Vừa xong',
        };
      });

      return {
        kpis: {
          totalStandards: k.total_standards ?? standardsProgress.length ?? 0,
          totalCriteria: k.total_criteria ?? 0,
          totalEvidence: k.total_evidence ?? 0,
          approvedEvidence: k.approved_evidence ?? 0,
          passedCriteria: k.passed_criteria ?? 0,
          totalTasks: k.total_tasks ?? 0,
          progress: k.overall_completion_percentage ?? 0,
        },
        standardsProgress,
        recentActivities,
      };
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu tổng quan thực tế từ API:', error);
      // KHÔNG trả về số liệu giả (48, 132, 16, 68%) mà trả về dữ liệu rỗng chuẩn xác
      return {
        kpis: {
          totalStandards: 0,
          totalCriteria: 0,
          totalEvidence: 0,
          approvedEvidence: 0,
          passedCriteria: 0,
          totalTasks: 0,
          progress: 0,
        },
        standardsProgress: [],
        recentActivities: [],
      };
    }
  },

  getReportSummary: async () => {
    const res = await apiClient.get('/dashboard/reports/summary');
    return res.data;
  },

  openReportHtml: () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    window.open(`${apiUrl}/dashboard/reports/export?format=html`, '_blank');
  },

  downloadReportCsv: () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    window.open(`${apiUrl}/dashboard/reports/export?format=csv`, '_blank');
  }
};
