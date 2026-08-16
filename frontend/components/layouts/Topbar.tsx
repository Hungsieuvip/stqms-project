import { Bell, Search, UserCircle } from "lucide-react";

export default function Topbar() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
      {/* Search bar */}
      <div className="flex items-center bg-slate-100 px-3 py-2 rounded-md w-96">
        <Search className="w-4 h-4 text-slate-400 mr-2" />
        <input 
          type="text" 
          placeholder="Tìm kiếm..." 
          className="bg-transparent border-none outline-none text-sm w-full text-slate-700"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-slate-100 relative text-slate-500">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        <div className="flex items-center space-x-2 cursor-pointer p-1.5 hover:bg-slate-50 rounded-md">
          <UserCircle className="w-8 h-8 text-slate-400" />
          <div className="hidden md:block text-sm">
            <p className="font-medium text-slate-700">Admin User</p>
            <p className="text-xs text-slate-500">Quản trị viên</p>
          </div>
        </div>
      </div>
    </header>
  );
}