import React, { useState, useEffect } from 'react';
import { 
  User, 
  Pengaduan, 
  DashboardStats, 
  KelurahanMaster, 
  SumberPengaduanMaster, 
  JenisPengaduanMaster, 
  PenanggungJawabMaster,
  ActivityLog 
} from './types';
import { 
  fetchStats, 
  fetchPengaduanList, 
  createPengaduan, 
  processApproval, 
  addTindakLanjut, 
  deletePengaduan, 
  fetchMasterKelurahan, 
  fetchMasterSumber, 
  fetchMasterJenis, 
  fetchMasterPenanggungJawab,
  addMasterPenanggungJawab,
  deleteMasterPenanggungJawab,
  fetchUsers, 
  fetchLogs,
  createUser,
  updateUser,
  changePassword,
  deleteUser
} from './services/api';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { KPICards } from './components/KPICards';
import { MapComponent } from './components/MapComponent';
import { ChartsSection } from './components/ChartsSection';
import { RecentComplaintsTable } from './components/RecentComplaintsTable';
import { PengaduanModal } from './components/PengaduanModal';
import { FormInputModal } from './components/FormInputModal';
import { ApprovalView } from './components/ApprovalView';
import { LaporanView } from './components/LaporanView';
import { MasterDataView } from './components/MasterDataView';
import { PenggunaView } from './components/PenggunaView';
import { LogAktivitasView } from './components/LogAktivitasView';
import { GASInstallerSettingsView } from './components/GASInstallerSettingsView';
import { UserProfileSettingsView } from './components/UserProfileSettingsView';
import { PublicPortalView } from './components/PublicPortalView';
import { Footer } from './components/Footer';

function playPingSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.35);

    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, ctx.currentTime);
      gain2.gain.setValueAtTime(0.2, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.45);
    }, 100);
  } catch (e) {
    console.warn('Audio play skipped:', e);
  }
}

export default function App() {
  // Application States
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [complaints, setComplaints] = useState<Pengaduan[]>([]);

  const [kelurahanList, setKelurahanList] = useState<KelurahanMaster[]>([]);
  const [sumberList, setSumberList] = useState<SumberPengaduanMaster[]>([]);
  const [jenisList, setJenisList] = useState<JenisPengaduanMaster[]>([]);
  const [penanggungJawabList, setPenanggungJawabList] = useState<PenanggungJawabMaster[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Filter & Selection
  const [selectedKelurahanId, setSelectedKelurahanId] = useState<string | null>(null);
  const [selectedKelurahanName, setSelectedKelurahanName] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals
  const [selectedComplaint, setSelectedComplaint] = useState<Pengaduan | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial Load & Session Restore
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);

        // 1. Restore saved user session if available
        const savedSession = localStorage.getItem('sigap_user_session');
        if (savedSession) {
          try {
            const restoredUser = JSON.parse(savedSession);
            if (restoredUser && restoredUser.id) {
              setCurrentUser(restoredUser);
            }
          } catch (e) {
            console.error('Failed to parse saved session:', e);
            localStorage.removeItem('sigap_user_session');
          }
        }

        // 2. Fetch master reference data
        const [usersData, kelData, sumData, jnsData, pjData] = await Promise.all([
          fetchUsers(),
          fetchMasterKelurahan(),
          fetchMasterSumber(),
          fetchMasterJenis(),
          fetchMasterPenanggungJawab()
        ]);

        setAllUsers(usersData);
        setKelurahanList(kelData);
        setSumberList(sumData);
        setJenisList(jnsData);
        setPenanggungJawabList(pjData);
      } catch (err) {
        console.error('Failed to load reference data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // Reload complaints and stats whenever user, kelurahan filter, or status filter changes
  const refreshData = async () => {
    try {
      const isOperator = currentUser?.role === 'Operator Kelurahan';
      const effKelurahan = isOperator ? currentUser?.kelurahan_nama : (selectedKelurahanName || undefined);

      const [statsData, complaintsData, logsData] = await Promise.all([
        fetchStats(effKelurahan),
        fetchPengaduanList({
          kelurahan: effKelurahan,
          status_pengaduan: statusFilter && statusFilter !== 'Approval' ? statusFilter : undefined,
          status_approval: statusFilter === 'Approval' ? 'Menunggu' : undefined,
          role: currentUser?.role,
          user_kelurahan: currentUser?.kelurahan_nama
        }),
        fetchLogs()
      ]);

      setStats(statsData);
      setComplaints(complaintsData);
      setActivityLogs(logsData);
    } catch (err) {
      console.error('Failed to refresh complaints:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentUser, selectedKelurahanName, statusFilter]);

  // Live real-time background sync every 5 seconds + audio ping notification
  useEffect(() => {
    let prevLength = complaints.length;

    const interval = setInterval(async () => {
      try {
        const isOperator = currentUser?.role === 'Operator Kelurahan';
        const effKelurahan = isOperator ? currentUser?.kelurahan_nama : (selectedKelurahanName || undefined);

        const latestComplaints = await fetchPengaduanList({
          kelurahan: effKelurahan,
          status_pengaduan: statusFilter && statusFilter !== 'Approval' ? statusFilter : undefined,
          status_approval: statusFilter === 'Approval' ? 'Menunggu' : undefined,
          role: currentUser?.role,
          user_kelurahan: currentUser?.kelurahan_nama
        });

        if (prevLength > 0 && latestComplaints.length > prevLength) {
          playPingSound();
          const newest = latestComplaints[0];
          showToast(`🔔 PING! Pengaduan Baru dari ${newest.nama_pelapor} (${newest.kelurahan_nama})`);
        }
        prevLength = latestComplaints.length;
        setComplaints(latestComplaints);

        const latestStats = await fetchStats(effKelurahan);
        setStats(latestStats);
      } catch (e) {
        // Silent catch for background poll
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser, selectedKelurahanName, statusFilter]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('sigap_user_session', JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save session:', e);
    }
    setSelectedKelurahanId(null);
    setSelectedKelurahanName(null);
    setStatusFilter('');
    showToast(`Berhasil masuk sebagai: ${user.nama} (${user.role})`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sigap_user_session');
    setActiveTab('dashboard');
    showToast('Anda telah keluar dari akun.');
  };

  const handleCreateUser = async (payload: any) => {
    await createUser(payload);
    const updatedUsers = await fetchUsers();
    setAllUsers(updatedUsers);
    showToast('Pengguna baru berhasil ditambahkan!');
  };

  const handleChangePassword = async (userId: string, newPass: string, currentPass?: string, isSelf?: boolean) => {
    await changePassword(userId, newPass, currentPass, isSelf);
    showToast('Kata sandi berhasil diperbarui!');
  };

  const handleUpdateProfile = async (userId: string, data: Partial<User>) => {
    const updated = await updateUser(userId, data);
    setAllUsers((prev) => prev.map(u => u.id === userId ? { ...u, ...updated } : u));
    if (currentUser?.id === userId) {
      const merged = { ...currentUser, ...updated };
      setCurrentUser(merged);
      localStorage.setItem('sigap_user_session', JSON.stringify(merged));
    }
    showToast('Profil akun berhasil diperbarui!');
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus akun pengguna ini?')) {
      await deleteUser(userId);
      const updatedUsers = await fetchUsers();
      setAllUsers(updatedUsers);
      showToast('Pengguna berhasil dihapus!');
    }
  };

  const handleSelectKelurahan = (id: string | null, name: string | null) => {
    setSelectedKelurahanId(id);
    setSelectedKelurahanName(name);
  };

  const handleSubmitNewComplaint = async (payload: any) => {
    await createPengaduan(payload);
    playPingSound();
    await refreshData();
    showToast('🔔 PING! Pengaduan berhasil diajukan dan otomatis bertambah!');
  };

  const handleProcessApproval = async (id: string, isApproved: boolean, alasanPenolakan?: string, approvedBy?: string) => {
    await processApproval(id, isApproved, alasanPenolakan, approvedBy);
    playPingSound();
    await refreshData();
    showToast(isApproved ? '🔔 Pengaduan disetujui & tercatat di Peta!' : 'Pengaduan ditolak');
  };

  const handleAddTindakLanjut = async (id: string, payload: any) => {
    const updated = await addTindakLanjut(id, payload);
    setSelectedComplaint(updated);
    playPingSound();
    await refreshData();
    showToast(`🔔 Progress disimpan! Notifikasi email dikirim ke Penanggung Jawab: ${payload.petugas_pj || 'Petugas'}`);
  };

  const handleDeleteComplaint = async (id: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus pengaduan ${id}?`)) {
      await deletePengaduan(id);
      await refreshData();
      showToast(`Pengaduan ${id} berhasil dihapus`);
    }
  };

  const handleAddPenanggungJawab = async (nama: string, seksi: string, jabatan: string, email?: string) => {
    await addMasterPenanggungJawab({ nama, seksi, jabatan, email });
    const updated = await fetchMasterPenanggungJawab();
    setPenanggungJawabList(updated);
    showToast('Penanggung Jawab berhasil ditambahkan!');
  };

  const handleDeletePenanggungJawab = async (id: string) => {
    await deleteMasterPenanggungJawab(id);
    const updated = await fetchMasterPenanggungJawab();
    setPenanggungJawabList(updated);
    showToast('Penanggung Jawab berhasil dihapus!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 text-slate-800">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold tracking-wider text-slate-900">MEMUAT SISTEM SIGAP PAREPARE...</h2>
        <p className="text-xs text-slate-500 mt-1">Kantor Pertanahan Kota Parepare</p>
      </div>
    );
  }

  const pendingApprovalComplaints = complaints.filter(p => p.status_approval === 'Menunggu');

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center space-x-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Navbar */}
      <Navbar
        currentUser={currentUser}
        allUsers={allUsers}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        pendingApprovalCount={pendingApprovalComplaints.length}
        onNavigateApproval={() => setActiveTab('approval')}
      />

      {!currentUser ? (
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <PublicPortalView
            stats={stats}
            complaints={complaints}
            kelurahanList={kelurahanList}
            allUsers={allUsers}
            onLoginSuccess={handleLoginSuccess}
          />
        </main>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row">
          
          {/* Sidebar Menu */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            pendingApprovalCount={pendingApprovalComplaints.length}
            onOpenNewForm={() => setIsFormOpen(true)}
          />

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
            
            {/* TAB 1: DASHBOARD & PETA (MAP-CENTRIC) */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                
                {/* Top KPI Cards */}
                <KPICards
                  stats={stats}
                  onFilterStatus={(st) => setStatusFilter(st)}
                  selectedKelurahanName={selectedKelurahanName || undefined}
                />

                {/* Central Map Component */}
                <MapComponent
                  kelurahanList={kelurahanList}
                  pengaduanList={complaints}
                  onSelectKelurahan={handleSelectKelurahan}
                  selectedKelurahanId={selectedKelurahanId}
                  currentUser={currentUser}
                />

                {/* Visual Charts */}
                <ChartsSection stats={stats} />

                {/* Recent Complaints List */}
                <RecentComplaintsTable
                  complaints={complaints}
                  currentUser={currentUser}
                  onViewDetail={(c) => setSelectedComplaint(c)}
                  onDelete={handleDeleteComplaint}
                  selectedKelurahanName={selectedKelurahanName}
                  onResetKelurahanFilter={() => handleSelectKelurahan(null, null)}
                />

              </div>
            )}

            {/* TAB 2: DAFTAR PENGADUAN */}
            {activeTab === 'pengaduan' && (
              <div className="space-y-6">
                <RecentComplaintsTable
                  complaints={complaints}
                  currentUser={currentUser}
                  onViewDetail={(c) => setSelectedComplaint(c)}
                  onDelete={handleDeleteComplaint}
                  selectedKelurahanName={selectedKelurahanName}
                  onResetKelurahanFilter={() => handleSelectKelurahan(null, null)}
                />
              </div>
            )}

            {/* TAB 3: ANTREAN APPROVAL */}
            {activeTab === 'approval' && (
              <ApprovalView
                pendingComplaints={pendingApprovalComplaints}
                currentUser={currentUser}
                onProcessApproval={handleProcessApproval}
              />
            )}

            {/* TAB 4: LAPORAN REKAPITULASI */}
            {activeTab === 'laporan' && (
              <LaporanView
                complaints={complaints}
                kelurahanList={kelurahanList}
                sumberList={sumberList}
              />
            )}

            {/* TAB 5: MASTER DATA */}
            {activeTab === 'master' && (
              <MasterDataView
                kelurahanList={kelurahanList}
                sumberList={sumberList}
                jenisList={jenisList}
                penanggungJawabList={penanggungJawabList}
                onAddPenanggungJawab={handleAddPenanggungJawab}
                onDeletePenanggungJawab={handleDeletePenanggungJawab}
              />
            )}

            {/* TAB 6: PENGGUNA */}
            {activeTab === 'pengguna' && (
              <PenggunaView
                users={allUsers}
                currentUser={currentUser}
                kelurahanList={kelurahanList}
                onCreateUser={handleCreateUser}
                onChangePassword={handleChangePassword}
                onDeleteUser={handleDeleteUser}
              />
            )}

            {/* TAB 7: LOG AKTIVITAS */}
            {activeTab === 'logs' && (
              <LogAktivitasView logs={activityLogs} />
            )}

            {/* TAB 8: INTEGRASI GOOGLE APPS SCRIPT (ADMIN ONLY) */}
            {activeTab === 'apps_script' && currentUser?.role === 'Admin Kantor Pertanahan' && (
              <GASInstallerSettingsView />
            )}

            {/* TAB 9: PENGATURAN AKUN (ALL ROLES) */}
            {activeTab === 'profile' && (
              <UserProfileSettingsView
                currentUser={currentUser}
                onChangePassword={handleChangePassword}
                onUpdateProfile={handleUpdateProfile}
              />
            )}

          </main>

        </div>
      )}

      {/* Footer */}
      <Footer />

      {/* Modals */}
      {selectedComplaint && (
        <PengaduanModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          currentUser={currentUser}
          penanggungJawabList={penanggungJawabList}
          onAddTindakLanjut={handleAddTindakLanjut}
        />
      )}

      {isFormOpen && (
        <FormInputModal
          onClose={() => setIsFormOpen(false)}
          currentUser={currentUser}
          kelurahanList={kelurahanList}
          sumberList={sumberList}
          jenisList={jenisList}
          onSubmitComplaint={handleSubmitNewComplaint}
        />
      )}

    </div>
  );
}
