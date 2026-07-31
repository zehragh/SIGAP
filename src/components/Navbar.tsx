import React, { useState } from 'react';
import { User } from '../types';
import { ShieldCheck, UserCheck, Bell, ChevronDown, CheckCircle2, Building2, LogIn, LogOut, Lock, X } from 'lucide-react';
import { loginUser } from '../services/api';

interface NavbarProps {
  currentUser: User | null;
  allUsers: User[];
  onLoginSuccess: (user: User) => void;
  onLogout: () => void;
  pendingApprovalCount: number;
  onNavigateApproval: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onLoginSuccess,
  onLogout,
  pendingApprovalCount,
  onNavigateApproval
}) => {
  const isAdmin = currentUser?.role === 'Admin Kantor Pertanahan';

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenLoginModal = (presetUsername?: string) => {
    setUsernameInput(presetUsername || '');
    setPasswordInput('');
    setLoginError(null);
    setIsLoginModalOpen(true);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) {
      setLoginError('Username dan password wajib diisi!');
      return;
    }

    try {
      setIsSubmitting(true);
      setLoginError(null);
      const user = await loginUser(usernameInput, passwordInput);
      onLoginSuccess(user);
      setIsLoginModalOpen(false);
    } catch (err: any) {
      setLoginError(err.message || 'Gagal masuk. Periksa username dan password Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <header className="bg-white text-slate-800 sticky top-0 z-40 border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">SIGAP</span>
                <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded font-bold border border-blue-200">
                  PAREPARE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Sistem Informasi Pengaduan Pertanahan — Kantor Pertanahan Kota Parepare
              </p>
            </div>
          </div>

          {/* Right Controls & User Role Switcher */}
          <div className="flex items-center space-x-3">
            
            {/* Server Online Status Badge */}
            <div className="hidden lg:flex items-center space-x-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span>Server Online</span>
            </div>

            {/* Approval Notification Pill */}
            {isAdmin && (
              <button
                onClick={onNavigateApproval}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pendingApprovalCount > 0
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm animate-pulse'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
                title="Antrean Approval Pengaduan"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Approval</span>
                {pendingApprovalCount > 0 && (
                  <span className="bg-red-600 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                    {pendingApprovalCount}
                  </span>
                )}
              </button>
            )}

            {/* Role Switcher / Login Account Menu */}
            {currentUser ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 text-xs transition">
                  {isAdmin ? (
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  ) : (
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                  )}
                  <div className="text-left">
                    <p className="font-bold text-slate-800 leading-none">{currentUser.nama}</p>
                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                      {currentUser.role} {currentUser.kelurahan_nama ? `(${currentUser.kelurahan_nama})` : ''}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* User Selector & Login Menu Dropdown */}
                <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 hidden group-hover:block z-50">
                  <div className="px-3 py-1 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Akun Aktif: {currentUser.username}
                  </div>

                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleOpenLoginModal(u.username)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                        u.id === currentUser.id ? 'bg-blue-50 font-bold text-blue-600' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{u.nama}</p>
                        <p className="text-[10px] text-slate-500">
                          @{u.username} • {u.role}
                        </p>
                      </div>
                      {u.id === currentUser.id ? (
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                  ))}

                  <div className="border-t border-slate-100 mt-1 pt-1 px-2 space-y-1">
                    <button
                      onClick={() => handleOpenLoginModal()}
                      className="w-full text-left px-2 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg flex items-center space-x-2 transition"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Ganti Akun / Login</span>
                    </button>

                    <button
                      onClick={onLogout}
                      className="w-full text-left px-2 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-2 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-lg border border-slate-200 font-semibold hidden sm:inline">
                  Tamu / Publik
                </span>
                <button
                  onClick={() => handleOpenLoginModal()}
                  className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk / Login Petugas</span>
                </button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Masuk Sistem SIGAP</h3>
              </div>
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="p-5 space-y-4">
              
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="e.g. admin"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Memeriksa...' : 'Masuk'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </header>
  );
};

