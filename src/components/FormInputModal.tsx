import React, { useState } from 'react';
import { User, KelurahanMaster, SumberPengaduanMaster, JenisPengaduanMaster } from '../types';
import { X, Save, AlertCircle, FilePlus, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface FormInputModalProps {
  onClose: () => void;
  currentUser: User | null;
  kelurahanList: KelurahanMaster[];
  sumberList: SumberPengaduanMaster[];
  jenisList: JenisPengaduanMaster[];
  onSubmitComplaint: (payload: any) => Promise<void>;
}

export const FormInputModal: React.FC<FormInputModalProps> = ({
  onClose,
  currentUser,
  kelurahanList,
  sumberList,
  jenisList,
  onSubmitComplaint
}) => {
  const isOperator = currentUser?.role === 'Operator Kelurahan';

  // Default kelurahan for operator if mapped
  const defaultKelurahan = isOperator && currentUser?.kelurahan_id 
    ? currentUser.kelurahan_id 
    : kelurahanList[0]?.id || 'kel-01';

  const defaultSumber = isOperator
    ? (sumberList.find(s => s.kode === 'KEL')?.id || sumberList[0]?.id)
    : sumberList[0]?.id;

  const [namaPelapor, setNamaPelapor] = useState('');
  const [nikPelapor, setNikPelapor] = useState('');
  const [noHp, setNoHp] = useState('');
  const [emailPelapor, setEmailPelapor] = useState('');
  const [alamatPelapor, setAlamatPelapor] = useState('');

  const [kelurahanId, setKelurahanId] = useState(defaultKelurahan);
  const [lokasiTanah, setLokasiTanah] = useState('');
  const [noHakSertipikat, setNoHakSertipikat] = useState('');
  const [luasTanah, setLuasTanah] = useState('');

  const [jenisId, setJenisId] = useState(jenisList[0]?.id || 'jns-01');
  const [sumberId, setSumberId] = useState(defaultSumber || 'src-01');
  const [uraian, setUraian] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaPelapor.trim() || !nikPelapor.trim() || !noHp.trim() || !lokasiTanah.trim() || !uraian.trim()) {
      setErrorMsg('Harap lengkapi semua bidang wajib (*)!');
      return;
    }

    if (nikPelapor.length !== 16 || !/^\d+$/.test(nikPelapor)) {
      setErrorMsg('NIK Pelapor harus berjumlah tepat 16 angka!');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      await onSubmitComplaint({
        nama_pelapor: namaPelapor,
        nik_pelapor: nikPelapor,
        no_hp: noHp,
        email_pelapor: emailPelapor,
        alamat_pelapor: alamatPelapor || lokasiTanah,
        kelurahan_id: kelurahanId,
        lokasi_tanah: lokasiTanah,
        no_hak_sertipikat: noHakSertipikat,
        luas_tanah_m2: Number(luasTanah) || 0,
        jenis_pengaduan_id: jenisId,
        sumber_id: sumberId,
        uraian_pengaduan: uraian,
        created_by_user: currentUser.username,
        created_by_role: currentUser.role
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan pengaduan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-200">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">INPUT PENGADUAN PERTANAHAN BARU</h3>
              <p className="text-xs text-slate-500">
                Lengkapi formulir pengaduan resmi Kantor Pertanahan Kota Parepare
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Operator Notice */}
          {isOperator && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start space-x-3 text-xs text-amber-800">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Alur Approval Operator Kelurahan:</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Pengaduan yang diinput oleh Operator Kelurahan akan masuk ke <strong>Antrean Approval Admin Kantor Pertanahan</strong> terlebih dahulu sebelum diterbitkan nomor agenda resmi.
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-center space-x-2 text-xs text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Identitas Pelapor */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">1. IDENTITAS PELAPOR</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nama Lengkap Pelapor <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={namaPelapor}
                  onChange={(e) => setNamaPelapor(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:border-blue-500 outline-none"
                  placeholder="Contoh: H. Abdul Rahman"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">NIK (16 Digit) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={nikPelapor}
                  onChange={(e) => setNikPelapor(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 font-mono focus:border-blue-500 outline-none"
                  placeholder="737201..."
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">No. HP / WhatsApp <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:border-blue-500 outline-none"
                  placeholder="0812..."
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Email Pelapor (Opsional)</label>
                <input
                  type="email"
                  value={emailPelapor}
                  onChange={(e) => setEmailPelapor(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:border-blue-500 outline-none"
                  placeholder="email@domain.com"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">Alamat Pelapor</label>
                <input
                  type="text"
                  value={alamatPelapor}
                  onChange={(e) => setAlamatPelapor(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:border-blue-500 outline-none"
                  placeholder="Jl. Bau Massepe No..."
                />
              </div>
            </div>
          </div>

          {/* Section 2: Objek & Lokasi Tanah */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">2. OBJEK & LOKASI TANAH</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Kelurahan Lokasi Tanah <span className="text-red-500">*</span></label>
                <select
                  disabled={isOperator && Boolean(currentUser.kelurahan_id)}
                  value={kelurahanId}
                  onChange={(e) => setKelurahanId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 font-bold focus:border-blue-500 outline-none disabled:opacity-75"
                >
                  {kelurahanList.map((k) => (
                    <option key={k.id} value={k.id}>
                      Kel. {k.nama} ({k.kecamatan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">No. Hak Sertipikat / Letter C (Jika Ada)</label>
                <input
                  type="text"
                  value={noHakSertipikat}
                  onChange={(e) => setNoHakSertipikat(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 font-mono focus:border-blue-500 outline-none"
                  placeholder="Contoh: SHM 01422 / Lumpue"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">Lokasi Detail Objek Tanah <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={lokasiTanah}
                  onChange={(e) => setLokasiTanah(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:border-blue-500 outline-none"
                  placeholder="Nama jalan, patok, RT/RW, atau landmark terdekat"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Perkiraan Luas Tanah (m²)</label>
                <input
                  type="number"
                  value={luasTanah}
                  onChange={(e) => setLuasTanah(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:border-blue-500 outline-none"
                  placeholder="450"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Klasifikasi & Uraian Pengaduan */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider">3. KLASIFIKASI & URAIAN PENGADUAN</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Jenis Pengaduan <span className="text-red-500">*</span></label>
                <select
                  value={jenisId}
                  onChange={(e) => setJenisId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:border-blue-500 outline-none"
                >
                  {jenisList.map((j) => (
                    <option key={j.id} value={j.id}>{j.nama}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Sumber Kanal Pengaduan <span className="text-red-500">*</span></label>
                <select
                  value={sumberId}
                  onChange={(e) => setSumberId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:border-blue-500 outline-none"
                >
                  {sumberList.map((s) => (
                    <option key={s.id} value={s.id}>{s.nama}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">Uraian Ringkasan Pengaduan <span className="text-red-500">*</span></label>
                <textarea
                  rows={4}
                  required
                  value={uraian}
                  onChange={(e) => setUraian(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:border-blue-500 outline-none"
                  placeholder="Jelaskan kronologi singkat, para pihak, dan permasalahan pokok tanah..."
                />
              </div>
            </div>
          </div>

          {/* Submit Controls */}
          <div className="flex items-center justify-end space-x-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow flex items-center space-x-2 transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Proses Simpan...' : (isOperator ? 'Kirim ke Approval' : 'Simpan Pengaduan')}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
