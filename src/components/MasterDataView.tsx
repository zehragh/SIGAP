import React, { useState } from 'react';
import { KelurahanMaster, SumberPengaduanMaster, JenisPengaduanMaster, PenanggungJawabMaster } from '../types';
import { Database, MapPin, Layers, FileCheck, UserCheck, Plus, Check, Trash2 } from 'lucide-react';

interface MasterDataViewProps {
  kelurahanList: KelurahanMaster[];
  sumberList: SumberPengaduanMaster[];
  jenisList: JenisPengaduanMaster[];
  penanggungJawabList: PenanggungJawabMaster[];
  onAddPenanggungJawab?: (nama: string, seksi: string, jabatan: string, email?: string) => Promise<void>;
  onDeletePenanggungJawab?: (id: string) => Promise<void>;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  kelurahanList,
  sumberList,
  jenisList,
  penanggungJawabList,
  onAddPenanggungJawab,
  onDeletePenanggungJawab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'kelurahan' | 'sumber' | 'jenis' | 'pj'>('kelurahan');

  // Add PJ Form state
  const [isAdding, setIsAdding] = useState(false);
  const [namaInput, setNamaInput] = useState('');
  const [seksiInput, setSeksiInput] = useState('Seksi 5 - Sengketa dan Penanganan Perkara');
  const [jabatanInput, setJabatanInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaInput.trim() || !onAddPenanggungJawab) return;

    try {
      setIsSubmitting(true);
      await onAddPenanggungJawab(namaInput.trim(), seksiInput, jabatanInput.trim(), emailInput.trim());
      setNamaInput('');
      setJabatanInput('');
      setEmailInput('');
      setIsAdding(false);
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan Penanggung Jawab');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">PENGELOLAAN MASTER DATA SISTEM</h2>
            <p className="text-xs text-slate-500">
              Pengaturan Master Data Kelurahan, Centroid Peta, Sumber Kanal, Klasifikasi, & List Penanggung Jawab
            </p>
          </div>
        </div>

        {/* Subtab Selector */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs gap-1">
          <button
            onClick={() => setActiveSubTab('kelurahan')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeSubTab === 'kelurahan' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kelurahan (22)
          </button>
          <button
            onClick={() => setActiveSubTab('sumber')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeSubTab === 'sumber' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sumber Kanal ({sumberList.length})
          </button>
          <button
            onClick={() => setActiveSubTab('jenis')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeSubTab === 'jenis' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Jenis Klasifikasi ({jenisList.length})
          </button>
          <button
            onClick={() => setActiveSubTab('pj')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeSubTab === 'pj' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Penanggung Jawab ({penanggungJawabList.length})
          </button>
        </div>
      </div>

      {/* 1. Master Kelurahan */}
      {activeSubTab === 'kelurahan' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>DAFTAR MASTER KELURAHAN & CENTROID PETA PAREPARE</span>
            </h3>
            <span className="text-xs text-slate-500">4 Kecamatan • 22 Kelurahan</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Kelurahan</th>
                  <th className="py-2.5 px-3">Kecamatan</th>
                  <th className="py-2.5 px-3">Latitude Centroid</th>
                  <th className="py-2.5 px-3">Longitude Centroid</th>
                  <th className="py-2.5 px-3 text-right">Status GIS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kelurahanList.map((kel) => (
                  <tr key={kel.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-blue-600 font-bold">{kel.id}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">Kel. {kel.nama}</td>
                    <td className="py-2.5 px-3 text-slate-600">Kec. {kel.kecamatan}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{kel.lat}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{kel.lng}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-200">
                        Peta Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Master Sumber */}
      {activeSubTab === 'sumber' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>DAFTAR MASTER SUMBER KANAL PENGADUAN</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Kode</th>
                  <th className="py-2.5 px-3">Nama Sumber Kanal</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sumberList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-blue-600 font-bold">{s.kode}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{s.nama}</td>
                    <td className="py-2.5 px-3 text-slate-500">{s.keterangan}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-200">
                        Aktif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Master Jenis */}
      {activeSubTab === 'jenis' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>DAFTAR MASTER KLASIFIKASI PENGADUAN</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Nama Jenis Pengaduan</th>
                  <th className="py-2.5 px-3">Kategori Seksi</th>
                  <th className="py-2.5 px-3">Deskripsi Ruang Lingkup</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jenisList.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-emerald-600 font-bold">{j.id}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{j.nama}</td>
                    <td className="py-2.5 px-3 text-blue-600 font-semibold">{j.kategori}</td>
                    <td className="py-2.5 px-3 text-slate-500">{j.deskripsi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Master Penanggung Jawab */}
      {activeSubTab === 'pj' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>DAFTAR PETUGAS PENANGGUNG JAWAB (SEKSI BPN)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Master Seksi Kantor Pertanahan Kota Parepare (Disinkronkan secara otomatis ke Google Sheets)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAdding ? 'Batal' : 'Tambah Penanggung Jawab'}</span>
              </button>
            </div>
          </div>

          {isAdding && (
            <form onSubmit={handleAddSubmit} className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-blue-900">Tambah Penanggung Jawab Baru (Tersinkron dengan Spreadsheet)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Petugas / Tim *</label>
                  <input
                    type="text"
                    required
                    value={namaInput}
                    onChange={(e) => setNamaInput(e.target.value)}
                    placeholder="Contoh: H. Muhammad Syukri, S.H."
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Seksi Penanggung Jawab *</label>
                  <select
                    value={seksiInput}
                    onChange={(e) => setSeksiInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-500"
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
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Jabatan / Peran</label>
                  <input
                    type="text"
                    value={jabatanInput}
                    onChange={(e) => setJabatanInput(e.target.value)}
                    placeholder="Contoh: Penata Pertanahan Ahli Muda"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Notifikasi *</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="nama@atrbpn.go.id"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Penanggung Jawab'}</span>
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Nama Petugas / Tim</th>
                  <th className="py-2.5 px-3">Seksi Penanggung Jawab</th>
                  <th className="py-2.5 px-3">Jabatan</th>
                  <th className="py-2.5 px-3">Email Notifikasi</th>
                  <th className="py-2.5 px-3 text-right">Aksi / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {penanggungJawabList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 font-medium">
                      Belum ada data Penanggung Jawab. Klik &quot;Riset Seksi Resmi&quot; atau &quot;Tambah Penanggung Jawab&quot;.
                    </td>
                  </tr>
                ) : (
                  penanggungJawabList.map((pj) => (
                    <tr key={pj.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-blue-600 font-bold">{pj.id}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{pj.nama}</td>
                      <td className="py-2.5 px-3 text-blue-600 font-semibold">{pj.seksi}</td>
                      <td className="py-2.5 px-3 text-slate-500">{pj.jabatan}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{pj.email || 'owlcity.irsyad25@gmail.com'}</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-200">
                            Aktif
                          </span>
                          {onDeletePenanggungJawab && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Hapus Penanggung Jawab ${pj.nama}?`)) {
                                  onDeletePenanggungJawab(pj.id);
                                }
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                              title="Hapus Penanggung Jawab"
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
      )}

    </div>
  );
};
