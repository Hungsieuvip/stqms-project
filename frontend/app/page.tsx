"use client";

import { useEffect, useState } from "react";
// 1. Sửa lại đường dẫn import sang dạng tương đối (../../)
import { dashboardService } from "../services/dashboardService"; 
// 2. Trỏ useAuth về đúng file AuthContext mới
import { useAuth } from "../contexts/AuthContext"; 
import { Activity, CheckCircle, FileText, Target, Clock, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchDashboard = async () => {
        try {
          // 3. Đổi tên hàm cho khớp với file service chúng ta đã tạo
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

  if (authLoading || isLoading) return <div className="p-10 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;

  // 4. Map đúng tên biến trả về từ Dashboard Adapter
  const kpis = dashboardData?.kpis || { totalCriteria: 0, totalEvidence: 0, totalTasks: 0, progress: 0 };
  const activities = dashboardData?.recentActivities || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Xin chào, {user?.full_name || user?.email} 👋</h1>
        <p className="text-slate-500 text-sm mt-1">Tổng quan trạng thái hệ thống chất lượng của bạn.</p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Tổng tiêu chí" value={kpis.totalCriteria} icon={Target} color="bg-blue-100 text-blue-600" />
        <KPICard title="Tổng minh chứng" value={kpis.totalEvidence} icon={FileText} color="bg-indigo-100 text-indigo-600" />
        <KPICard title="Công việc hoàn thành" value={kpis.totalTasks} icon={CheckCircle} color="bg-emerald-100 text-emerald-600" />
        <KPICard title="Tiến độ đánh giá" value={`${kpis.progress}%`} icon={Activity} color="bg-amber-100 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Placeholder cho Biểu đồ (Sẽ tích hợp Recharts sau) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[300px] flex flex-col justify-center items-center">
           <h3 className="text-lg font-semibold w-full text-left mb-auto">Biểu đồ Trạng thái</h3>
           <p className="text-slate-400">Khu vực hiển thị biểu đồ (Bar/Pie Chart)</p>
        </div>

        {/* Recent Activities */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Hoạt động gần đây</h3>
          {activities.length > 0 ? (
             <div className="space-y-4">
               {activities.map((act: any) => (
                 <div key={act.id} className="flex items-start space-x-3">
                   <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full shrink-0"></div>
                   <div>
                     <p className="text-sm font-medium text-slate-800">{act.user} <span className="font-normal text-slate-600">- {act.action}</span></p>
                     <p className="text-xs text-slate-400">{act.time}</p>
                   </div>
                 </div>
               ))}
             </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Clock className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Chưa có hoạt động nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}