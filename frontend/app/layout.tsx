import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import AppShell from '../components/layout/AppShell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'STQMS - Hệ thống Quản lý Chất lượng',
  description: 'Phần mềm quản lý tiêu chuẩn và minh chứng',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full">
      <body className={`${inter.className} h-full antialiased text-slate-900 bg-slate-50`}>
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}