"use client";

import { useEffect, useState } from "react";
// Lùi 2 cấp (../../) từ app/dashboard ra frontend/
import { dashboardService } from "../../services/dashboardService";
import { useAuth } from "../../contexts/AuthContext";
import { Activity, CheckCircle, FileText, Target, Clock, ArrowUpRight } from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchDashboard = async () => {
        try {
          const data = await dashboardService.getDashboardData();
          setDashboardData(data);
        } catch (error) {
          console.error("Failed to fetch dashboard data:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDashboard();
    }
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu tổng quan...</p>
      </div>
    );
  }

  const kpis = dashboardData?.kpis || { totalCriteria: 0, totalEvidence: 0, totalTasks: 0, progress: 0 };
  const activities = dashboardData?.recentActivities || [];

  return (
    <div className="space-y-6">
      {/* Header chào mừng */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Xin chào, {user?.full_name || user?.email} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Tổng quan trạng thái quản lý chất lượng và tiến độ kiểm định.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Tổng tiêu chí"
          value={kpis.totalCriteria}
          icon={Target}
          colorClass="bg-blue-50 text-blue-700 border-blue-100"
        />
        <KPICard
          title="Tổng minh chứng"
          value={kpis.totalEvidence}
          icon={FileText}
          colorClass="bg-indigo-50 text-indigo-700 border-indigo-100"
        />
        <KPICard
          title="Nhiệm vụ hoàn thành"
          value={kpis.totalTasks}
          icon={CheckCircle}
          colorClass="bg-emerald-50 text-emerald-700 border-emerald-100"
        />
        <KPICard
          title="Tiến độ đánh giá"
          value={`${kpis.progress}%`}
          icon={Activity}
          colorClass="bg-amber-50 text-amber-700 border-amber-100"
        />
      </div>

      {/* Charts & Recent Activities Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Placeholder biểu đồ */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[320px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-semibold text-slate-900">Biểu đồ Trạng thái Tiêu chuẩn</h3>
            <span className="text-xs text-slate-400 font-medium">Báo cáo thời gian thực</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
            <Activity className="w-10 h-10 stroke-[1.5] text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-500">Khu vực phân bố tiến độ (Recharts)</p>
            <p className="text-xs text-slate-400">Dữ liệu phân tích theo từng tiêu chí kiểm định</p>
          </div>
        </div>

        {/* Hoạt động gần đây */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-base font-semibold text-slate-900">Hoạt động gần đây</h3>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </div>

          {activities.length > 0 ? (
            <div className="space-y-4 flex-1">
              {activities.map((act: any) => (
                <div key={act.id} className="flex items-start space-x-3 text-sm">
                  <div className="w-2 h-2 mt-1.5 bg-blue-600 rounded-full shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 truncate">
                      {act.user}{" "}
                      <span className="font-normal text-slate-500">- {act.action}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 py-8 text-slate-400">
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
  icon: Icon,
  colorClass,
}: {
  title: string;
  value: string | number;
  icon: any;
  colorClass: string;
}) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg border ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}