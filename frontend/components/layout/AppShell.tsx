'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Layers, 
  FileCheck2, 
  ListTodo, 
  CheckSquare, 
  Users, 
  ScrollText, 
  LogOut, 
  Menu, 
  X,
  ShieldCheck
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Tiêu chuẩn & Tiêu chí', href: '/standards', icon: Layers },
  { label: 'Hồ sơ & Minh chứng', href: '/evidences', icon: FileCheck2 },
  { label: 'Nhiệm vụ & Kế hoạch', href: '/tasks', icon: ListTodo },
  { label: 'Đánh giá & Chấm điểm', href: '/evaluations', icon: CheckSquare },
  { label: 'Người dùng & Phân quyền', href: '/users', icon: Users, adminOnly: true },
  { label: 'Nhật ký hệ thống', href: '/system/logs', icon: ScrollText, adminOnly: true },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Không hiển thị Shell tại trang đăng nhập
  if (pathname === '/login') return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg">
              <ShieldCheck size={22} />
            </div>
            <div>
              <span className="font-bold text-white tracking-wide text-base">STQMS</span>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Hệ thống QLCL</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            if (item.adminOnly && user?.role !== 'admin') return null;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'}
                `}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-white shrink-0">
              {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.full_name || user?.email}</p>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider">{user?.role || 'Member'}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            title="Đăng xuất"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs text-slate-400">Không gian làm việc / </span>
              <span className="text-xs font-medium text-slate-700">Đại học & Quản trị Tiêu chuẩn</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}