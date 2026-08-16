"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, ShieldCheck, FileText, CalendarDays, 
  Users, Briefcase, BarChart3, Bell, Settings 
} from "lucide-react";

const menuGroups = [
  {
    title: "Chung",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ]
  },
  {
    title: "Chuyên môn",
    items: [
      { name: "Đánh giá chất lượng", icon: ShieldCheck, 
        subItems: [
          { name: "Bộ tiêu chuẩn", href: "/standards" },
          { name: "Tiêu chí", href: "/criteria" },
          { name: "Yêu cầu", href: "/requirements" },
          { name: "Kết quả đánh giá", href: "/evaluations" },
        ] 
      },
      { name: "Hồ sơ & Minh chứng", icon: FileText, 
        subItems: [
          { name: "Tất cả hồ sơ", href: "/evidences/all" },
          { name: "Minh chứng", href: "/evidences" },
          { name: "Hồ sơ cần bổ sung", href: "/evidences/needs-revision" },
          { name: "Hồ sơ đã phê duyệt", href: "/evidences/approved" },
          { name: "Tra cứu", href: "/evidences/search" },
        ] 
      },
    ]
  },
  {
    title: "Quản lý",
    items: [
      { name: "Kế hoạch", icon: CalendarDays, 
        subItems: [
          { name: "Kế hoạch đào tạo", href: "/plans/training" },
          { name: "Kế hoạch năm học", href: "/plans/academic-year" },
          { name: "Tiến độ", href: "/plans/progress" },
        ] 
      },
      { name: "Nhân sự", icon: Users, 
        subItems: [
          { name: "Cán bộ quản lý", href: "/personnel/managers" },
          { name: "Giáo viên", href: "/personnel/teachers" },
          { name: "Nhân viên", href: "/personnel/staff" },
          { name: "Phân công", href: "/personnel/assignments" },
        ] 
      },
      { name: "Nhiệm vụ", icon: Briefcase, 
        subItems: [
          { name: "Nhiệm vụ của tôi", href: "/tasks/my-tasks" },
          { name: "Nhiệm vụ được giao", href: "/tasks/assigned" },
          { name: "Theo dõi tiến độ", href: "/tasks/tracking" },
        ] 
      },
    ]
  },
  {
    title: "Hệ thống",
    items: [
      { name: "Báo cáo", icon: BarChart3, 
        subItems: [
          { name: "Báo cáo tổng hợp", href: "/reports/overview" },
          { name: "Báo cáo tiêu chí", href: "/reports/criteria" },
          { name: "Báo cáo minh chứng", href: "/reports/evidence" },
          { name: "Xuất báo cáo", href: "/reports/export" },
        ] 
      },
      { name: "Thông báo", href: "/notifications", icon: Bell },
      { name: "Quản trị", icon: Settings, 
        subItems: [
          { name: "Người dùng", href: "/admin/users" },
          { name: "Vai trò", href: "/admin/roles" },
          { name: "Phân quyền", href: "/admin/permissions" },
          { name: "Nhật ký hệ thống", href: "/admin/audit-logs" },
        ] 
      },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full shrink-0">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 bg-slate-950/50 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center mr-3 font-bold text-white">
          ST
        </div>
        <span className="text-white font-semibold tracking-wide text-lg">STQMS</span>
      </div>

      {/* Menu Area */}
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="mb-6">
            <h3 className="px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {group.title}
            </h3>
            <ul className="space-y-1">
              {group.items.map((item, itemIdx) => (
                <li key={itemIdx}>
                  {item.href ? (
                    <Link href={item.href} 
                      className={`flex items-center px-6 py-2.5 text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors ${pathname === item.href ? 'bg-slate-800 text-blue-400 border-r-2 border-blue-500' : ''}`}
                    >
                      <item.icon className="w-4 h-4 mr-3" />
                      {item.name}
                    </Link>
                  ) : (
                    <div className="group">
                      <div className="flex items-center px-6 py-2.5 text-sm font-medium text-slate-400 cursor-default">
                        <item.icon className="w-4 h-4 mr-3" />
                        {item.name}
                      </div>
                      <ul className="pl-12 space-y-1 py-1 hidden group-hover:block">
                        {item.subItems?.map((subItem, subIdx) => (
                          <li key={subIdx}>
                            <Link href={subItem.href}
                              className={`block py-1.5 text-sm hover:text-white transition-colors ${pathname === subItem.href ? 'text-blue-400' : 'text-slate-400'}`}
                            >
                              {subItem.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}