'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '../services/authService';

interface UserRole {
  id?: string;
  code?: string;
  name?: string;
}

interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  role: string;
  roles?: UserRole[] | string[];
  is_superuser?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, initialUser?: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractRole(userData: any): string {
  if (!userData) return 'viewer';
  if (userData.role && typeof userData.role === 'string') return userData.role.toLowerCase();
  if (userData.is_superuser) return 'admin';
  if (userData.roles && Array.isArray(userData.roles) && userData.roles.length > 0) {
    const r = userData.roles[0];
    const code = typeof r === 'string' ? r : (r.code || r.name || '');
    return code.toLowerCase();
  }
  return 'viewer';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      const userData = await authService.getMe();
      const role = extractRole(userData);
      setUser({ ...userData, role });
    } catch (error) {
      setUser(null);
      localStorage.removeItem('access_token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Bảo vệ Route (Protected Routes)
  useEffect(() => {
    if (!isLoading) {
      const isPublicRoute = pathname === '/login';
      if (!user && !isPublicRoute) {
        router.push('/login');
      } else if (user && isPublicRoute) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = (token: string, initialUser?: any) => {
    localStorage.setItem('access_token', token);
    if (initialUser) {
      const role = extractRole(initialUser);
      setUser({ ...initialUser, role });
    }
    fetchUser();
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {/* Trong lúc kiểm tra token lần đầu, hiện màn hình trắng hoặc loading nhỏ */}
      {isLoading ? <div className="min-h-screen flex items-center justify-center">Đang kiểm tra phiên đăng nhập...</div> : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
