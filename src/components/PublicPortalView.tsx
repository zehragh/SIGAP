import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  Search, 
  AlertCircle, 
  FileText, 
  LogIn, 
  BarChart3,
  Eye
} from 'lucide-react';
import { User, Pengaduan, KelurahanMaster, DashboardStats } from '../types';

interface PublicPortalViewProps {
  stats: DashboardStats | null;
  complaints: Pengaduan[];
  kelurahanList: KelurahanMaster[];
  allUsers: User[];
  onLoginSuccess: (user: User) => void;
}

export const PublicPortalView: React.FC<PublicPortalViewProps> = ({
  stats,
  complaints,
  onLoginSuccess
}) => {
  // Login Form States
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tracking Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [trackedComplaint, setTrackedComplaint] = useState<Pengaduan | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Active Tab in Public Portal
  const [publicTab, setPublicTab] = useState<'laporan' | 'lacak' | 'login'>('laporan');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) {
      setLoginError('Username dan password wajib diisi!');
      return;
    }

    try {
      setIsSubmitting(true);
      setLoginError(null);
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Username atau password salah.');
      }

      const user = await response.json();
      onLoginSuccess(user);
    } catch (err: any) {
      setLoginError(err.message || 'Gagal masuk. Periksa kembali kredensial Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setHasSearched(true);
    const q = searchQuery.trim().toLowerCase();
    const found = complaints.find(c => 
      c.id.toLowerCase() === q || 
      (c.nomor_agenda && c.nomor_agenda.toLowerCase().includes(q)) ||
      c.nama_pelapor.toLowerCase().includes(q) ||
      (c.no_hak_sertipikat && c.no_hak_sertipikat.toLowerCase().includes(q))
    );

    setTrackedComplaint(found || null);
  };

  return (
    <div className="space-y-8">

      {/* Hero Agency Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <Building2 className="w-96 h-96 text-amber-400" />
        </div>

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-400/30 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>KEMENTERIAN ATR/BPN • KANTOR PERTANAHAN KOTA PAREPARE</span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-amber-400">
                SIGAP
              </h1>
              <span className="text-base sm:text-xl font-bold text-white tracking-tight">
                (Sistem Informasi Pengaduan Pertanahan)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal pt-1 max-w-2xl">
              Portal Rekapitulasi & Pemantauan Berkas Pengaduan Terpadu Kantor Pertanahan Kota Parepare.
            </p>
          </div>

          {/* Public Navigation */}
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setPublicTab('laporan')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                publicTab === 'laporan' 
                  ? 'bg-amber-500 text-slate-950 shadow-lg' 
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Laporan Umum Pengaduan</span>
            </button>

            <button
              onClick={() => setPublicTab('lacak')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                publicTab === 'lacak' 
                  ? 'bg-amber-500 text-slate-950 shadow-lg' 
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Lacak Status Pengaduan</span>
            </button>

            <button
              onClick={() => setPublicTab('login')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                publicTab === 'login' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Portal Masuk Petugas</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN PUBLIC CONTENT BASED ON TAB */}

      {/* SECTION 1: LAPORAN UMUM PENGADUAN */}
      {publicTab === 'laporan' && (
        <div className="space-y-8">

          {/* Public KPI Summary Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="text-slate-400 text-xs font-medium">Total Pengaduan Terekam</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.total || 0}</div>
              <div className="text-[10px] text-slate-500 mt-1">Seluruh Kanal Resmi</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="text-amber-600 text-xs font-medium">Sedang Diproses</div>
              <div className="text-2xl font-extrabold text-amber-600 mt-1">{stats?.diproses || 0}</div>
              <div className="text-[10px] text-slate-500 mt-1">Olah Lapangan & Seksi</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="text-emerald-600 text-xs font-medium">Selesai Ditangani</div>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">{stats?.selesai || 0}</div>
              <div className="text-[10px] text-slate-500 mt-1">Tuntas Berita Acara</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="text-blue-600 text-xs font-medium">Verifikasi Kelurahan</div>
              <div className="text-2xl font-extrabold text-blue-600 mt-1">{stats?.menunggu_approval || 0}</div>
              <div className="text-[10px] text-slate-500 mt-1">Antrean Approval Admin</div>
            </div>
          </div>

          {/* Public Complaints Summary List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">Rekapitulasi Pengaduan Terdaftar (Viewer Mode)</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar rekapitulasi pengaduan dari berbagai kanal resmi yang telah dicatat oleh Admin Kantah dan Operator Kelurahan.
                </p>
              </div>

              <div className="bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
                Publik (Viewer)
              </div>
            </div>

            {complaints.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">Belum Ada Berkas Pengaduan</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Belum ada laporan pengaduan pertanahan yang terdaftar di dalam sistem.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">ID & Agenda</th>
                      <th className="py-3 px-3">Tanggal</th>
                      <th className="py-3 px-3">Wilayah Kelurahan</th>
                      <th className="py-3 px-3">Jenis Pengaduan</th>
                      <th className="py-3 px-3">Status Penanganan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {complaints.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-blue-600 block">{c.id}</span>
                          <span className="text-[10px] text-slate-400">{c.nomor_agenda || 'Menunggu Agenda'}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{c.tanggal_pengaduan}</td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-800 block">Kel. {c.kelurahan_nama}</span>
                          <span className="text-[10px] text-slate-500">Kec. {c.kecamatan_nama}</span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700">{c.jenis_pengaduan_nama}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            c.status_pengaduan === 'Selesai'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : c.status_pengaduan === 'Diproses'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {c.status_pengaduan}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* SECTION 2: LACAK STATUS PENGADUAN */}
      {publicTab === 'lacak' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 max-w-3xl mx-auto">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-200">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Lacak Perkembangan Pengaduan</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Masukkan Nomor Pengaduan (ID PGD) atau Nomor Agenda untuk memeriksa status penanganan oleh Kantor Pertanahan Kota Parepare.
            </p>
          </div>

          <form onSubmit={handleSearchComplaint} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Contoh: PGD-2026-000001 atau AGD/001/VII/2026"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              Cari Berkas
            </button>
          </form>

          {hasSearched && (
            <div className="pt-4 border-t border-slate-100">
              {trackedComplaint ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ID Berkas</span>
                      <span className="text-base font-extrabold font-mono text-blue-600">{trackedComplaint.id}</span>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      trackedComplaint.status_pengaduan === 'Selesai'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      Status: {trackedComplaint.status_pengaduan}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs border-y border-slate-200 py-3">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Wilayah Kelurahan:</span>
                      <strong className="text-slate-800">Kel. {trackedComplaint.kelurahan_nama}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Jenis Pengaduan:</span>
                      <strong className="text-slate-800">{trackedComplaint.jenis_pengaduan_nama}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Tanggal Pengaduan:</span>
                      <span className="text-slate-700 font-mono">{trackedComplaint.tanggal_pengaduan}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Seksi Penanggung Jawab:</span>
                      <span className="text-slate-700 font-semibold">{trackedComplaint.seksi_penanggung_jawab || 'Seksi Sengketa'}</span>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-slate-800 mb-2">Riwayat Progress Penanganan:</h5>
                    {trackedComplaint.tindak_lanjut && trackedComplaint.tindak_lanjut.length > 0 ? (
                      <div className="space-y-2">
                        {trackedComplaint.tindak_lanjut.map((tl, i) => (
                          <div key={tl.id || i} className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                              <span className="font-mono font-bold text-slate-600">{tl.tanggal}</span>
                              <span>{tl.petugas}</span>
                            </div>
                            <p className="text-slate-700 leading-relaxed">{tl.catatan}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic bg-white p-3 rounded-xl border border-slate-200">
                        Berkas sedang dalam tahap verifikasi kelurahan dan penelitian awal dokumen.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">Berkas Pengaduan Tidak Ditemukan</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Periksa kembali kata kunci pencarian Anda. Pastikan ID atau nomor agenda diisi secara benar.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: PORTAL MASUK PETUGAS (LOGIN) */}
      {publicTab === 'login' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-slate-900 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Portal Masuk Petugas & Admin</h3>
            <p className="text-xs text-slate-500">
              Akses khusus Aparatur Kantor Pertanahan Kota Parepare dan Operator Kelurahan
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Username NIP / ID *</label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Masukkan username"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi (Password) *</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Memeriksa Kredensial...' : 'Masuk ke Control Center'}</span>
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

