import React from 'react';
import { Pengaduan, User } from '../types';
import { Eye, Edit3, Trash2, ShieldAlert, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface RecentComplaintsTableProps {
  complaints: Pengaduan[];
  currentUser: User | null;
  onViewDetail: (complaint: Pengaduan) => void;
  onEdit?: (complaint: Pengaduan) => void;
  onDelete?: (complaintId: string) => void;
  selectedKelurahanName?: string | null;
  onResetKelurahanFilter?: () => void;
}

export const RecentComplaintsTable: React.FC<RecentComplaintsTableProps> = ({
  complaints,
  currentUser,
  onViewDetail,
  onEdit,
  onDelete,
  selectedKelurahanName,
  onResetKelurahanFilter
}) => {
  const isAdmin = currentUser?.role === 'Admin Kantor Pertanahan';

  const getStatusBadge = (status: string, approval: string) => {
    if (approval === 'Menunggu') {
      return (
        <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
          <Clock className="w-3 h-3" />
          <span>Menunggu Approval</span>
        </span>
      );
    }

    if (approval === 'Ditolak' || status === 'Ditolak') {
      return (
        <span className="inline-flex items-center space-x-1 bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
          <AlertCircle className="w-3 h-3" />
          <span>Ditolak</span>
        </span>
      );
    }

    switch (status) {
      case 'Baru':
        return (
          <span className="inline-flex items-center space-x-1 bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
            <Clock className="w-3 h-3" />
            <span>Baru</span>
          </span>
        );
      case 'Diproses':
        return (
          <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
            <Clock className="w-3 h-3" />
            <span>Diproses</span>
          </span>
        );
      case 'Menunggu Data':
        return (
          <span className="inline-flex items-center space-x-1 bg-purple-50 text-purple-600 border border-purple-200 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
            <AlertCircle className="w-3 h-3" />
            <span>Menunggu Data</span>
          </span>
        );
      case 'Selesai':
        return (
          <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
            <CheckCircle2 className="w-3 h-3" />
            <span>Selesai</span>
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center space-x-2">
            <span>DAFTAR PENGADUAN TERBARU</span>
            {selectedKelurahanName && (
              <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded font-bold border border-blue-200">
                Kel. {selectedKelurahanName}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500">
            Total {complaints.length} data pengaduan terdaftar dalam sistem
          </p>
        </div>

        {selectedKelurahanName && onResetKelurahanFilter && (
          <button
            onClick={onResetKelurahanFilter}
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            Tampilkan Semua Kelurahan
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-3">No. Pengaduan</th>
              <th className="py-3 px-3">Tanggal</th>
              <th className="py-3 px-3">Pelapor</th>
              <th className="py-3 px-3">Kelurahan / Lokasi</th>
              <th className="py-3 px-3">Jenis & Sumber</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {complaints.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                  Tidak ada data pengaduan yang sesuai filter.
                </td>
              </tr>
            ) : (
              complaints.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  {/* Complaint ID & Agenda */}
                  <td className="py-3 px-3 font-mono">
                    <span className="font-bold text-blue-600 block">{item.id}</span>
                    {item.nomor_agenda && (
                      <span className="text-[10px] text-slate-400 block">{item.nomor_agenda}</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                    {item.tanggal_pengaduan}
                  </td>

                  {/* Pelapor */}
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-800 block">{item.nama_pelapor}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">NIK: {item.nik_pelapor}</span>
                  </td>

                  {/* Kelurahan & Land SHM */}
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-700 block">Kel. {item.kelurahan_nama}</span>
                    <span className="text-[10px] text-slate-500 block truncate max-w-[180px]">
                      {item.no_hak_sertipikat || item.lokasi_tanah}
                    </span>
                  </td>

                  {/* Jenis & Sumber */}
                  <td className="py-3 px-3">
                    <span className="font-medium text-slate-700 block truncate max-w-[150px]">
                      {item.jenis_pengaduan_nama}
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold block">
                      {item.sumber_nama}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {getStatusBadge(item.status_pengaduan, item.status_approval)}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => onViewDetail(item)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                        title="Lihat Detail & Tindak Lanjut"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {isAdmin && onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                          title="Edit Pengaduan"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isAdmin && onDelete && (
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                          title="Hapus Pengaduan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
