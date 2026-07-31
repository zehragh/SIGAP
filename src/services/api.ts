import { Pengaduan, DashboardStats, User, ActivityLog, KelurahanMaster, SumberPengaduanMaster, JenisPengaduanMaster, PenanggungJawabMaster } from '../types';

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extraHeaders };
  try {
    const raw = localStorage.getItem('sigap_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u.username) headers['x-user-username'] = u.username;
      if (u.nama) headers['x-user-nama'] = u.nama;
      if (u.role) headers['x-user-role'] = u.role;
    }
  } catch(e) {}
  return headers;
}

export async function fetchStats(kelurahanFilter?: string): Promise<DashboardStats> {
  const url = kelurahanFilter 
    ? `/api/stats?kelurahan=${encodeURIComponent(kelurahanFilter)}`
    : '/api/stats';
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Gagal mengambil data statistik');
  return res.json();
}

export async function fetchPengaduanList(params?: {
  kelurahan?: string;
  status_pengaduan?: string;
  status_approval?: string;
  q?: string;
  role?: string;
  user_kelurahan?: string;
}): Promise<Pengaduan[]> {
  const query = new URLSearchParams();
  if (params?.kelurahan) query.append('kelurahan', params.kelurahan);
  if (params?.status_pengaduan) query.append('status_pengaduan', params.status_pengaduan);
  if (params?.status_approval) query.append('status_approval', params.status_approval);
  if (params?.q) query.append('q', params.q);
  if (params?.role) query.append('role', params.role);
  if (params?.user_kelurahan) query.append('user_kelurahan', params.user_kelurahan);

  const res = await fetch(`/api/pengaduan?${query.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Gagal mengambil daftar pengaduan');
  return res.json();
}

export async function fetchPengaduanDetail(id: string): Promise<Pengaduan> {
  const res = await fetch(`/api/pengaduan/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Pengaduan tidak ditemukan');
  return res.json();
}

export async function createPengaduan(payload: Partial<Pengaduan>): Promise<Pengaduan> {
  const res = await fetch('/api/pengaduan', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Gagal mengirim pengaduan');
  }
  return res.json();
}

export async function processApproval(id: string, isApproved: boolean, alasan_penolakan?: string, approved_by?: string, seksi?: string): Promise<Pengaduan> {
  const res = await fetch(`/api/approval/${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ isApproved, alasan_penolakan, approved_by, seksi })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Gagal memproses approval');
  }
  return res.json();
}

export async function addTindakLanjut(id: string, payload: {
  petugas: string;
  catatan: string;
  status_baru: string;
  seksi?: string;
  petugas_pj?: string;
}): Promise<Pengaduan> {
  const res = await fetch(`/api/pengaduan/${id}/tindak-lanjut`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Gagal menambahkan tindak lanjut');
  }
  return res.json();
}

export async function updatePengaduan(id: string, payload: Partial<Pengaduan>): Promise<Pengaduan> {
  const res = await fetch(`/api/pengaduan/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Gagal memperbarui pengaduan');
  return res.json();
}

export async function deletePengaduan(id: string): Promise<void> {
  const res = await fetch(`/api/pengaduan/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Gagal menghapus pengaduan');
}

export async function fetchMasterKelurahan(): Promise<KelurahanMaster[]> {
  const res = await fetch('/api/master/kelurahan');
  return res.json();
}

export async function fetchMasterSumber(): Promise<SumberPengaduanMaster[]> {
  const res = await fetch('/api/master/sumber');
  return res.json();
}

export async function fetchMasterJenis(): Promise<JenisPengaduanMaster[]> {
  const res = await fetch('/api/master/jenis');
  return res.json();
}

export async function fetchMasterPenanggungJawab(): Promise<PenanggungJawabMaster[]> {
  const res = await fetch('/api/master/penanggung-jawab');
  return res.json();
}

export async function addMasterPenanggungJawab(payload: { nama: string; seksi: string; jabatan?: string; email?: string }): Promise<PenanggungJawabMaster> {
  const res = await fetch('/api/master/penanggung-jawab', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Gagal menambah Penanggung Jawab');
  }
  return res.json();
}

export async function deleteMasterPenanggungJawab(id: string): Promise<void> {
  const res = await fetch(`/api/master/penanggung-jawab/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Gagal menghapus Penanggung Jawab');
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch('/api/users');
  return res.json();
}

export async function loginUser(username: string, password: string): Promise<User> {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Gagal login');
  }
  return res.json();
}

export async function createUser(payload: Partial<User> & { password: string }): Promise<User> {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Gagal membuat pengguna');
  }
  return res.json();
}

export async function updateUser(id: string, payload: Partial<User>): Promise<User> {
  const res = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Gagal memperbarui pengguna');
  }
  return res.json();
}

export async function changePassword(id: string, newPassword: string, currentPassword?: string, isSelf?: boolean): Promise<void> {
  const res = await fetch(`/api/users/${id}/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword, currentPassword, isSelf })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Gagal mengubah password');
  }
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Gagal menghapus pengguna');
  }
}

export async function fetchLogs(): Promise<ActivityLog[]> {
  const res = await fetch('/api/logs');
  return res.json();
}

export async function logActivity(username: string, nama_user: string, role: string, aktivitas: string, detail: string): Promise<void> {
  await fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, nama_user, role, aktivitas, detail })
  });
}

export async function initializeDatabaseGAS(): Promise<{ status: string; message: string; executed_at: string }> {
  const res = await fetch('/api/gas/initialize', { method: 'POST' });
  return res.json();
}

export async function syncDataGAS(url?: string): Promise<{ status: string; message: string }> {
  const res = await fetch('/api/gas/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  return res.json();
}

export async function pullDataGAS(url?: string): Promise<{ status: string; message: string }> {
  const res = await fetch('/api/gas/pull', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  return res.json();
}
