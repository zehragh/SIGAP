import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  BarChart3, 
  Database, 
  Users, 
  History, 
  Settings, 
  Code2,
  PlusCircle 
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  pendingApprovalCount: number;
  onOpenNewForm: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  pendingApprovalCount,
  onOpenNewForm
}) => {
  const role = currentUser?.role || 'Operator Kelurahan';
  const isAdmin = role === 'Admin Kantor Pertanahan';
  const isOperatorKantah = role === 'Operator Kantor Pertanahan';
  const isOutsideKantah = role === 'Operator Kelurahan';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pengaduan', label: 'Daftar Pengaduan', icon: FileText },
    ...(!isOutsideKantah ? [{ id: 'approval', label: 'Approval', icon: CheckSquare, badge: pendingApprovalCount }] : []),
    ...(!isOutsideKantah ? [{ id: 'laporan', label: 'Laporan', icon: BarChart3 }] : []),
    ...(!isOutsideKantah ? [{ id: 'master', label: 'Master Data', icon: Database }] : []),
    ...(isAdmin ? [{ id: 'pengguna', label: 'Pengguna', icon: Users }] : []),
    ...(!isOutsideKantah ? [{ id: 'logs', label: 'Log Aktivitas', icon: History }] : []),
    ...(isAdmin ? [{ id: 'apps_script', label: 'Integrasi Apps Script', icon: Code2 }] : []),
    { id: 'profile', label: 'Pengaturan Akun', icon: Settings }
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-700/80 shrink-0 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-6">
        
        {/* Quick Action Button */}
        <button
          onClick={onOpenNewForm}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-all transform active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Input Pengaduan</span>
        </button>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Navigation Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role Footer Info */}
      <div className="mt-8 pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
        <p className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Kantor Pertanahan Parepare</p>
        <p className="text-[10px] text-slate-400 font-medium">{currentUser?.nama || 'Pengguna'}</p>
        <span className="inline-block text-[9px] bg-slate-800 text-blue-400 px-2 py-0.5 rounded font-mono border border-slate-700">
          {role}
        </span>
      </div>
    </aside>
  );
};
