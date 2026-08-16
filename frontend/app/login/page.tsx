'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Lock, User, ShieldCheck } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

const loginSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tài khoản/email'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: false }
  });

  const onSubmit = async (data: LoginForm) => {
    setErrorMsg('');
    try {
      const res = await authService.login(data.username, data.password);
      if (res.access_token) {
        login(res.access_token);
      }
    } catch (error: any) {
      setErrorMsg(error.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-blue-600">
          <ShieldCheck size={48} />
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900">STQMS</h2>
        <p className="mt-2 text-center text-sm text-gray-600">Hệ thống Quản lý Chất lượng Tiêu chuẩn</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100 text-center">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Tài khoản hoặc Email</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('username')}
                  className={`block w-full pl-10 px-3 py-2 border ${errors.username ? 'border-red-300' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="admin@stqms.vn"
                />
              </div>
              {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={`block w-full pl-10 pr-10 px-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input {...register('remember')} type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <label className="ml-2 block text-sm text-gray-900">Ghi nhớ đăng nhập</label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">Quên mật khẩu?</a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập hệ thống'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}