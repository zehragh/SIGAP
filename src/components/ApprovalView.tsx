import React, { useState } from 'react';
import { Pengaduan, User } from '../types';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, FileText, Clock, AlertCircle } from 'lucide-react';

interface ApprovalViewProps {
  pendingComplaints: Pengaduan[];
  currentUser: User | null;
  onProcessApproval: (id: string, isApproved: boolean, alasanPenolakan?: string, approvedBy?: string) => Promise<void>;
}

export const ApprovalView: React.FC<ApprovalViewProps> = ({
  pendingComplaints,
  currentUser,
  onProcessApproval
}) => {
  const [rejectingComplaint, setRejectingComplaint] = useState<Pengaduan | null>(null);
  const [alasanPenolakan, setAlasanPenolakan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleApprove = async (id: string) => {
    try {
      setIsSubmitting(true);
      await onProcessApproval(id, true, undefined, currentUser?.nama || 'Admin Kantah');
    } catch (err: any) {
      alert(err.message || 'Gagal menyetujui pengaduan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingComplaint) return;

    if (!alasanPenolakan.trim()) {
      setErrorMsg('Alasan penolakan wajib diisi!');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onProcessApproval(rejectingComplaint.id, false, alasanPenolakan, currentUser?.nama || 'Admin Kantah');
      setRejectingComplaint(null);
      setAlasanPenolakan('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menolak pengaduan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">ANTEAN APPROVAL PENGADUAN KELURAHAN</h2>
            <p className="text-xs text-slate-500">
              Verifikasi pengaduan pertanahan yang diajukan oleh Operator Kelurahan sebelum dicatat ke database utama
            </p>
          </div>
        </div>

        <div className="bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>{pendingComplaints.length} Berkas Menunggu Approval</span>
        </div>
      </div>

      {/* Pending List Cards */}
      {pendingComplaints.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Tidak Ada Antrean Approval Pending</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Semua pengaduan dari kelurahan telah diproses. Pengaduan baru dari Operator Kelurahan akan muncul otomatis di halaman ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingComplaints.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-sm transition space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-blue-600 text-base">{item.id}</span>
                  <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-md flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Menunggu Approval</span>
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Diajukan oleh: <strong className="text-slate-700">{item.created_by_user}</strong> ({item.created_at.split('T')[0]})
                  </span>
                </div>

                <div className="text-xs text-slate-500">
                  Kelurahan: <strong className="text-slate-800 font-bold">Kel. {item.kelurahan_nama}</strong> ({item.kecamatan_nama})
                </div>
              </div>

              {/* Grid detail */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Identitas Pelapor:</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{item.nama_pelapor}</p>
                  <p className="text-slate-500 font-mono">NIK: {item.nik_pelapor}</p>
                  <p className="text-slate-500">No. HP: {item.no_hp}</p>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Objek Tanah & Hak:</span>
                  <p className="font-bold text-blue-600 text-sm mt-0.5">{item.no_hak_sertipikat || 'Belum Ada Sertipikat'}</p>
                  <p className="text-slate-700">{item.lokasi_tanah}</p>
                  <p className="text-slate-500">Luas: {item.luas_tanah_m2 ? `${item.luas_tanah_m2} m²` : '-'}</p>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Klasifikasi Pengaduan:</span>
                  <p className="font-bold text-slate-700 text-sm mt-0.5">{item.jenis_pengaduan_nama}</p>
                  <p className="text-blue-600 font-semibold">Kanal: {item.sumber_nama}</p>
                </div>

                <div className="md:col-span-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-blue-600 font-bold text-[10px] uppercase block mb-1">Uraian Pengaduan:</span>
                  <p className="text-slate-700 leading-relaxed text-xs">{item.uraian_pengaduan}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setRejectingComplaint(item);
                    setAlasanPenolakan('');
                    setErrorMsg('');
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs border border-red-200 flex items-center space-x-1.5 transition"
                >
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>Tolak Pengaduan</span>
                </button>

                <button
                  onClick={() => handleApprove(item.id)}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow flex items-center space-x-1.5 transition active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Setujui & Terbitkan Agenda</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Reject Modal with Mandatory Reason */}
      {rejectingComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
              <div className="p-2 bg-red-50 text-red-600 rounded-lg border border-red-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">PENOLAKAN PENGADUAN PERTANAHAN</h3>
                <p className="text-xs text-slate-500">Pengaduan {rejectingComplaint.id} ({rejectingComplaint.nama_pelapor})</p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Penolakan <span className="text-red-500">* (Wajib diisi)</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={alasanPenolakan}
                  onChange={(e) => setAlasanPenolakan(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:border-red-500 outline-none"
                  placeholder="Jelaskan alasan penolakan, misalnya: berkas tidak lengkap, lokasi luar kewenangan Parepare, atau pengaduan ganda..."
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingComplaint(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow flex items-center space-x-1"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Konfirmasi Penolakan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
