import { ReactNode } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import Topbar from "@/components/layouts/Topbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Sidebar - Cố định bên trái */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        
        {/* Vùng chứa nội dung trang */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}