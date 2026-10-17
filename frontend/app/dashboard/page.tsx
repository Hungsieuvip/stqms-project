"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { dashboardService, DashboardData } from "../../services/dashboardService";
import { useAuth } from "../../contexts/AuthContext";
import { 
  Activity, CheckCircle, FileText, Target, Clock, 
  ArrowUpRight, Award, RefreshCw, Printer, FileDown, Layers
} from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboard();
    }
  }, [user, fetchDashboard]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboard();
  };

  if (authLoading || (isLoading && !dashboardData)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        <p className="text-sm text-slate-500 font-medium">Đang đồng bộ dữ liệu thời gian thực từ cơ sở dữ liệu...</p>
      </div>
    );
  }

  const kpis = dashboardData?.kpis || {
    totalStandards: 0,
    totalCriteria: 0,
    totalEvidence: 0,
    approvedEvidence: 0,
    passedCriteria: 0,
    totalTasks: 0,
    progress: 0
  };
  const standardsProgress = dashboardData?.standardsProgress || [];
  const activities = dashboardData?.recentActivities || [];

  return (
    <div className="space-y-6">
      {/* Header chào mừng & Nút tác vụ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Xin chào, {user?.full_name || user?.username || user?.email} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            <strong>Trường Tiểu học Hợp Minh</strong> — Dữ liệu thời gian thực đồng bộ từ Cơ sở dữ liệu Kiểm định chất lượng giáo dục (Thông tư 17/2018/TT-BGDĐT).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-medium transition cursor-pointer shadow-xs disabled:opacity-50"
            title="Đồng bộ lại dữ liệu mới nhất từ CSDL"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin text-blue-600" : ""} />
            <span>{isRefreshing ? "Đang đồng bộ..." : "Làm mới"}</span>
          </button>
          <button
            onClick={() => dashboardService.openReportHtml()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-semibold transition cursor-pointer"
            title="Xem & In Báo cáo Tự đánh giá chuẩn Thông tư 17"
          >
            <Printer size={15} />
            <span>In Báo cáo TĐG</span>
          </button>
          <button
            onClick={() => dashboardService.downloadReportCsv()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-semibold transition cursor-pointer"
            title="Tải bảng tiêu chuẩn & tiêu chí dạng CSV / Excel"
          >
            <FileDown size={15} />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Thẻ KPI Thực Tế */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Tổng tiêu chuẩn"
          value={kpis.totalStandards}
          subtext="Tiêu chuẩn kiểm định trong CSDL"
          icon={Award}
          colorClass="bg-blue-50 text-blue-700 border-blue-100"
          linkHref="/standards"
        />
        <KPICard
          title="Tổng tiêu chí"
          value={kpis.totalCriteria}
          subtext={kpis.passedCriteria > 0 ? `${kpis.passedCriteria} tiêu chí đã đạt chuẩn` : "Chưa có tiêu chí đánh giá đạt"}
          icon={Target}
          colorClass="bg-violet-50 text-violet-700 border-violet-100"
          linkHref="/criteria"
        />
        <KPICard
          title="Hồ sơ minh chứng"
          value={kpis.totalEvidence}
          subtext={kpis.approvedEvidence > 0 ? `${kpis.approvedEvidence} minh chứng đã duyệt chính thức` : "Chưa có minh chứng phê duyệt"}
          icon={FileText}
          colorClass="bg-indigo-50 text-indigo-700 border-indigo-100"
          linkHref="/evidences"
        />
        <KPICard
          title="Tiến độ đánh giá"
          value={`${kpis.progress}%`}
          subtext={`${kpis.passedCriteria}/${kpis.totalCriteria} tiêu chí đạt chuẩn`}
          icon={Activity}
          colorClass="bg-amber-50 text-amber-700 border-amber-100"
          linkHref="/evaluations"
        />
      </div>

      {/* Phần Tiến Độ Tiêu Chuẩn Thực Tế & Hoạt Động Gần Đây */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột Trái: Bảng phân tích Tiến độ từng Tiêu chuẩn */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Layers className="text-blue-600" size={18} />
                Tiến độ Hoàn thiện theo từng Tiêu chuẩn
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Dữ liệu tính toán trực tiếp từ các tiêu chí và minh chứng thuộc từng tiêu chuẩn</p>
            </div>
            <Link href="/standards" className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
              Xem tất cả <ArrowUpRight size={14} />
            </Link>
          </div>

          {standardsProgress.length > 0 ? (
            <div className="space-y-4">
              {standardsProgress.map((sp) => {
                const isCompleted = sp.completion_rate >= 100 && sp.total_criteria > 0;
                return (
                  <div key={sp.id} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                            {sp.code}
                          </span>
                          <h4 className="font-semibold text-sm text-slate-800 truncate" title={sp.name}>
                            {sp.name}
                          </h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-500">
                          {sp.evidence_count} minh chứng
                        </span>
                        <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {sp.passed_criteria}/{sp.total_criteria} tiêu chí ({sp.completion_rate}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? "bg-emerald-500" : sp.completion_rate > 0 ? "bg-blue-600" : "bg-slate-300"
                        }`}
                        style={{ width: `${Math.min(sp.completion_rate, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Layers className="w-10 h-10 stroke-[1.5] text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-500">Chưa có tiêu chuẩn nào trong hệ thống</p>
              <Link href="/standards" className="text-xs text-blue-600 hover:underline mt-2">
                + Thêm mới tiêu chuẩn ngay
              </Link>
            </div>
          )}
        </div>

        {/* Cột Phải: Hoạt động gần đây (Thực tế từ Audit Logs) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Hoạt động gần đây</h3>
              <p className="text-xs text-slate-400 mt-0.5">Nhật ký kiểm toán thời gian thực</p>
            </div>
            <Link href="/system/logs" className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
              Chi tiết <ArrowUpRight size={14} />
            </Link>
          </div>

          {activities.length > 0 ? (
            <div className="space-y-4 flex-1">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start space-x-3 text-sm">
                  <div className="w-2 h-2 mt-1.5 bg-blue-600 rounded-full shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 truncate">
                      {act.user}{" "}
                      <span className="font-normal text-slate-500">{act.action}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 py-12 text-slate-400">
              <Clock className="w-8 h-8 mb-2 stroke-[1.5] text-slate-300" />
              <p className="text-sm">Chưa có hoạt động nào được ghi nhận</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  subtext,
  icon: Icon,
  colorClass,
  linkHref,
}: {
  title: string;
  value: string | number;
  subtext?: string;
  icon: any;
  colorClass: string;
  linkHref?: string;
}) {
  const content = (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300 transition group">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        {subtext && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg border ${colorClass} group-hover:scale-105 transition-transform`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );

  if (linkHref) {
    return <Link href={linkHref}>{content}</Link>;
  }
  return content;
}
