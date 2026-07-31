export type Role = 'Admin Kantor Pertanahan' | 'Operator Kantor Pertanahan' | 'Operator Kelurahan';

export type StatusApproval = 'Menunggu' | 'Disetujui' | 'Ditolak';

export type StatusPengaduan = 'Baru' | 'Diproses' | 'Menunggu Data' | 'Selesai' | 'Ditolak';

export interface User {
  id: string;
  username: string;
  password?: string;
  nama: string;
  nip?: string;
  role: Role;
  kelurahan_id?: string;
  kelurahan_nama?: string;
  email: string;
  no_hp: string;
  is_active: boolean;
}

export interface KelurahanMaster {
  id: string;
  nama: string;
  kecamatan: 'Bacukiki' | 'Bacukiki Barat' | 'Soreang' | 'Ujung';
  lat: number;
  lng: number;
  jumlah_penduduk?: number;
}

export interface SumberPengaduanMaster {
  id: string;
  nama: string;
  kode: string;
  keterangan: string;
  is_active: boolean;
}

export interface JenisPengaduanMaster {
  id: string;
  nama: string;
  kategori: string;
  deskripsi: string;
  is_active: boolean;
}

export interface PenanggungJawabMaster {
  id: string;
  nama: string;
  seksi: string;
  jabatan: string;
  email?: string;
  is_active: boolean;
}

export interface TindakLanjut {
  id: string;
  tanggal: string;
  petugas: string;
  catatan: string;
  status_sebelumnya: StatusPengaduan;
  status_baru: StatusPengaduan;
  dokumen_pendukung?: string[];
}

export interface Pengaduan {
  id: string; // e.g. PGD-2026-000001
  nomor_agenda?: string;
  tanggal_pengaduan: string;
  nama_pelapor: string;
  nik_pelapor: string;
  no_hp: string;
  email_pelapor?: string;
  alamat_pelapor: string;
  
  kelurahan_id: string;
  kelurahan_nama: string;
  kecamatan_nama: string;
  lokasi_tanah: string;
  no_hak_sertipikat?: string; // e.g. SHM 1024 / Lumpue
  luas_tanah_m2?: number;
  
  jenis_pengaduan_id: string;
  jenis_pengaduan_nama: string;
  sumber_id: string;
  sumber_nama: string;
  
  uraian_pengaduan: string;
  dokumen_lampiran?: string[];
  
  status_approval: StatusApproval;
  alasan_penolakan?: string;
  tanggal_approval?: string;
  approved_by?: string;
  
  status_pengaduan: StatusPengaduan;
  seksi_penanggung_jawab?: string; // Seksi 1, Seksi 2, Seksi 3, Seksi 5
  petugas_penanggung_jawab?: string;
  
  tindak_lanjut: TindakLanjut[];
  created_by_user: string;
  created_by_role: Role;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  username: string;
  nama_user: string;
  role: Role;
  aktivitas: 'Login' | 'Logout' | 'Input' | 'Approval' | 'Penolakan' | 'Edit' | 'Delete' | 'Perubahan Status' | 'Pengelolaan Master' | 'Pengaturan' | 'Email Notifikasi';
  detail: string;
  ip_address?: string;
}

export interface DashboardStats {
  total: number;
  baru: number;
  diproses: number;
  menunggu_data: number;
  selesai: number;
  ditolak: number;
  menunggu_approval: number;
  by_sumber: Record<string, number>;
  by_kelurahan: Record<string, number>;
  by_bulan: Record<string, number>;
}
