import React, { useState, useEffect } from 'react';
import { X, Shield, User as UserIcon, Mail, Lock, Phone, AlertCircle } from 'lucide-react';
import { User } from '../../types/user';
import { userService } from '../../services/userService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: User | null;
}

export const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Quản trị hệ thống (Admin)' },
  { value: 'PRINCIPAL', label: 'Hiệu trưởng / Chủ tịch HĐ' },
  { value: 'SECRETARY', label: 'Thư ký kiểm định' },
  { value: 'STANDARD_LEAD', label: 'Trưởng tiêu chuẩn' },
  { value: 'TEACHER', label: 'Giáo viên / Nhân viên' },
  { value: 'REVIEWER', label: 'Đánh giá ngoài / Khách' },
];

export default function UserModal({ isOpen, onClose, onSuccess, userToEdit }: Props) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('TEACHER');
  const [isActive, setIsActive] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setUsername(userToEdit.username || '');
      setFullName(userToEdit.full_name || '');
      setEmail(userToEdit.email || '');
      setPhone(userToEdit.phone || '');
      setRole((userToEdit.roles && userToEdit.roles[0]) || userToEdit.role?.toUpperCase() || 'TEACHER');
      setIsActive(userToEdit.is_active ?? true);
      setPassword('');
    } else {
      setUsername('');
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setRole('TEACHER');
      setIsActive(true);
    }
    setError('');
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (!userToEdit && (!username || !password))) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc (Tên đăng nhập, Email, Mật khẩu).');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload: any = {
        email,
        full_name: fullName,
        phone,
        roles: [role],
        is_active: isActive,
      };

      if (password) {
        payload.password = password;
      }

      if (userToEdit) {
        await userService.updateUser(userToEdit.id, payload);
      } else {
        payload.username = username;
        await userService.createUser(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Có lỗi xảy ra khi lưu người dùng, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="text-lg font-bold text-gray-900">
            {userToEdit ? 'Chỉnh sửa tài khoản & Phân quyền' : 'Thêm tài khoản người dùng mới'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên đăng nhập (Username) *
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={!!userToEdit}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="gv_nguyenvan"
                required={!userToEdit}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Nguyễn Văn A"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="vana@hopminh.edu.vn"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0912345678"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {userToEdit ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu khởi tạo *'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required={!userToEdit}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò hệ thống (Role) *</label>
              <div className="relative">
                <Shield className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái tài khoản</label>
              <div className="flex items-center h-10">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow transition disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : (userToEdit ? 'Lưu thay đổi' : 'Tạo tài khoản')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
