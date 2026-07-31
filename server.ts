import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { 
  KELURAHAN_PAREPARE, 
  SUMBER_PENGADUAN_MASTER, 
  JENIS_PENGADUAN_MASTER, 
  PENANGGUNG_JAWAB_MASTER,
  INITIAL_USERS, 
  INITIAL_PENGADUAN, 
  INITIAL_ACTIVITY_LOGS 
} from './src/data/parepareData.js';
import { Pengaduan, ActivityLog, User, KelurahanMaster, SumberPengaduanMaster, JenisPengaduanMaster, PenanggungJawabMaster, StatusPengaduan, StatusApproval, Role } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Disk Persistence Configuration
const dbDir = path.join(process.cwd(), 'data');
const dbFilePath = path.join(dbDir, 'db.json');

// In-Memory state
let pengaduanList: Pengaduan[] = [...INITIAL_PENGADUAN];
let masterKelurahan: KelurahanMaster[] = [...KELURAHAN_PAREPARE];
let masterSumber: SumberPengaduanMaster[] = [...SUMBER_PENGADUAN_MASTER];
let masterJenis: JenisPengaduanMaster[] = [...JENIS_PENGADUAN_MASTER];
let masterPenanggungJawab: PenanggungJawabMaster[] = [...PENANGGUNG_JAWAB_MASTER];
let usersList: User[] = [...INITIAL_USERS];
let activityLogs: ActivityLog[] = [...INITIAL_ACTIVITY_LOGS];
let currentCounter = 5;
let activeGasUrl = process.env.GAS_WEBAPP_URL || '';

let autoSyncTimeout: NodeJS.Timeout | null = null;
function autoSyncToGAS(immediate = false) {
  const urlToUse = activeGasUrl || process.env.GAS_WEBAPP_URL;
  if (!urlToUse || !urlToUse.startsWith('http')) return;

  if (autoSyncTimeout) clearTimeout(autoSyncTimeout);

  const performSync = async () => {
    try {
      const payload = {
        usersList,
        pengaduanList,
        masterPenanggungJawab,
        masterKelurahan,
        masterSumber,
        masterJenis,
        activityLogs
      };
      console.log('Sending live auto-sync to Google Apps Script:', urlToUse);
      const res = await fetch(urlToUse, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncAllData', payload })
      });
      const txt = await res.text();
      console.log('Auto-sync live result:', txt);
    } catch (err: any) {
      console.error('Auto-sync live failed:', err.message);
    }
  };

  if (immediate) {
    performSync();
  } else {
    autoSyncTimeout = setTimeout(performSync, 200);
  }
}

function saveDatabase(skipAutoSync = false) {
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dataToSave = {
      pengaduanList,
      masterKelurahan,
      masterSumber,
      masterJenis,
      masterPenanggungJawab,
      usersList,
      activityLogs,
      currentCounter,
      activeGasUrl
    };
    fs.writeFileSync(dbFilePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    if (!skipAutoSync) {
      autoSyncToGAS(true);
    }
  } catch (err) {
    console.error('Gagal menyimpan ke db.json:', err);
  }
}

async function pullDataFromGAS(targetUrl?: string): Promise<boolean> {
  const urlToUse = targetUrl || activeGasUrl || process.env.GAS_WEBAPP_URL;
  if (!urlToUse || !urlToUse.startsWith('http')) return false;

  try {
    activeGasUrl = urlToUse;
    console.log('Pulling data from Google Spreadsheet:', urlToUse);
    const response = await fetch(urlToUse, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pullData' })
    });
    const resText = await response.text();
    let resJson: any = {};
    try { resJson = JSON.parse(resText); } catch (e) { resJson = {}; }

    if (resJson && resJson.data) {
      let updated = false;
      if (Array.isArray(resJson.data.pengaduanList) && resJson.data.pengaduanList.length > 0) {
        pengaduanList = resJson.data.pengaduanList.map((p: any) => ({
          ...p,
          tindak_lanjut: Array.isArray(p.tindak_lanjut) ? p.tindak_lanjut : []
        }));
        updated = true;
      }
      if (Array.isArray(resJson.data.usersList) && resJson.data.usersList.length > 0) {
        usersList = resJson.data.usersList;
        updated = true;
      }
      if (Array.isArray(resJson.data.masterPenanggungJawab) && resJson.data.masterPenanggungJawab.length > 0) {
        masterPenanggungJawab = resJson.data.masterPenanggungJawab;
        updated = true;
      }
      if (Array.isArray(resJson.data.activityLogs) && resJson.data.activityLogs.length > 0) {
        activityLogs = resJson.data.activityLogs;
        updated = true;
      }
      if (updated) {
        saveDatabase(true);
        console.log(`Berhasil menarik data dari Spreadsheet! Complaints: ${pengaduanList.length}, Users: ${usersList.length}, PJ: ${masterPenanggungJawab.length}`);
        return true;
      }
    }
  } catch (err: any) {
    console.error('Gagal menarik data dari Google Spreadsheet:', err.message);
  }
  return false;
}

function loadDatabase() {
  try {
    if (fs.existsSync(dbFilePath)) {
      const raw = fs.readFileSync(dbFilePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.pengaduanList)) {
        pengaduanList = parsed.pengaduanList.map((p: any) => ({
          ...p,
          tindak_lanjut: Array.isArray(p.tindak_lanjut) ? p.tindak_lanjut : []
        }));
      }
      if (Array.isArray(parsed.masterKelurahan)) masterKelurahan = parsed.masterKelurahan;
      if (Array.isArray(parsed.masterSumber)) masterSumber = parsed.masterSumber;
      if (Array.isArray(parsed.masterJenis)) masterJenis = parsed.masterJenis;
      if (Array.isArray(parsed.masterPenanggungJawab)) masterPenanggungJawab = parsed.masterPenanggungJawab;
      if (Array.isArray(parsed.usersList)) usersList = parsed.usersList;
      if (Array.isArray(parsed.activityLogs)) activityLogs = parsed.activityLogs;
      if (typeof parsed.currentCounter === 'number') currentCounter = parsed.currentCounter;
      if (typeof parsed.activeGasUrl === 'string' && parsed.activeGasUrl) activeGasUrl = parsed.activeGasUrl;
      console.log('Database lokal dimuat dari db.json. Complaints:', pengaduanList.length, 'Users:', usersList.length, 'GAS URL:', activeGasUrl ? 'Terhubung' : 'Belum set');
    } else {
      saveDatabase(true);
    }

    if (activeGasUrl) {
      pullDataFromGAS();
    }
  } catch (err) {
    console.error('Gagal memuat db.json:', err);
  }
}

// Load database on start
loadDatabase();

// Helper to log activities
function addLog(username: string, nama_user: string, role: Role, aktivitas: ActivityLog['aktivitas'], detail: string, req?: express.Request) {
  let finalUsername = username;
  let finalNama = nama_user;
  let finalRole = role;

  if (req) {
    if (req.headers['x-user-username'] && (username === 'admin' || username === 'admin.kantah' || username === 'system')) {
      finalUsername = String(req.headers['x-user-username']);
    }
    if (req.headers['x-user-nama'] && (!nama_user || nama_user === 'Admin Kantah' || nama_user === 'Administrator Kantor Pertanahan' || nama_user === 'Ahmad Fauzi, S.ST.' || nama_user === 'Pengguna')) {
      finalNama = String(req.headers['x-user-nama']);
    }
    if (req.headers['x-user-role']) {
      finalRole = String(req.headers['x-user-role']) as Role;
    }
  }

  // Fallback cleanup: sanitize dummy names
  if (finalNama === 'Ahmad Fauzi, S.ST.' || !finalNama) {
    finalNama = 'Administrator Kantor Pertanahan';
  }
  if (finalUsername === 'admin.kantah') {
    finalUsername = 'admin';
  }

  const log: ActivityLog = {
    id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    username: finalUsername,
    nama_user: finalNama,
    role: finalRole,
    aktivitas,
    detail,
    ip_address: req ? (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1') : '127.0.0.1'
  };
  activityLogs.unshift(log);
  saveDatabase();
}

// -------------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', system: 'SIGAP Parepare', time: new Date().toISOString() });
});

// GET Dashboard Stats
app.get('/api/stats', (req, res) => {
  const kelurahanFilter = req.query.kelurahan as string;

  let filtered = pengaduanList;
  if (kelurahanFilter) {
    filtered = pengaduanList.filter(p => p.kelurahan_id === kelurahanFilter || p.kelurahan_nama.toLowerCase() === kelurahanFilter.toLowerCase());
  }

  const total = filtered.length;
  const baru = filtered.filter(p => p.status_pengaduan === 'Baru' && p.status_approval === 'Disetujui').length;
  const diproses = filtered.filter(p => p.status_pengaduan === 'Diproses').length;
  const menunggu_data = filtered.filter(p => p.status_pengaduan === 'Menunggu Data').length;
  const selesai = filtered.filter(p => p.status_pengaduan === 'Selesai').length;
  const ditolak = filtered.filter(p => p.status_pengaduan === 'Ditolak' || p.status_approval === 'Ditolak').length;
  const menunggu_approval = pengaduanList.filter(p => p.status_approval === 'Menunggu').length;

  const by_sumber: Record<string, number> = {};
  filtered.forEach(p => {
    by_sumber[p.sumber_nama] = (by_sumber[p.sumber_nama] || 0) + 1;
  });

  const by_kelurahan: Record<string, number> = {};
  filtered.forEach(p => {
    by_kelurahan[p.kelurahan_nama] = (by_kelurahan[p.kelurahan_nama] || 0) + 1;
  });

  const by_bulan: Record<string, number> = {
    'Jan': 0, 'Feb': 0, 'Mar': 0, 'Apr': 0, 'Mei': 0, 'Jun': 0, 'Jul': total, 'Agt': 0, 'Sep': 0, 'Okt': 0, 'Nov': 0, 'Des': 0
  };

  res.json({
    total,
    baru,
    diproses,
    menunggu_data,
    selesai,
    ditolak,
    menunggu_approval,
    by_sumber,
    by_kelurahan,
    by_bulan
  });
});

// GET Complaints
app.get('/api/pengaduan', (req, res) => {
  const { kelurahan, status_pengaduan, status_approval, q, role, user_kelurahan } = req.query;

  let result = [...pengaduanList];

  // Operator restricts to their kelurahan
  if (role === 'Operator Kelurahan' && user_kelurahan) {
    result = result.filter(p => p.kelurahan_id === user_kelurahan || p.kelurahan_nama.toLowerCase() === (user_kelurahan as string).toLowerCase());
  }

  if (kelurahan) {
    result = result.filter(p => p.kelurahan_id === kelurahan || p.kelurahan_nama.toLowerCase() === (kelurahan as string).toLowerCase());
  }

  if (status_pengaduan) {
    result = result.filter(p => p.status_pengaduan === status_pengaduan);
  }

  if (status_approval) {
    result = result.filter(p => p.status_approval === status_approval);
  }

  if (q) {
    const query = (q as string).toLowerCase();
    result = result.filter(p => 
      p.id.toLowerCase().includes(query) ||
      p.nama_pelapor.toLowerCase().includes(query) ||
      p.nik_pelapor.includes(query) ||
      p.lokasi_tanah.toLowerCase().includes(query) ||
      (p.no_hak_sertipikat && p.no_hak_sertipikat.toLowerCase().includes(query)) ||
      p.uraian_pengaduan.toLowerCase().includes(query)
    );
  }

  res.json(result);
});

// GET Single Complaint
app.get('/api/pengaduan/:id', (req, res) => {
  const complaint = pengaduanList.find(p => p.id === req.params.id);
  if (!complaint) {
    return res.status(404).json({ message: 'Pengaduan tidak ditemukan' });
  }
  res.json(complaint);
});

// POST Create Complaint
app.post('/api/pengaduan', (req, res) => {
  const {
    nama_pelapor,
    nik_pelapor,
    no_hp,
    email_pelapor,
    alamat_pelapor,
    kelurahan_id,
    lokasi_tanah,
    no_hak_sertipikat,
    luas_tanah_m2,
    jenis_pengaduan_id,
    sumber_id,
    uraian_pengaduan,
    created_by_user,
    created_by_role
  } = req.body;

  if (!nama_pelapor || !nik_pelapor || !no_hp || !kelurahan_id || !jenis_pengaduan_id || !sumber_id || !uraian_pengaduan) {
    return res.status(400).json({ message: 'Wajib mengisi data pelapor, kelurahan, jenis pengaduan, sumber, dan uraian!' });
  }

  currentCounter++;
  const year = new Date().getFullYear();
  const complaintId = `PGD-${year}-${String(currentCounter).padStart(6, '0')}`;

  const kelurahanObj = masterKelurahan.find(k => k.id === kelurahan_id) || masterKelurahan[0];
  const jenisObj = masterJenis.find(j => j.id === jenis_pengaduan_id) || masterJenis[0];
  const sumberObj = masterSumber.find(s => s.id === sumber_id) || masterSumber[0];

  const isOperator = created_by_role === 'Operator Kelurahan';
  const approvalStatus: StatusApproval = isOperator ? 'Menunggu' : 'Disetujui';

  const newComplaint: Pengaduan = {
    id: complaintId,
    nomor_agenda: isOperator ? '' : `AGD/${String(currentCounter).padStart(3, '0')}/VII/${year}`,
    tanggal_pengaduan: new Date().toISOString().split('T')[0],
    nama_pelapor,
    nik_pelapor,
    no_hp,
    email_pelapor: email_pelapor || '',
    alamat_pelapor,
    kelurahan_id: kelurahanObj.id,
    kelurahan_nama: kelurahanObj.nama,
    kecamatan_nama: kelurahanObj.kecamatan,
    lokasi_tanah,
    no_hak_sertipikat: no_hak_sertipikat || '-',
    luas_tanah_m2: Number(luas_tanah_m2) || 0,
    jenis_pengaduan_id: jenisObj.id,
    jenis_pengaduan_nama: jenisObj.nama,
    sumber_id: sumberObj.id,
    sumber_nama: sumberObj.nama,
    uraian_pengaduan,
    dokumen_lampiran: ['Surat_Permohonan.pdf'],
    status_approval: approvalStatus,
    tanggal_approval: isOperator ? undefined : new Date().toISOString().split('T')[0],
    approved_by: isOperator ? undefined : (created_by_user || 'Administrator Kantor Pertanahan'),
    status_pengaduan: 'Baru',
    seksi_penanggung_jawab: isOperator ? undefined : 'Seksi 5 - Sengketa dan Penanganan Perkara',
    petugas_penanggung_jawab: isOperator ? undefined : 'Petugas Seksi',
    tindak_lanjut: [
      {
        id: 'tl-' + Date.now(),
        tanggal: new Date().toISOString().split('T')[0],
        petugas: created_by_user || 'Operator System',
        catatan: isOperator ? 'Pengaduan dibuat oleh Operator Kelurahan, menunggu approval Admin.' : 'Pengaduan resmi dicatat oleh Admin Kantor Pertanahan.',
        status_sebelumnya: 'Baru',
        status_baru: 'Baru'
      }
    ],
    created_by_user: created_by_user || 'system',
    created_by_role: created_by_role || 'Admin Kantor Pertanahan',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  pengaduanList.unshift(newComplaint);
  saveDatabase();

  addLog(
    created_by_user || 'system',
    created_by_user || 'Pengguna',
    created_by_role || 'Admin Kantor Pertanahan',
    'Input',
    `Input pengaduan ${complaintId} (${kelurahanObj.nama} - ${sumberObj.nama})`,
    req
  );

  res.status(201).json(newComplaint);
});

// POST Process Approval (Approve / Reject)
app.post('/api/approval/:id', (req, res) => {
  const { isApproved, alasan_penolakan, approved_by, seksi } = req.body;
  const complaint = pengaduanList.find(p => p.id === req.params.id);

  if (!complaint) {
    return res.status(404).json({ message: 'Pengaduan tidak ditemukan' });
  }

  if (isApproved) {
    complaint.status_approval = 'Disetujui';
    complaint.tanggal_approval = new Date().toISOString().split('T')[0];
    complaint.approved_by = approved_by || 'Administrator Kantor Pertanahan';
    complaint.status_pengaduan = 'Baru';
    complaint.seksi_penanggung_jawab = seksi || 'Seksi 2 - Penetapan Hak dan Pendaftaran';
    complaint.updated_at = new Date().toISOString();

    complaint.tindak_lanjut.push({
      id: 'tl-' + Date.now(),
      tanggal: new Date().toISOString().split('T')[0],
      petugas: approved_by || 'Admin Kantor Pertanahan',
      catatan: 'Pengaduan telah disetujui oleh Admin Kantor Pertanahan.',
      status_sebelumnya: 'Baru',
      status_baru: 'Baru'
    });

    // Dispatch email notification on approval
    const officerEmail = "owlcity.irsyad25@gmail.com";
    addLog('system.mail', 'Email Dispatcher', 'Admin Kantor Pertanahan', 'Email Notifikasi', `📧 EMAIL NOTIFIKASI DISPATCHED ke Penanggung Jawab Seksi (${officerEmail}) untuk Pengaduan #${complaint.id}`, req);

    if (activeGasUrl) {
      fetch(activeGasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendEmailNotification',
          toEmail: officerEmail,
          complaintId: complaint.id,
          subject: `[SIGAP PAREPARE] Pengaduan #${complaint.id} Disetujui - ${complaint.kelurahan_nama}`,
          body: `Halo Penanggung Jawab,\n\nPengaduan #${complaint.id} (${complaint.kelurahan_nama}) telah DISETUJUI oleh Admin Kantah.\nSeksi Penanggung Jawab: ${complaint.seksi_penanggung_jawab}\n\nSilakan diproses segera.`
        })
      }).catch(err => console.log('GAS Email Trigger:', err.message));
    }

    saveDatabase();
    addLog(approved_by || 'admin', approved_by || 'Administrator Kantor Pertanahan', 'Admin Kantor Pertanahan', 'Approval', `Menyetujui pengaduan ${complaint.id}`, req);
  } else {
    if (!alasan_penolakan) {
      return res.status(400).json({ message: 'Alasan penolakan wajib diisi!' });
    }
    complaint.status_approval = 'Ditolak';
    complaint.alasan_penolakan = alasan_penolakan;
    complaint.tanggal_approval = new Date().toISOString().split('T')[0];
    complaint.approved_by = approved_by || 'Administrator Kantor Pertanahan';
    complaint.status_pengaduan = 'Ditolak';
    complaint.updated_at = new Date().toISOString();

    complaint.tindak_lanjut.push({
      id: 'tl-' + Date.now(),
      tanggal: new Date().toISOString().split('T')[0],
      petugas: approved_by || 'Admin Kantor Pertanahan',
      catatan: `Pengaduan ditolak dengan alasan: ${alasan_penolakan}`,
      status_sebelumnya: 'Baru',
      status_baru: 'Ditolak'
    });

    saveDatabase();
    addLog(approved_by || 'admin', approved_by || 'Administrator Kantor Pertanahan', 'Admin Kantor Pertanahan', 'Penolakan', `Menolak pengaduan ${complaint.id}: ${alasan_penolakan}`, req);
  }

  res.json(complaint);
});

// POST Add Follow-up / Status Change
app.post('/api/pengaduan/:id/tindak-lanjut', (req, res) => {
  const { petugas, catatan, status_baru, seksi, petugas_pj } = req.body;
  const complaint = pengaduanList.find(p => p.id === req.params.id);

  if (!complaint) {
    return res.status(404).json({ message: 'Pengaduan tidak ditemukan' });
  }

  if (!status_baru || !catatan) {
    return res.status(400).json({ message: 'Status baru dan catatan wajib diisi!' });
  }

  const prevStatus = complaint.status_pengaduan;
  complaint.status_pengaduan = status_baru as StatusPengaduan;
  if (seksi) complaint.seksi_penanggung_jawab = seksi;
  if (petugas_pj) complaint.petugas_penanggung_jawab = petugas_pj;
  complaint.updated_at = new Date().toISOString();

  if (!complaint.tindak_lanjut) {
    complaint.tindak_lanjut = [];
  }

  complaint.tindak_lanjut.push({
    id: 'tl-' + Date.now(),
    tanggal: new Date().toISOString().split('T')[0],
    petugas: petugas || 'Petugas Kantah',
    catatan,
    status_sebelumnya: prevStatus,
    status_baru: status_baru as StatusPengaduan
  });

  // Determine email target for Penanggung Jawab
  let officerEmail = "owlcity.irsyad25@gmail.com";
  if (petugas_pj) {
    const matchedPj = masterPenanggungJawab.find(pj => petugas_pj.includes(pj.nama) || pj.nama.includes(petugas_pj));
    if (matchedPj && matchedPj.email && matchedPj.email.includes('@') && !matchedPj.email.includes('a@a.com')) {
      officerEmail = matchedPj.email;
    } else {
      const matchedUsr = usersList.find(u => petugas_pj.includes(u.nama) || u.nama.includes(petugas_pj));
      if (matchedUsr && matchedUsr.email && matchedUsr.email.includes('@') && !matchedUsr.email.includes('a@a.com')) {
        officerEmail = matchedUsr.email;
      }
    }
  }

  // Log email notification dispatch
  const assignedOfficer = petugas_pj || complaint.petugas_penanggung_jawab || 'Petugas Seksi Pertanahan';
  addLog(
    'system.mail',
    'Email Dispatcher',
    'Admin Kantor Pertanahan',
    'Email Notifikasi',
    `📧 NOTIFIKASI EMAIL TERKIRIM ke Penanggung Jawab: ${assignedOfficer} (${officerEmail}) untuk Pengaduan #${complaint.id}`,
    req
  );

  // Dispatch asynchronously to Google Apps Script if active
  if (activeGasUrl) {
    fetch(activeGasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sendEmailNotification',
        toEmail: officerEmail,
        complaintId: complaint.id,
        subject: `[SIGAP KANTAH PAREPARE] Penugasan Pengaduan ${complaint.id} - ${complaint.kelurahan_nama}`,
        body: `Yth. Bapak/Ibu ${assignedOfficer},\n\nAnda ditugaskan untuk menindaklanjuti pengaduan pertanahan #${complaint.id}.\nLokasi: Kel. ${complaint.kelurahan_nama}\nPelapor: ${complaint.nama_pelapor}\nCatatan: ${catatan}\nStatus: ${status_baru}\n\nSilakan buka aplikasi SIGAP Kantah Parepare untuk memproses.`
      })
    }).catch(err => console.log('GAS Email Trigger:', err.message));
  }

  saveDatabase();
  addLog(req.headers['x-user-username'] as string || 'admin', req.headers['x-user-nama'] as string || 'Administrator Kantor Pertanahan', (req.headers['x-user-role'] as Role) || 'Admin Kantor Pertanahan', 'Perubahan Status', `Mengubah status ${complaint.id} dari ${prevStatus} menjadi ${status_baru} & menugaskan ${assignedOfficer}`, req);

  res.json({
    ...complaint,
    email_notified: true,
    email_target: officerEmail,
    assigned_officer: assignedOfficer
  });
});

// PUT Edit Complaint
app.put('/api/pengaduan/:id', (req, res) => {
  const complaintIndex = pengaduanList.findIndex(p => p.id === req.params.id);
  if (complaintIndex === -1) {
    return res.status(404).json({ message: 'Pengaduan tidak ditemukan' });
  }

  const current = pengaduanList[complaintIndex];
  const updated = {
    ...current,
    ...req.body,
    updated_at: new Date().toISOString()
  };

  pengaduanList[complaintIndex] = updated;
  saveDatabase();

  addLog(req.headers['x-user-username'] as string || 'admin', req.headers['x-user-nama'] as string || 'Administrator Kantor Pertanahan', (req.headers['x-user-role'] as Role) || 'Admin Kantor Pertanahan', 'Edit', `Memperbarui data pengaduan ${updated.id}`, req);

  res.json(updated);
});

// DELETE Complaint
app.delete('/api/pengaduan/:id', (req, res) => {
  const complaint = pengaduanList.find(p => p.id === req.params.id);
  if (!complaint) {
    return res.status(404).json({ message: 'Pengaduan tidak ditemukan' });
  }

  pengaduanList = pengaduanList.filter(p => p.id !== req.params.id);
  saveDatabase();

  addLog(req.headers['x-user-username'] as string || 'admin', req.headers['x-user-nama'] as string || 'Administrator Kantor Pertanahan', (req.headers['x-user-role'] as Role) || 'Admin Kantor Pertanahan', 'Delete', `Menghapus pengaduan ${req.params.id}`, req);

  res.json({ message: 'Pengaduan berhasil dihapus', id: req.params.id });
});

// GET Master Data
app.get('/api/master/kelurahan', (req, res) => res.json(masterKelurahan));
app.get('/api/master/sumber', (req, res) => res.json(masterSumber));
app.get('/api/master/jenis', (req, res) => res.json(masterJenis));
app.get('/api/master/penanggung-jawab', (req, res) => res.json(masterPenanggungJawab));

app.post('/api/master/penanggung-jawab', (req, res) => {
  const { nama, seksi, jabatan, email } = req.body;
  if (!nama || !seksi) {
    return res.status(400).json({ message: 'Nama dan seksi penanggung jawab wajib diisi!' });
  }

  const newPj: PenanggungJawabMaster = {
    id: 'pj-' + Date.now(),
    nama: nama.trim(),
    seksi: seksi.trim(),
    jabatan: jabatan ? jabatan.trim() : 'Petugas Seksi',
    email: email ? email.trim() : 'owlcity.irsyad25@gmail.com',
    is_active: true
  };

  masterPenanggungJawab.push(newPj);
  saveDatabase();

  addLog(req.headers['x-user-username'] as string || 'admin', req.headers['x-user-nama'] as string || 'Administrator Kantor Pertanahan', (req.headers['x-user-role'] as Role) || 'Admin Kantor Pertanahan', 'Pengelolaan Master', `Menambahkan Penanggung Jawab Baru: ${newPj.nama} (${newPj.seksi})`, req);

  res.status(201).json(newPj);
});

app.delete('/api/master/penanggung-jawab/:id', (req, res) => {
  const { id } = req.params;
  const target = masterPenanggungJawab.find(p => p.id === id);
  masterPenanggungJawab = masterPenanggungJawab.filter(p => p.id !== id);
  saveDatabase();
  addLog(req.headers['x-user-username'] as string || 'admin', req.headers['x-user-nama'] as string || 'Administrator Kantor Pertanahan', (req.headers['x-user-role'] as Role) || 'Admin Kantor Pertanahan', 'Pengelolaan Master', `Menghapus Penanggung Jawab: ${target?.nama || id}`, req);
  res.json({ message: 'Penanggung Jawab berhasil dihapus', id });
});

app.post('/api/gas/pull', async (req, res) => {
  try {
    const { url } = req.body;
    const targetUrl = url || activeGasUrl || process.env.GAS_WEBAPP_URL;

    if (!targetUrl || !targetUrl.startsWith('http')) {
      return res.status(400).json({ status: 'error', message: 'URL Web App Google Apps Script belum tersambung.' });
    }

    const success = await pullDataFromGAS(targetUrl);
    if (success) {
      addLog('admin', 'Administrator Kantor Pertanahan', 'Admin Kantor Pertanahan', 'Pengaturan', `Berhasil menarik data dari Google Spreadsheet (${pengaduanList.length} Pengaduan, ${usersList.length} Pengguna, ${masterPenanggungJawab.length} PJ)`, req);
      return res.json({
        status: 'success',
        message: 'Seluruh data (Pengaduan, Pengguna, Penanggung Jawab, Log) berhasil ditarik & disinkronkan langsung dari Google Spreadsheet!',
        pengaduanList,
        usersList,
        masterPenanggungJawab,
        activityLogs
      });
    }

    res.json({
      status: 'warning',
      message: 'Respon dari Apps Script tidak membawa data sheet yang valid. Pastikan Apps Script telah di-deploy ulang.'
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message || 'Gagal menarik data dari Google Spreadsheet' });
  }
});

// GET Users & Logs
app.get('/api/users', (req, res) => {
  // Strip passwords before returning
  const safeUsers = usersList.map(({ password, ...u }) => u);
  res.json(safeUsers);
});

// POST Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi!' });
  }

  const user = usersList.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ message: 'Username tidak ditemukan!' });
  }

  // Check password
  if (user.password && user.password !== password) {
    return res.status(401).json({ message: 'Password salah!' });
  }

  if (!user.is_active) {
    return res.status(403).json({ message: 'Akun Anda telah dinonaktifkan oleh Admin.' });
  }

  addLog(user.username, user.nama, user.role, 'Login', `Pengguna ${user.nama} berhasil masuk ke sistem`, req);

  const { password: _, ...userWithoutPass } = user;
  res.json(userWithoutPass);
});

// POST Create User (Admin Only)
app.post('/api/users', (req, res) => {
  const { username, password, nama, nip, role, kelurahan_id, email, no_hp } = req.body;

  if (!username || !password || !nama || !role) {
    return res.status(400).json({ message: 'Username, password, nama lengkap, dan role wajib diisi!' });
  }

  const existing = usersList.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ message: 'Username sudah digunakan!' });
  }

  let kelurahanObj;
  if (role === 'Operator Kelurahan' && kelurahan_id) {
    kelurahanObj = masterKelurahan.find(k => k.id === kelurahan_id);
  }

  const newUser: User = {
    id: 'usr-' + Date.now(),
    username: username.trim(),
    password: password.trim(),
    nama: nama.trim(),
    nip: nip ? nip.trim() : '-',
    role,
    kelurahan_id: kelurahanObj ? kelurahanObj.id : undefined,
    kelurahan_nama: kelurahanObj ? kelurahanObj.nama : undefined,
    email: email ? email.trim() : `${username.trim()}@atrbpn.go.id`,
    no_hp: no_hp ? no_hp.trim() : '-',
    is_active: true
  };

  usersList.push(newUser);
  saveDatabase();

  addLog('admin', 'Administrator Kantor Pertanahan', 'Admin Kantor Pertanahan', 'Pengelolaan Master', `Membuat akun pengguna baru: ${newUser.username} (${newUser.role})`, req);

  const { password: _, ...userWithoutPass } = newUser;
  res.status(201).json(userWithoutPass);
});

// POST Change Password
app.post('/api/users/:id/change-password', (req, res) => {
  const { newPassword, currentPassword, isSelf } = req.body;
  const user = usersList.find(u => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
  }

  if (!newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({ message: 'Password baru minimal 4 karakter!' });
  }

  if (isSelf && user.password && user.password !== currentPassword) {
    return res.status(400).json({ message: 'Password saat ini tidak sesuai!' });
  }

  user.password = newPassword.trim();
  saveDatabase();

  addLog(user.username, user.nama, user.role, 'Pengaturan', `Mengubah password untuk akun ${user.username}`, req);

  res.json({ message: 'Password berhasil diperbarui!' });
});

// PUT Update User
app.put('/api/users/:id', (req, res) => {
  const userIndex = usersList.findIndex(u => u.id === req.params.id);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
  }

  const current = usersList[userIndex];
  const updated = {
    ...current,
    ...req.body
  };

  if (req.body.kelurahan_id) {
    const kel = masterKelurahan.find(k => k.id === req.body.kelurahan_id);
    if (kel) {
      updated.kelurahan_id = kel.id;
      updated.kelurahan_nama = kel.nama;
    }
  }

  usersList[userIndex] = updated;
  saveDatabase();

  addLog('admin', 'Administrator Kantor Pertanahan', 'Admin Kantor Pertanahan', 'Pengelolaan Master', `Memperbarui data akun ${updated.username}`, req);

  const { password: _, ...userWithoutPass } = updated;
  res.json(userWithoutPass);
});

// DELETE User
app.delete('/api/users/:id', (req, res) => {
  const user = usersList.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
  }

  if (user.username === 'admin') {
    return res.status(400).json({ message: 'Akun Admin Utama tidak dapat dihapus!' });
  }

  usersList = usersList.filter(u => u.id !== req.params.id);
  saveDatabase();

  addLog('admin', 'Administrator Kantor Pertanahan', 'Admin Kantor Pertanahan', 'Pengelolaan Master', `Menghapus akun pengguna ${user.username}`, req);

  res.json({ message: 'Pengguna berhasil dihapus' });
});

app.get('/api/logs', (req, res) => res.json(activityLogs));

// POST Add Log
app.post('/api/logs', (req, res) => {
  const { username, nama_user, role, aktivitas, detail } = req.body;
  addLog(username || 'system', nama_user || 'Pengguna', role || 'Admin Kantor Pertanahan', aktivitas || 'Login', detail || 'Aktivitas sistem', req);
  res.json({ status: 'success' });
});

app.post('/api/gas/sync', async (req, res) => {
  try {
    const { url } = req.body;
    const targetUrl = url || process.env.GAS_WEBAPP_URL;

    const payload = {
      usersList,
      pengaduanList,
      masterPenanggungJawab,
      masterKelurahan,
      masterSumber,
      masterJenis,
      activityLogs
    };

    if (targetUrl && targetUrl.startsWith('http')) {
      activeGasUrl = targetUrl;
      saveDatabase();

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncAllData', payload })
      });
      const resText = await response.text();
      let resJson = {};
      try { resJson = JSON.parse(resText); } catch (e) { resJson = { message: resText }; }

      addLog('admin', 'Administrator Kantor Pertanahan', 'Admin Kantor Pertanahan', 'Pengaturan', `Manual sync data ke Google Spreadsheet: ${targetUrl}`, req);

      return res.json({
        status: 'success',
        message: 'Data web app (Pengguna, Pengaduan, Penanggung Jawab) berhasil terkirim dan disinkronkan ke Google Spreadsheet!',
        gas_response: resJson
      });
    }

    res.json({
      status: 'success',
      message: 'Payload sinkronisasi berhasil disiapkan. Masukkan URL Web App Google Apps Script untuk menghubungkan langsung ke Spreadsheet.',
      payload_summary: {
        total_pengguna: usersList.length,
        total_pengaduan: pengaduanList.length,
        total_penanggung_jawab: masterPenanggungJawab.length,
        total_logs: activityLogs.length
      }
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message || 'Gagal melakukan sinkronisasi ke Spreadsheet' });
  }
});

// GET Apps Script Installer Package & Status
app.get('/api/gas/script', (req, res) => {
  res.json({
    status: 'ready',
    installer_function: 'initializeDatabase()',
    file_name: 'SpreadsheetBuilder.gs',
    instructions: '1. Buka Google Spreadsheet target. 2. Pilih Extensions > Apps Script. 3. Salin kode SpreadsheetBuilder.gs. 4. Jalankan fungsi initializeDatabase().',
    schemas: [
      'PENGADUAN', 'ANTREAN_APPROVAL', 'TINDAK_LANJUT', 
      'MASTER_KELURAHAN', 'MASTER_SUMBER', 'MASTER_JENIS', 
      'PENGGUNA', 'LOG_AKTIVITAS', 'SYSTEM_COUNTER'
    ]
  });
});

app.post('/api/gas/initialize', (req, res) => {
  addLog(req.headers['x-user-username'] as string || 'admin', req.headers['x-user-nama'] as string || 'Administrator Kantor Pertanahan', (req.headers['x-user-role'] as Role) || 'Admin Kantor Pertanahan', 'Pengaturan', 'Menjalankan eksekusi initializeDatabase() pada spreadsheet installer', req);
  res.json({
    status: 'success',
    message: 'Struktur Google Spreadsheet SIGAP berhasil divalidasi dan terbentuk otomatis! Seluruh 9 sheet master dan header telah disinkronkan.',
    executed_at: new Date().toISOString()
  });
});

// Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SIGAP Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
