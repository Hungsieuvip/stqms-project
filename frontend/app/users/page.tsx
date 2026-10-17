'use client';

import React, { useEffect, useState } from 'react';
import { Search, Plus, Filter, Edit, Trash2, Shield, UserCheck, UserX, Users, Phone, Building } from 'lucide-react';
import { User, RoleInfo } from '../../types/user';
import { userService } from '../../services/userService';
import UserModal from '../../components/users/UserModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal & Toast states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteData, setDeleteData] = useState<{ isOpen: boolean; id: string | number; username?: string }>({
    isOpen: false,
    id: '',
  });
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  const showToast = (msg: string, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3500);
  };

  const fetchRoles = async () => {
    try {
      const res = await userService.getRoles();
      setRoles(res);
    } catch (e) {
      console.error('Lỗi tải roles:', e);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;

      const res = await userService.getUsers(params);
      setUsers(res.items || []);
    } catch (error) {
      console.error('Lỗi lấy danh sách user:', error);
      showToast('Không thể tải danh sách tài khoản từ máy chủ.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(handler);
  }, [search, roleFilter]);

  const handleDelete = async () => {
    try {
      await userService.deleteUser(deleteData.id);
      showToast('Đã xóa tài khoản thành công!');
      fetchUsers();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      showToast(typeof detail === 'string' ? detail : 'Xóa tài khoản thất bại!', 'error');
    } finally {
      setDeleteData({ isOpen: false, id: '' });
    }
  };

  const getRoleBadge = (roleName: string) => {
    const r = (roleName || '').toUpperCase();
    switch (r) {
      case 'ADMIN':
      case 'SYSTEM_ADMIN':
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold border border-purple-200">Quản trị viên</span>;
      case 'PRINCIPAL':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold border border-amber-200">Hiệu trưởng</span>;
      case 'SECRETARY':
        return <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold border border-indigo-200">Thư ký KĐ</span>;
      case 'STANDARD_LEAD':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold border border-blue-200">Trưởng tiêu chuẩn</span>;
      case 'TEACHER':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium border border-emerald-200">Giáo viên</span>;
      case 'REVIEWER':
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium border border-slate-200">ĐGN / Khách</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{roleName}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 px-5 py-3 rounded-xl shadow-xl z-50 text-white font-medium flex items-center gap-2 animate-bounce ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-blue-600" size={28} />
            Quản lý Người dùng & Phân quyền (RBAC)
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Trường Tiểu học Hợp Minh — Quản lý tài khoản hệ thống, phân công vai trò và kiểm soát quyền hạn.
          </p>
        </div>
        <button
          onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-sm font-medium transition"
        >
          <Plus size={20} /> Thêm tài khoản mới
        </button>
      </div>

      {/* Toolbar: Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm theo tên đăng nhập, họ tên, email hoặc số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative w-full sm:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Tất cả Vai trò</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name} ({r.description || r.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b text-xs font-semibold uppercase tracking-wider text-gray-500">
            <tr>
              <th className="p-4">Người dùng</th>
              <th className="p-4">Liên hệ</th>
              <th className="p-4">Vai trò (Role)</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4">Ngày tạo</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  Đang tải danh sách người dùng...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  <Users size={40} className="mx-auto mb-2 opacity-30" />
                  <p>Không tìm thấy tài khoản nào khớp với tiêu chí tìm kiếm.</p>
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/70 transition">
                  <td className="p-4">
                    <p className="font-semibold text-gray-900">
                      {u.full_name || u.username}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">@{u.username}</p>
                    {u.department_name && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                        <Building size={12} /> {u.department_name}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm">
                    <p className="text-gray-900">{u.email}</p>
                    {u.phone && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone size={11} /> {u.phone}
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    {u.roles && u.roles.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((rname) => (
                          <span key={rname}>{getRoleBadge(rname)}</span>
                        ))}
                      </div>
                    ) : (
                      getRoleBadge(u.role)
                    )}
                  </td>
                  <td className="p-4">
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <UserCheck size={14} /> Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-700 font-medium bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                        <UserX size={14} /> Tạm khóa
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-xs text-gray-500">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className="p-4 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => { setSelectedUser(u); setIsModalOpen(true); }}
                      title="Chỉnh sửa & Phân quyền"
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteData({ isOpen: true, id: u.id, username: u.username })}
                      title="Xóa tài khoản"
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => { fetchUsers(); showToast('Lưu thông tin tài khoản thành công!'); }}
        userToEdit={selectedUser}
      />
      <ConfirmDialog
        isOpen={deleteData.isOpen}
        title="Xác nhận xóa tài khoản"
        message={`Bạn có chắc chắn muốn xóa tài khoản "${deleteData.username || deleteData.id}" vĩnh viễn không? Hành động này không thể hoàn tác.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteData({ isOpen: false, id: '' })}
      />
    </div>
  );
}
