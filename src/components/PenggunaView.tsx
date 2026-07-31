import React, { useState } from 'react';
import { User, KelurahanMaster, Role } from '../types';
import { Users, ShieldCheck, UserCheck, Key, Plus, Trash2, X, Lock, CheckCircle2, ShieldAlert } from 'lucide-react';

interface PenggunaViewProps {
  users: User[];
  currentUser: User | null;
  kelurahanList: KelurahanMaster[];
  onCreateUser: (payload: any) => Promise<void>;
  onChangePassword: (userId: string, newPass: string, currentPass?: string, isSelf?: boolean) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onToggleStatus?: (user: User) => Promise<void>;
}

export const PenggunaView: React.FC<PenggunaViewProps> = ({
  users,
  currentUser,
  kelurahanList,
  onCreateUser,
  onChangePassword,
  onDeleteUser,
  onToggleStatus
}) => {
  const isAdmin = currentUser?.role === 'Admin Kantor Pertanahan';

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUserForPass, setSelectedUserForPass] = useState<User | null>(null);

  // Form States - Add User
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newNip, setNewNip] = useState('');
  const [newRole, setNewRole] = useState<Role>('Operator Kelurahan');
  const [newKelurahanId, setNewKelurahanId] = useState(kelurahanList[0]?.id || '');
  const [newEmail, setNewEmail] = useState('');
  const [newNoHp, setNewNoHp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form States - Change Password
  const [targetNewPass, setTargetNewPass] = useState('');
  const [currentSelfPass, setCurrentSelfPass] = useState('');

  const handleOpenAddModal = () => {
    setNewUsername('');
    setNewPassword('');
    setNewNama('');
    setNewNip('');
    setNewRole('Operator Kelurahan');
    setNewKelurahanId(kelurahanList[0]?.id || '');
    setNewEmail('');
    setNewNoHp('');
    setErrorMessage(null);
    setIsAddModalOpen(true);
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newNama) {
      setErrorMessage('Username, password, dan nama lengkap wajib diisi!');
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onCreateUser({
        username: newUsername,
        password: newPassword,
        nama: newNama,
        nip: newNip,
        role: newRole,
        kelurahan_id: newRole === 'Operator Kelurahan' ? newKelurahanId : undefined,
        email: newEmail,
        no_hp: newNoHp
      });
      setIsAddModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menambahkan pengguna baru');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPasswordModal = (user: User) => {
    setSelectedUserForPass(user);
    setTargetNewPass('');
    setCurrentSelfPass('');
    setErrorMessage(null);
    setIsPasswordModalOpen(true);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPass) return;
    if (!targetNewPass || targetNewPass.length < 4) {
      setErrorMessage('Password baru minimal 4 karakter!');
      return;
    }
    const isSelf = selectedUserForPass.id === currentUser?.id;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onChangePassword(selectedUserForPass.id, targetNewPass, currentSelfPass, isSelf);
      setIsPasswordModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengubah password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white border border-amber-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm my-12">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">AKSES DIBATASI</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Halaman Pengelolaan Hak Akses & Pengguna hanya dapat diakses oleh akun <strong>Admin Kantor Pertanahan</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">PENGELOLAAN HAK AKSES & PENGGUNA</h2>
            <p className="text-xs text-slate-500">
              Kelola akun pengguna, hak akses admin, operator kelurahan, dan kata sandi
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Username</th>
                <th className="py-2.5 px-3">Nama Lengkap & NIP</th>
                <th className="py-2.5 px-3">Peran / Hak Akses</th>
                <th className="py-2.5 px-3">Wilayah Kelurahan</th>
                <th className="py-2.5 px-3">Email & Kontak</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 font-mono font-bold text-blue-600">{u.username}</td>
                  <td className="py-3 px-3">
                    <strong className="block text-slate-800 font-bold">{u.nama}</strong>
                    <span className="text-[10px] text-slate-500 font-mono">NIP: {u.nip || '-'}</span>
                  </td>
                  <td className="py-3 px-3">
                    {u.role === 'Admin Kantor Pertanahan' ? (
                      <span className="inline-flex items-center space-x-1 bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Admin Kantah</span>
                      </span>
                    ) : u.role === 'Operator Kantor Pertanahan' ? (
                      <span className="inline-flex items-center space-x-1 bg-indigo-50 text-indigo-600 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <UserCheck className="w-3 h-3" />
                        <span>Operator Kantah</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <UserCheck className="w-3 h-3" />
                        <span>Operator Wilayah</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-700">
                    {u.kelurahan_nama ? `Kel. ${u.kelurahan_nama}` : 'Seluruh Kota Parepare'}
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    <div>{u.email}</div>
                    <div className="text-[10px] text-slate-400">{u.no_hp}</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      u.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      {u.is_active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-1">
                    <button
                      onClick={() => handleOpenPasswordModal(u)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                      title="Ubah Kata Sandi"
                    >
                      <Key className="w-3.5 h-3.5" />
                    </button>

                    {u.username !== 'admin' && (
                      <button
                        onClick={() => onDeleteUser(u.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                        title="Hapus Pengguna"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Tambah Pengguna Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Tambah Pengguna Baru</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="p-5 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. op.lumpue"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ketik kata sandi"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  placeholder="e.g. Nama Petugas / Pejabat"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NIP (Opsional)</label>
                <input
                  type="text"
                  value={newNip}
                  onChange={(e) => setNewNip(e.target.value)}
                  placeholder="e.g. 198504122008011002"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Peran / Hak Akses *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="Operator Kelurahan">Operator Kelurahan / Wilayah</option>
                  <option value="Operator Kantor Pertanahan">Operator Kantor Pertanahan (Kantah)</option>
                  <option value="Admin Kantor Pertanahan">Admin Kantor Pertanahan</option>
                </select>
              </div>

              {newRole === 'Operator Kelurahan' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Wilayah Kelurahan *</label>
                  <select
                    value={newKelurahanId}
                    onChange={(e) => setNewKelurahanId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                  >
                    {kelurahanList.map((k) => (
                      <option key={k.id} value={k.id}>
                        Kel. {k.nama} ({k.kecamatan})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@atrbpn.go.id"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. HP / WA</label>
                  <input
                    type="text"
                    value={newNoHp}
                    onChange={(e) => setNewNoHp(e.target.value)}
                    placeholder="08123456789"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Simpan...' : 'Simpan Pengguna'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Ubah Password */}
      {isPasswordModalOpen && selectedUserForPass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Ubah Kata Sandi</h3>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="p-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[11px] text-slate-500">Target Akun Pengguna:</p>
                <p className="text-xs font-bold text-slate-900">{selectedUserForPass.nama}</p>
                <p className="text-[10px] text-blue-600 font-mono">@{selectedUserForPass.username}</p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  {errorMessage}
                </div>
              )}

              {selectedUserForPass.id === currentUser?.id && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password Saat Ini *</label>
                  <input
                    type="password"
                    required
                    value={currentSelfPass}
                    onChange={(e) => setCurrentSelfPass(e.target.value)}
                    placeholder="Masukkan password saat ini"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password Baru *</label>
                <input
                  type="password"
                  required
                  value={targetNewPass}
                  onChange={(e) => setTargetNewPass(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Memproses...' : 'Ubah Password'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

