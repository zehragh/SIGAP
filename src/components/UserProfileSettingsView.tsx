import React, { useState } from 'react';
import { User } from '../types';
import { UserCheck, ShieldCheck, Key, User as UserIcon, Mail, Phone, Lock, Save, CheckCircle2, Building2 } from 'lucide-react';

interface UserProfileSettingsViewProps {
  currentUser: User | null;
  onChangePassword: (userId: string, newPass: string, currentPass?: string, isSelf?: boolean) => Promise<void>;
  onUpdateProfile?: (userId: string, data: Partial<User>) => Promise<void>;
}

export const UserProfileSettingsView: React.FC<UserProfileSettingsViewProps> = ({
  currentUser,
  onChangePassword,
  onUpdateProfile
}) => {
  const [nama, setNama] = useState(currentUser?.nama || '');
  const [nip, setNip] = useState(currentUser?.nip || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [noHp, setNoHp] = useState(currentUser?.no_hp || '');

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!currentUser) return null;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama) {
      setMessage({ text: 'Nama lengkap wajib diisi!', type: 'error' });
      return;
    }
    try {
      setIsUpdatingProfile(true);
      setMessage(null);
      if (onUpdateProfile) {
        await onUpdateProfile(currentUser.id, {
          nama,
          nip,
          email,
          no_hp: noHp
        });
      } else {
        // Fallback fetch put
        const res = await fetch(`/api/users/${currentUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nama, nip, email, no_hp: noHp, role: currentUser.role, kelurahan_id: currentUser.kelurahan_id })
        });
        if (!res.ok) throw new Error('Gagal memperbarui profil');
      }
      setMessage({ text: 'Profil akun berhasil diperbarui!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Gagal memperbarui profil', type: 'error' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass) {
      setMessage({ text: 'Masukkan kata sandi saat ini!', type: 'error' });
      return;
    }
    if (!newPass || newPass.length < 4) {
      setMessage({ text: 'Kata sandi baru minimal 4 karakter!', type: 'error' });
      return;
    }
    if (newPass !== confirmPass) {
      setMessage({ text: 'Konfirmasi kata sandi baru tidak cocok!', type: 'error' });
      return;
    }

    try {
      setIsChangingPass(true);
      setMessage(null);
      await onChangePassword(currentUser.id, newPass, currentPass, true);
      setMessage({ text: 'Kata sandi Anda berhasil diubah!', type: 'success' });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err: any) {
      setMessage({ text: err.message || 'Gagal mengubah kata sandi', type: 'error' });
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Banner Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-md">
            {currentUser.nama.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-800">{currentUser.nama}</h2>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                currentUser.role === 'Admin Kantor Pertanahan'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : currentUser.role === 'Operator Kantor Pertanahan'
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Username: @{currentUser.username} {currentUser.nip && `| NIP: ${currentUser.nip}`}
            </p>
            {currentUser.kelurahan_nama && (
              <p className="text-xs text-blue-600 font-semibold mt-1 flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>Wilayah Tugas: Kelurahan {currentUser.kelurahan_nama}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-xs font-bold flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Form 1: Profil Akun */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-slate-800">
            <UserIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm">Lengkapi Profil Akun</h3>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NIP / NIK</label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="NIP Pegawai atau NIK"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@atrbpn.go.id"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor HP / WhatsApp</label>
              <input
                type="text"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="081234567890"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isUpdatingProfile ? 'Simpan...' : 'Simpan Perubahan Profil'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Form 2: Ganti Kata Sandi */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-slate-800">
            <Lock className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm">Ubah Kata Sandi</h3>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi Saat Ini *</label>
              <input
                type="password"
                required
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="Masukkan kata sandi lama"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi Baru *</label>
              <input
                type="password"
                required
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Minimal 4 karakter"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Konfirmasi Kata Sandi Baru *</label>
              <input
                type="password"
                required
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Ketik ulang kata sandi baru"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isChangingPass}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Key className="w-4 h-4" />
                <span>{isChangingPass ? 'Memproses...' : 'Perbarui Kata Sandi'}</span>
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
};
