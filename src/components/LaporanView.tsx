import React, { useState } from 'react';
import { Pengaduan, KelurahanMaster, SumberPengaduanMaster } from '../types';
import { Printer, Download, Filter, FileSpreadsheet, Building2, Calendar, CheckCircle2 } from 'lucide-react';

interface LaporanViewProps {
  complaints: Pengaduan[];
  kelurahanList: KelurahanMaster[];
  sumberList: SumberPengaduanMaster[];
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  complaints,
  kelurahanList,
  sumberList
}) => {
  const [kelurahanFilter, setKelurahanFilter] = useState('');
  const [sumberFilter, setSumberFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  let filtered = complaints.filter(p => p.status_approval === 'Disetujui');

  if (kelurahanFilter) {
    filtered = filtered.filter(p => p.kelurahan_id === kelurahanFilter);
  }
  if (sumberFilter) {
    filtered = filtered.filter(p => p.sumber_id === sumberFilter);
  }
  if (statusFilter) {
    filtered = filtered.filter(p => p.status_pengaduan === statusFilter);
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'ID Pengaduan', 'Nomor Agenda', 'Tanggal', 'Nama Pelapor', 'NIK', 'No HP', 
      'Kelurahan', 'Kecamatan', 'Sertipikat', 'Jenis', 'Sumber', 'Status Pengaduan'
    ];

    const rows = filtered.map(p => [
      p.id, p.nomor_agenda || '-', p.tanggal_pengaduan, `"${p.nama_pelapor}"`, `'${p.nik_pelapor}`, `'${p.no_hp}`,
      p.kelurahan_nama, p.kecamatan_nama, `"${p.no_hak_sertipikat || '-'}"`, `"${p.jenis_pengaduan_nama}"`, `"${p.sumber_nama}"`, p.status_pengaduan
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LAPORAN_SIGAP_PAREPARE_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 print:space-y-4">
      
      {/* Action Header Controls (Hidden during print) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">LAPORAN REKAPITULASI PENGADUAN</h2>
              <p className="text-xs text-slate-500">
                Pusat Penyusunan Laporan Resmi Kantor Pertanahan Kota Parepare
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-emerald-600 font-bold rounded-xl text-xs border border-slate-200 flex items-center space-x-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV/Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow flex items-center space-x-2 transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan (PDF)</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Filter Kelurahan:</label>
            <select
              value={kelurahanFilter}
              onChange={(e) => setKelurahanFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:border-blue-500 outline-none"
            >
              <option value="">Semua Kelurahan (22 Kelurahan)</option>
              {kelurahanList.map((k) => (
                <option key={k.id} value={k.id}>Kel. {k.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Filter Sumber Kanal:</label>
            <select
              value={sumberFilter}
              onChange={(e) => setSumberFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:border-blue-500 outline-none"
            >
              <option value="">Semua Sumber Kanal</option>
              {sumberList.map((s) => (
                <option key={s.id} value={s.id}>{s.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Filter Status Pengaduan:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:border-blue-500 outline-none"
            >
              <option value="">Semua Status (Baru, Diproses, Selesai)</option>
              <option value="Baru">Baru</option>
              <option value="Diproses">Diproses</option>
              <option value="Menunggu Data">Menunggu Data</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Printable Report Document (Official Kop Surat Format) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-slate-800 space-y-6 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        
        {/* Kop Surat Header */}
        <div className="text-center border-b-4 border-blue-600 pb-4 space-y-1">
          <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase print:text-gray-600">
            KEMENTERIAN AGRARIA DAN TATA RUANG / BADAN PERTANAHAN NASIONAL
          </h3>
          <h2 className="text-lg font-bold text-slate-900 tracking-wider print:text-black">
            KANTOR PERTANAHAN KOTA PAREPARE
          </h2>
          <p className="text-[11px] text-slate-500 italic print:text-gray-700">
            Jl. Jend. Sudirman No. 28, Kota Parepare, Sulawesi Selatan • Telp: (0421) 21543
          </p>
          <div className="pt-2 text-xs font-bold text-blue-600 uppercase tracking-wider print:text-black">
            REKAPITULASI PENYELESAIAN PENGADUAN PERTANAHAN (SIGAP)
          </div>
        </div>

        {/* Report Summary Info Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 print:bg-gray-100 print:text-black print:border-gray-300">
          <div>
            <span>Tanggal Cetak: <strong>{new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
          </div>
          <div>
            <span>Jumlah Berkas Direkap: <strong className="text-blue-600 print:text-black">{filtered.length} Pengaduan</strong></span>
          </div>
        </div>

        {/* Official Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-y border-slate-200 print:bg-gray-200 print:text-black print:border-gray-400">
                <th className="py-2.5 px-2 border border-slate-200 print:border-gray-300">No</th>
                <th className="py-2.5 px-2 border border-slate-200 print:border-gray-300">ID & Agenda</th>
                <th className="py-2.5 px-2 border border-slate-200 print:border-gray-300">Tanggal</th>
                <th className="py-2.5 px-2 border border-slate-200 print:border-gray-300">Nama Pelapor & NIK</th>
                <th className="py-2.5 px-2 border border-slate-200 print:border-gray-300">Kelurahan</th>
                <th className="py-2.5 px-2 border border-slate-200 print:border-gray-300">No. Sertipikat</th>
                <th className="py-2.5 px-2 border border-slate-200 print:border-gray-300">Jenis & Sumber</th>
                <th className="py-2.5 px-2 border border-slate-200 print:border-gray-300 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-gray-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                    Tidak ada data pengaduan untuk periode/filter ini.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                    <td className="py-2 px-2 border border-slate-200 print:border-gray-300 text-center font-mono">{idx + 1}</td>
                    <td className="py-2 px-2 border border-slate-200 print:border-gray-300 font-mono font-bold text-blue-600 print:text-black">
                      {item.id}
                      <span className="block text-[9px] text-slate-500 font-normal print:text-gray-600">{item.nomor_agenda || '-'}</span>
                    </td>
                    <td className="py-2 px-2 border border-slate-200 print:border-gray-300">{item.tanggal_pengaduan}</td>
                    <td className="py-2 px-2 border border-slate-200 print:border-gray-300">
                      <strong className="block text-slate-800 print:text-black">{item.nama_pelapor}</strong>
                      <span className="text-[10px] text-slate-500 font-mono print:text-gray-600">{item.nik_pelapor}</span>
                    </td>
                    <td className="py-2 px-2 border border-slate-200 print:border-gray-300 font-semibold">Kel. {item.kelurahan_nama}</td>
                    <td className="py-2 px-2 border border-slate-200 print:border-gray-300 font-mono">{item.no_hak_sertipikat || '-'}</td>
                    <td className="py-2 px-2 border border-slate-200 print:border-gray-300">
                      {item.jenis_pengaduan_nama}
                      <span className="block text-[9px] text-blue-600 font-bold print:text-gray-700">({item.sumber_nama})</span>
                    </td>
                    <td className="py-2 px-2 border border-slate-200 print:border-gray-300 text-center font-bold">
                      {item.status_pengaduan}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Signature Block for Official Reports */}
        <div className="pt-8 grid grid-cols-2 text-xs text-center print:pt-12">
          <div>
            <p className="text-slate-500 print:text-black">Mengetahui,</p>
            <p className="font-bold text-slate-800 print:text-black">Kepala Seksi Pengendalian & Penanganan Sengketa</p>
            <div className="h-16" />
            <p className="font-bold text-slate-900 underline print:text-black">( Kepala Seksi Penanganan Sengketa )</p>
            <p className="text-[10px] text-slate-500 print:text-black">Kantor Pertanahan Kota Parepare</p>
          </div>

          <div>
            <p className="text-slate-500 print:text-black">Parepare, {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="font-bold text-slate-800 print:text-black">Administrator SIGAP BPN Parepare</p>
            <div className="h-16" />
            <p className="font-bold text-slate-900 underline print:text-black">Administrator Kantor Pertanahan</p>
            <p className="text-[10px] text-slate-500 print:text-black">NIP. 198504122008011002</p>
          </div>
        </div>

      </div>

    </div>
  );
};
