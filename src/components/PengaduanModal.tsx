import React, { useState } from 'react';
import { Pengaduan, User, StatusPengaduan, PenanggungJawabMaster } from '../types';
import { X, Calendar, User as UserIcon, MapPin, FileCheck, CheckCircle2, Clock, Send, ShieldAlert, FileText, Mail } from 'lucide-react';

interface PengaduanModalProps {
  complaint: Pengaduan | null;
  onClose: () => void;
  currentUser: User | null;
  penanggungJawabList?: PenanggungJawabMaster[];
  onAddTindakLanjut: (complaintId: string, payload: {
    petugas: string;
    catatan: string;
    status_baru: string;
    seksi?: string;
    petugas_pj?: string;
  }) => Promise<void>;
}

export const PengaduanModal: React.FC<PengaduanModalProps> = ({
  complaint,
  onClose,
  currentUser,
  penanggungJawabList = [],
  onAddTindakLanjut
}) => {
  if (!complaint) return null;

  const isAdmin = currentUser?.role === 'Admin Kantor Pertanahan';

  const [statusBaru, setStatusBaru] = useState<StatusPengaduan>(complaint.status_pengaduan);
  const [catatan, setCatatan] = useState('');
  const [seksi, setSeksi] = useState(complaint.seksi_penanggung_jawab || 'Subbagian Tata Usaha');
  const [petugasPj, setPetugasPj] = useState(complaint.petugas_penanggung_jawab || currentUser?.nama || 'Petugas Seksi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isSeksiMatch = (seksiSelected: string, pjSeksi: string) => {
    if (!seksiSelected || !pjSeksi) return true;
    const s1 = seksiSelected.toLowerCase().trim();
    const s2 = pjSeksi.toLowerCase().trim();
    if (s1 === s2 || s1.includes(s2) || s2.includes(s1)) return true;
    if (s1.includes('tata usaha') && s2.includes('tata usaha')) return true;
    if (s1.includes('survei') && s2.includes('survei')) return true;
    if (s1.includes('penetapan') && s2.includes('penetapan')) return true;
    if (s1.includes('penataan') && s2.includes('penataan')) return true;
    if (s1.includes('pengadaan') && s2.includes('pengadaan')) return true;
    if ((s1.includes('sengketa') || s1.includes('pengendalian')) && (s2.includes('sengketa') || s2.includes('pengendalian'))) return true;
    return false;
  };

  const filteredOfficers = penanggungJawabList.filter(pj => isSeksiMatch(seksi, pj.seksi));

  React.useEffect(() => {
    if (filteredOfficers.length > 0) {
      const matchesCurrent = filteredOfficers.some(pj => petugasPj.includes(pj.nama) || pj.nama.includes(petugasPj));
      if (!matchesCurrent) {
        setPetugasPj(`${filteredOfficers[0].nama} (${filteredOfficers[0].jabatan})`);
      }
    }
  }, [seksi, penanggungJawabList]);

  const handleTindakLanjutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catatan.trim()) {
      setErrorMsg('Catatan tindak lanjut wajib diisi!');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onAddTindakLanjut(complaint.id, {
        petugas: currentUser.nama,
        catatan,
        status_baru: statusBaru,
        seksi,
        petugas_pj: petugasPj
      });
      setCatatan('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan tindak lanjut');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-blue-600 text-lg">{complaint.id}</span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${
                complaint.status_pengaduan === 'Selesai' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                complaint.status_pengaduan === 'Diproses' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                'bg-blue-50 text-blue-600 border border-blue-200'
              }`}>
                {complaint.status_pengaduan}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Agenda: {complaint.nomor_agenda || 'Belum diagenda'} • Tgl: {complaint.tanggal_pengaduan}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Grid */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Complaint Detail */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Pelapor Info Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center space-x-2">
                <UserIcon className="w-4 h-4" />
                <span>IDENTITAS PELAPOR</span>
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Nama Pelapor:</span>
                  <span className="font-bold text-slate-800">{complaint.nama_pelapor}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">NIK Pelapor:</span>
                  <span className="font-mono text-slate-700">{complaint.nik_pelapor}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">No. Telepon / WA:</span>
                  <span className="text-slate-700">{complaint.no_hp}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Email:</span>
                  <span className="text-slate-700">{complaint.email_pelapor || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[10px]">Alamat Pelapor:</span>
                  <span className="text-slate-700">{complaint.alamat_pelapor}</span>
                </div>
              </div>
            </div>

            {/* Land & Complaint Detail */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>DETAIL OBJEK & URAIAN PENGADUAN</span>
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Kelurahan / Kecamatan:</span>
                  <span className="font-bold text-slate-800">Kel. {complaint.kelurahan_nama} (Kec. {complaint.kecamatan_nama})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Nomor Sertipikat / Hak:</span>
                  <span className="font-mono text-blue-600">{complaint.no_hak_sertipikat || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Kanal Sumber:</span>
                  <span className="font-bold text-slate-700">{complaint.sumber_nama}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Jenis Pengaduan:</span>
                  <span className="font-bold text-slate-700">{complaint.jenis_pengaduan_nama}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[10px]">Lokasi Detail Objek Tanah:</span>
                  <span className="text-slate-700">{complaint.lokasi_tanah}</span>
                </div>
                <div className="col-span-2 bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-blue-600 font-bold block text-[10px] uppercase mb-1">Uraian Pengaduan:</span>
                  <p className="text-slate-700 leading-relaxed text-xs whitespace-pre-wrap">{complaint.uraian_pengaduan}</p>
                </div>
              </div>
            </div>

            {/* Attachments */}
            {complaint.dokumen_lampiran && complaint.dokumen_lampiran.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>DOKUMEN LAMPIRAN ({complaint.dokumen_lampiran.length})</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {complaint.dokumen_lampiran.map((doc, idx) => (
                    <span key={idx} className="bg-white text-blue-600 text-xs px-3 py-1 rounded-lg border border-slate-200 flex items-center space-x-1 font-mono">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{doc}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Approval Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1">
              <p className="text-slate-600">
                Status Approval: <strong className={complaint.status_approval === 'Disetujui' ? 'text-emerald-600' : 'text-amber-600'}>{complaint.status_approval}</strong>
              </p>
              {complaint.approved_by && (
                <p className="text-slate-600">
                  Disetujui oleh: <span className="text-slate-800">{complaint.approved_by}</span> (Tgl: {complaint.tanggal_approval || '-'})
                </p>
              )}
              {complaint.alasan_penolakan && (
                <p className="text-red-600 font-semibold bg-red-50 p-2 rounded border border-red-200 mt-1">
                  Alasan Penolakan: {complaint.alasan_penolakan}
                </p>
              )}
            </div>

          </div>

          {/* Right Column: Timeline & Update Action */}
          <div className="space-y-6">
            
            {/* Timeline Log */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>RIWAYAT TINDAK LANJUT</span>
              </h4>

              <div className="space-y-3 pl-2 border-l-2 border-blue-200">
                {complaint.tindak_lanjut && complaint.tindak_lanjut.length > 0 ? (
                  complaint.tindak_lanjut.map((tl, idx) => (
                    <div key={tl.id || idx} className="relative pl-3 text-xs space-y-1">
                      <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border border-white" />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span className="font-bold text-blue-600">{tl.tanggal}</span>
                        <span>{tl.petugas}</span>
                      </div>
                      <p className="text-slate-800 font-medium">{tl.catatan}</p>
                      <span className="inline-block text-[9px] bg-white px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                        Status: {tl.status_sebelumnya || '-'} ➔ {tl.status_baru || '-'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic py-2">Belum ada catatan tindak lanjut.</p>
                )}
              </div>
            </div>

            {/* Add Follow-Up Form (Admin Only or Assigned) */}
            {isAdmin && complaint.status_approval === 'Disetujui' && (
              <form onSubmit={handleTindakLanjutSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  <span>TAMBAH TINDAK LANJUT</span>
                </h4>

                {errorMsg && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Status Pengaduan Terbaru:</label>
                    <select
                      value={statusBaru}
                      onChange={(e) => setStatusBaru(e.target.value as StatusPengaduan)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-bold focus:border-blue-500 outline-none"
                    >
                      <option value="Baru">Baru</option>
                      <option value="Diproses">Diproses</option>
                      <option value="Menunggu Data">Menunggu Data</option>
                      <option value="Selesai">Selesai</option>
                      <option value="Ditolak">Ditolak</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Seksi Penanggung Jawab:</label>
                    <select
                      value={seksi}
                      onChange={(e) => {
                        const newSeksi = e.target.value;
                        setSeksi(newSeksi);
                        const matched = penanggungJawabList.filter(pj => isSeksiMatch(newSeksi, pj.seksi));
                        if (matched.length > 0) {
                          setPetugasPj(`${matched[0].nama} (${matched[0].jabatan})`);
                        }
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:border-blue-500 outline-none"
                    >
                      <option value="Subbagian Tata Usaha">Subbagian Tata Usaha</option>
                      <option value="Seksi Survei dan Pemetaan">Seksi Survei dan Pemetaan</option>
                      <option value="Seksi Penetapan Hak dan Pendaftaran">Seksi Penetapan Hak dan Pendaftaran</option>
                      <option value="Seksi Penataan dan Pemberdayaan">Seksi Penataan dan Pemberdayaan</option>
                      <option value="Seksi Pengadaan Tanah dan Pengembangan">Seksi Pengadaan Tanah dan Pengembangan</option>
                      <option value="Seksi Pengendalian dan Penanganan Sengketa">Seksi Pengendalian dan Penanganan Sengketa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Petugas Penanggung Jawab (Master Spreadsheet):</label>
                    <select
                      value={petugasPj}
                      onChange={(e) => setPetugasPj(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-semibold focus:border-blue-500 outline-none"
                    >
                      {filteredOfficers.length > 0 ? (
                        filteredOfficers.map((pj) => (
                          <option key={pj.id} value={`${pj.nama} (${pj.jabatan})`}>
                            {pj.nama} ({pj.jabatan}) — {pj.seksi}
                          </option>
                        ))
                      ) : penanggungJawabList.length > 0 ? (
                        penanggungJawabList.map((pj) => (
                          <option key={pj.id} value={`${pj.nama} (${pj.jabatan})`}>
                            {pj.nama} ({pj.jabatan}) — {pj.seksi}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Ahmad Fauzi, S.ST. (Penata Kadaster)">Ahmad Fauzi, S.ST. (Penata Kadaster)</option>
                          <option value="M. Risal, S.H. (Analis Hukum Pertanahan)">M. Risal, S.H. (Analis Hukum Pertanahan)</option>
                          <option value="Dra. Nurhayati (Kepala Seksi Penetapan Hak)">Dra. Nurhayati (Kepala Seksi Penetapan Hak)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center space-x-2 text-[11px] text-emerald-800 font-medium">
                    <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Notifikasi Email Otomatis: Saat progress disimpan, email resmi akan dikirimkan ke Penanggung Jawab ({petugasPj || 'Petugas'}).</span>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Catatan Progress / Hasil Kerja:</label>
                    <textarea
                      rows={3}
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:border-blue-500 outline-none"
                      placeholder="Tuliskan catatan tindak lanjut, hasil mediasi, atau status berkas..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition text-xs shadow flex items-center justify-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Progress'}</span>
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
