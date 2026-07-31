import React, { useState } from 'react';
import { Settings, Play, Copy, Check, FileCode, Database, CheckCircle2, AlertCircle, Code2, Globe, Download, RefreshCw } from 'lucide-react';
import { initializeDatabaseGAS, syncDataGAS, pullDataGAS } from '../services/api';

export const GASInstallerSettingsView: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'gs' | 'html'>('gs');
  const [copiedGs, setCopiedGs] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [isRunningInit, setIsRunningInit] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [initResult, setInitResult] = useState<string | null>(null);
  const [gasUrl, setGasUrl] = useState(() => localStorage.getItem('sigap_gas_url') || '');

  const kodeGsContent = `/**
 * ============================================================================
 * SIGAP PRO - Kantor Pertanahan Kota Parepare
 * FILE 1 DARI 2: Kode.gs (Backend Script & Webhook Sync)
 * ============================================================================
 * Salin SELURUH isi kode ini ke file 'Kode.gs' di Editor Google Apps Script Anda.
 */

function testRun() {
  var hasil = initializeDatabase();
  Logger.log(hasil);
  return hasil;
}

function testSendEmail() {
  var recipient = Session.getActiveUser().getEmail() || "owlcity.irsyad25@gmail.com";
  MailApp.sendEmail(recipient, "Uji Coba Otomatisasi Email SIGAP Kantah Parepare", "Ini adalah email tes untuk mengotentikasi izin pengiriman email di Google Apps Script.");
  Logger.log("Email tes berhasil dikirim ke: " + recipient);
  return "Email tes berhasil dikirim ke: " + recipient;
}

function initializeDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("Spreadsheet aktif tidak ditemukan. Pastikan skrip ini terikat pada Google Spreadsheet.");
  }

  var schemas = [
    {
      sheetName: "PENGADUAN",
      alias: "DATA_PENGADUAN",
      headerColor: "#1e3a8a",
      headers: [
        "ID_PENGADUAN", "NOMOR_AGENDA", "TANGGAL_PENGADUAN", "NAMA_PELAPOR", "NIK_PELAPOR",
        "NO_HP", "EMAIL_PELAPOR", "ALAMAT_PELAPOR", "KELURAHAN_ID", "KELURAHAN_NAMA",
        "KECAMATAN_NAMA", "LOKASI_TANAH", "NO_HAK_SERTIPIKAT", "LUAS_TANAH_M2", "JENIS_PENGADUAN_ID",
        "JENIS_PENGADUAN_NAMA", "SUMBER_ID", "SUMBER_NAMA", "URAIAN_PENGADUAN", "DOKUMEN_LAMPIRAN",
        "STATUS_APPROVAL", "ALASAN_PENOLAKAN", "TANGGAL_APPROVAL", "APPROVED_BY", "STATUS_PENGADUAN",
        "SEKSI_PENANGGUNG_JAWAB", "PETUGAS_PENANGGUNG_JAWAB", "CREATED_BY_USER", "CREATED_BY_ROLE", "CREATED_AT", "UPDATED_AT"
      ]
    },
    {
      sheetName: "ANTREAN_APPROVAL",
      alias: "DATA_APPROVAL",
      headerColor: "#ca8a04",
      headers: ["ID_PENGADUAN", "TANGGAL_PENGADUAN", "NAMA_PELAPOR", "NIK_PELAPOR", "NO_HP", "ALAMAT_PELAPOR", "KELURAHAN_ID", "KELURAHAN_NAMA", "LOKASI_TANAH", "NO_HAK_SERTIPIKAT", "JENIS_PENGADUAN_NAMA", "SUMBER_NAMA", "URAIAN_PENGADUAN", "DOKUMEN_LAMPIRAN", "STATUS_APPROVAL", "SUBMITTED_BY", "SUBMITTED_ROLE", "CREATED_AT"]
    },
    {
      sheetName: "TINDAK_LANJUT",
      alias: "DATA_TINDAK_LANJUT",
      headerColor: "#0f766e",
      headers: ["ID_LOG", "ID_PENGADUAN", "TANGGAL", "PETUGAS", "CATATAN", "STATUS_SEBELUMNYA", "STATUS_BARU", "DOKUMEN_PENDUKUNG", "CREATED_AT"]
    },
    {
      sheetName: "MASTER_KELURAHAN",
      headerColor: "#15803d",
      headers: ["KELURAHAN_ID", "NAMA_KELURAHAN", "KECAMATAN", "LATITUDE", "LONGITUDE", "JUMLAH_PENDUDUK"]
    },
    {
      sheetName: "MASTER_SUMBER",
      headerColor: "#15803d",
      headers: ["SUMBER_ID", "NAMA_SUMBER", "KODE", "KETERANGAN", "IS_ACTIVE"]
    },
    {
      sheetName: "MASTER_JENIS",
      headerColor: "#15803d",
      headers: ["JENIS_ID", "NAMA_JENIS", "KATEGORI", "DESKRIPSI", "IS_ACTIVE"]
    },
    {
      sheetName: "MASTER_PENANGGUNG_JAWAB",
      headerColor: "#15803d",
      headers: ["PETUGAS_ID", "NAMA_PETUGAS", "SEKSI_NAMA", "JABATAN", "EMAIL_NOTIFIKASI", "IS_ACTIVE"]
    },
    {
      sheetName: "PENGGUNA",
      alias: "DATA_PENGGUNA",
      headerColor: "#4338ca",
      headers: ["USER_ID", "USERNAME", "NAMA_LENGKAP", "NIP", "ROLE", "KELURAHAN_ID", "KELURAHAN_NAMA", "EMAIL", "NO_HP", "IS_ACTIVE"]
    },
    {
      sheetName: "LOG_AKTIVITAS",
      alias: "DATA_LOG_AKTIVITAS",
      headerColor: "#374151",
      headers: ["LOG_ID", "TIMESTAMP", "USERNAME", "NAMA_USER", "ROLE", "AKTIVITAS", "DETAIL", "IP_ADDRESS"]
    },
    {
      sheetName: "SYSTEM_COUNTER",
      headerColor: "#374151",
      headers: ["KEY_NAME", "CURRENT_YEAR", "LAST_NUMBER"]
    }
  ];

  for (var i = 0; i < schemas.length; i++) {
    var schema = schemas[i];
    var targetSheets = [];
    var pSh = ss.getSheetByName(schema.sheetName);
    if (pSh) targetSheets.push(pSh);
    if (schema.alias) {
      var aSh = ss.getSheetByName(schema.alias);
      if (aSh && targetSheets.indexOf(aSh) === -1) targetSheets.push(aSh);
    }
    if (targetSheets.length === 0) {
      targetSheets.push(ss.insertSheet(schema.sheetName));
    }

    for (var t = 0; t < targetSheets.length; t++) {
      var sheet = targetSheets[t];
      if (sheet.getLastColumn() > 0) {
        sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), schema.headers.length)).clearContent();
      }
      sheet.getRange(1, 1, 1, schema.headers.length).setValues([schema.headers]);

      var headerRange = sheet.getRange(1, 1, 1, schema.headers.length);
      headerRange.setBackground(schema.headerColor);
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
  }

  return "BERHASIL: 10 Sheet Database beserta Judul Kolom & Format Warna telah siap di Google Spreadsheet!";
}

function doGet(e) {
  var htmlOutput;
  try {
    htmlOutput = HtmlService.createTemplateFromFile('Index').evaluate();
  } catch (err1) {
    try {
      htmlOutput = HtmlService.createTemplateFromFile('index').evaluate();
    } catch (err2) {
      try {
        htmlOutput = HtmlService.createHtmlOutputFromFile('Index');
      } catch (err3) {
        htmlOutput = HtmlService.createHtmlOutputFromFile('index');
      }
    }
  }
  return htmlOutput
    .setTitle('SIGAP PRO - Kantor Pertanahan Kota Parepare')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Tidak ada data POST." }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === "initDatabase" || action === "initializeDatabase") {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: initializeDatabase() }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "sendEmailNotification" || data.sendEmailNotification) {
      var recipient = data.toEmail || data.email || "owlcity.irsyad25@gmail.com";
      var subject = data.subject || ("Notifikasi Penugasan Pengaduan Pertanahan - SIGAP Kantah Parepare (" + (data.complaintId || "") + ")");
      var defaultBody = "Halo Bapak/Ibu Penanggung Jawab,\\n\\nAnda telah ditugaskan untuk menangani pengaduan " + (data.complaintId || "") + ".\\nMohon segera menindaklanjuti pada Sistem SIGAP PRO.\\n\\nTerima Kasih,\\nKantor Pertanahan Kota Parepare";
      var body = data.body || defaultBody;
      try {
        MailApp.sendEmail({
          to: recipient,
          subject: subject,
          body: body
        });
        return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Email notifikasi penugasan berhasil dikirimkan via Apps Script MailApp ke " + recipient }))
          .setMimeType(ContentService.MimeType.JSON);
      } catch (mailErr) {
        try {
          GmailApp.sendEmail(recipient, subject, body);
          return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Email notifikasi penugasan berhasil dikirimkan via Apps Script GmailApp ke " + recipient }))
            .setMimeType(ContentService.MimeType.JSON);
        } catch (gmailErr) {
          return ContentService.createTextOutput(JSON.stringify({ status: "warning", message: "Email notifikasi tercatat: " + mailErr.toString() + " | " + gmailErr.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    if (action === "syncAllData" || action === "syncData" || data.usersList || data.pengaduanList) {
      var payload = data.payload || data;
      syncAllToSheets(payload);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Seluruh 10 sheet data (Pengaduan, Approval, Tindak Lanjut, Kelurahan, Sumber, Jenis, PJ, Pengguna, Log, Counter) berhasil disinkronkan ke Google Sheets!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "pullData" || action === "readSheets" || action === "getSheets") {
      var pList = getSheetPengaduan();
      var uList = getSheetPengguna();
      var pjData = getSheetPenanggungJawab();
      var lList = getSheetActivityLogs();
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        data: {
          pengaduanList: pList,
          usersList: uList,
          masterPenanggungJawab: pjData,
          activityLogs: lList
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Action '" + action + "' tidak dikenali." }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function syncAllToSheets(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;

  initializeDatabase();

  function getTargetSheets(primaryName, aliasName) {
    var list = [];
    var pSh = ss.getSheetByName(primaryName);
    if (pSh) list.push(pSh);
    if (aliasName) {
      var aSh = ss.getSheetByName(aliasName);
      if (aSh && list.indexOf(aSh) === -1) list.push(aSh);
    }
    if (list.length === 0) {
      list.push(ss.insertSheet(primaryName));
    }
    return list;
  }

  function writeRowsToSheets(sheets, rows) {
    for (var s = 0; s < sheets.length; s++) {
      var sh = sheets[s];
      if (!sh) continue;
      if (sh.getLastRow() > 1) {
        sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).clearContent();
      }
      if (rows && rows.length > 0) {
        sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      }
    }
  }

  // 1. PENGADUAN / DATA_PENGADUAN
  if (payload.pengaduanList && Array.isArray(payload.pengaduanList)) {
    var pgdSheets = getTargetSheets("PENGADUAN", "DATA_PENGADUAN");
    var pgdRows = payload.pengaduanList.map(function(p) {
      return [
        p.id || '', p.nomor_agenda || '', p.tanggal_pengaduan || '', p.nama_pelapor || '',
        p.nik_pelapor || '', p.no_hp || '', p.email_pelapor || '', p.alamat_pelapor || '',
        p.kelurahan_id || '', p.kelurahan_nama || '', p.kecamatan_nama || '', p.lokasi_tanah || '',
        p.no_hak_sertipikat || '', p.luas_tanah_m2 || '', p.jenis_pengaduan_id || '', p.jenis_pengaduan_nama || '',
        p.sumber_id || '', p.sumber_nama || '', p.uraian_pengaduan || '', p.dokumen_lampiran ? JSON.stringify(p.dokumen_lampiran) : '',
        p.status_approval || '', p.alasan_penolakan || '', p.tanggal_approval || '', p.approved_by || '',
        p.status_pengaduan || '', p.seksi_penanggung_jawab || '', p.petugas_penanggung_jawab || '',
        p.created_by_user || '', p.created_by_role || '', p.created_at || '', p.updated_at || ''
      ];
    });
    writeRowsToSheets(pgdSheets, pgdRows);

    // 2. ANTREAN_APPROVAL
    var approvalSheets = getTargetSheets("ANTREAN_APPROVAL", "DATA_APPROVAL");
    var pendingList = payload.pengaduanList.filter(function(p) {
      return p.status_approval === 'Menunggu Approval' || p.status_pengaduan === 'Menunggu Approval';
    });
    var approvalRows = pendingList.map(function(p) {
      return [
        p.id || '', p.tanggal_pengaduan || '', p.nama_pelapor || '', p.nik_pelapor || '',
        p.no_hp || '', p.alamat_pelapor || '', p.kelurahan_id || '', p.kelurahan_nama || '',
        p.lokasi_tanah || '', p.no_hak_sertipikat || '', p.jenis_pengaduan_nama || '', p.sumber_nama || '',
        p.uraian_pengaduan || '', p.dokumen_lampiran ? JSON.stringify(p.dokumen_lampiran) : '',
        p.status_approval || 'Menunggu Approval', p.created_by_user || '', p.created_by_role || '', p.created_at || ''
      ];
    });
    writeRowsToSheets(approvalSheets, approvalRows);

    // 3. TINDAK_LANJUT
    var tlSheets = getTargetSheets("TINDAK_LANJUT", "DATA_TINDAK_LANJUT");
    var tlRows = [];
    payload.pengaduanList.forEach(function(p) {
      if (p.tindak_lanjut && Array.isArray(p.tindak_lanjut)) {
        p.tindak_lanjut.forEach(function(tl) {
          tlRows.push([
            tl.id || '', p.id || '', tl.tanggal || '', tl.petugas || '', tl.catatan || '',
            tl.status_sebelumnya || '', tl.status_baru || '',
            tl.dokumen_pendukung ? (Array.isArray(tl.dokumen_pendukung) ? JSON.stringify(tl.dokumen_pendukung) : String(tl.dokumen_pendukung)) : '',
            tl.created_at || ''
          ]);
        });
      }
    });
    writeRowsToSheets(tlSheets, tlRows);
  }

  // 4. PENGGUNA / DATA_PENGGUNA
  if (payload.usersList && Array.isArray(payload.usersList)) {
    var usrSheets = getTargetSheets("PENGGUNA", "DATA_PENGGUNA");
    var usrRows = payload.usersList.map(function(u) {
      return [
        u.id || '', u.username || '', u.nama || '', u.nip || '-', u.role || '',
        u.kelurahan_id || '', u.kelurahan_nama || 'Semua', u.email || '', u.no_hp || '',
        u.is_active !== false ? "Aktif" : "Nonaktif"
      ];
    });
    writeRowsToSheets(usrSheets, usrRows);
  }

  // 5. MASTER_PENANGGUNG_JAWAB
  if (payload.masterPenanggungJawab && Array.isArray(payload.masterPenanggungJawab)) {
    var pjSheets = getTargetSheets("MASTER_PENANGGUNG_JAWAB");
    var pjRows = payload.masterPenanggungJawab.map(function(pj) {
      return [pj.id || '', pj.nama || '', pj.seksi || '', pj.jabatan || '', pj.email || 'owlcity.irsyad25@gmail.com', pj.is_active !== false ? "Aktif" : "Nonaktif"];
    });
    writeRowsToSheets(pjSheets, pjRows);
  }

  // 6. MASTER_KELURAHAN
  if (payload.masterKelurahan && Array.isArray(payload.masterKelurahan)) {
    var kelSheets = getTargetSheets("MASTER_KELURAHAN");
    var kelRows = payload.masterKelurahan.map(function(k) {
      return [k.id || '', k.nama || '', k.kecamatan || '', k.lat || '', k.lng || '', k.jumlah_penduduk || ''];
    });
    writeRowsToSheets(kelSheets, kelRows);
  }

  // 7. MASTER_SUMBER
  if (payload.masterSumber && Array.isArray(payload.masterSumber)) {
    var sumSheets = getTargetSheets("MASTER_SUMBER");
    var sumRows = payload.masterSumber.map(function(s) {
      return [s.id || '', s.nama || '', s.kode || '', s.keterangan || '', s.is_active !== false ? "Aktif" : "Nonaktif"];
    });
    writeRowsToSheets(sumSheets, sumRows);
  }

  // 8. MASTER_JENIS
  if (payload.masterJenis && Array.isArray(payload.masterJenis)) {
    var jnsSheets = getTargetSheets("MASTER_JENIS");
    var jnsRows = payload.masterJenis.map(function(j) {
      return [j.id || '', j.nama || '', j.kategori || '', j.deskripsi || '', j.is_active !== false ? "Aktif" : "Nonaktif"];
    });
    writeRowsToSheets(jnsSheets, jnsRows);
  }

  // 9. LOG_AKTIVITAS
  if (payload.activityLogs && Array.isArray(payload.activityLogs)) {
    var logSheets = getTargetSheets("LOG_AKTIVITAS", "DATA_LOG_AKTIVITAS");
    var logRows = payload.activityLogs.map(function(l) {
      return [l.id || '', l.timestamp || '', l.username || '', l.nama_user || '', l.role || '', l.aktivitas || '', l.detail || '', l.ip_address || ''];
    });
    writeRowsToSheets(logSheets, logRows);
  }

  // 10. SYSTEM_COUNTER
  var counterSheets = getTargetSheets("SYSTEM_COUNTER");
  var counterRows = [["COUNTER_PENGADUAN", new Date().getFullYear(), payload.currentCounter || 5]];
  writeRowsToSheets(counterSheets, counterRows);
}

function getSheetPenanggungJawab() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return [];
  var pjSheet = ss.getSheetByName("MASTER_PENANGGUNG_JAWAB");
  if (!pjSheet || pjSheet.getLastRow() <= 1) return [];
  var lastRow = pjSheet.getLastRow();
  var values = pjSheet.getRange(2, 1, lastRow - 1, 6).getValues();
  var list = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var nama = row[1] ? String(row[1]).trim() : '';
    if (nama) {
      list.push({
        id: row[0] ? String(row[0]).trim() : ('pj-' + (i + 1)),
        nama: nama,
        seksi: row[2] ? String(row[2]).trim() : '',
        jabatan: row[3] ? String(row[3]).trim() : '',
        email: row[4] ? String(row[4]).trim() : 'owlcity.irsyad25@gmail.com',
        is_active: String(row[5]).toLowerCase() !== 'nonaktif'
      });
    }
  }
  return list;
}

function getSheetPengaduan() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return [];
  var sheet = ss.getSheetByName("PENGADUAN");
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var lastRow = sheet.getLastRow();
  var values = sheet.getRange(2, 1, lastRow - 1, 31).getValues();
  var list = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var id = row[0] ? String(row[0]).trim() : '';
    if (id) {
      var docs = [];
      if (row[19]) {
        try { docs = JSON.parse(row[19]); } catch(e) { docs = []; }
      }
      list.push({
        id: id,
        nomor_agenda: row[1] ? String(row[1]).trim() : '',
        tanggal_pengaduan: row[2] ? String(row[2]).trim() : '',
        nama_pelapor: row[3] ? String(row[3]).trim() : '',
        nik_pelapor: row[4] ? String(row[4]).trim() : '',
        no_hp: row[5] ? String(row[5]).trim() : '',
        email_pelapor: row[6] ? String(row[6]).trim() : '',
        alamat_pelapor: row[7] ? String(row[7]).trim() : '',
        kelurahan_id: row[8] ? String(row[8]).trim() : '',
        kelurahan_nama: row[9] ? String(row[9]).trim() : '',
        kecamatan_nama: row[10] ? String(row[10]).trim() : 'Bacukiki',
        lokasi_tanah: row[11] ? String(row[11]).trim() : '',
        no_hak_sertipikat: row[12] ? String(row[12]).trim() : '',
        luas_tanah_m2: row[13] ? Number(row[13]) || undefined : undefined,
        jenis_pengaduan_id: row[14] ? String(row[14]).trim() : '',
        jenis_pengaduan_nama: row[15] ? String(row[15]).trim() : '',
        sumber_id: row[16] ? String(row[16]).trim() : '',
        sumber_nama: row[17] ? String(row[17]).trim() : '',
        uraian_pengaduan: row[18] ? String(row[18]).trim() : '',
        dokumen_lampiran: docs,
        status_approval: row[20] ? String(row[20]).trim() : 'disetujui',
        alasan_penolakan: row[21] ? String(row[21]).trim() : undefined,
        tanggal_approval: row[22] ? String(row[22]).trim() : undefined,
        approved_by: row[23] ? String(row[23]).trim() : undefined,
        status_pengaduan: row[24] ? String(row[24]).trim() : 'Baru',
        seksi_penanggung_jawab: row[25] ? String(row[25]).trim() : undefined,
        petugas_penanggung_jawab: row[26] ? String(row[26]).trim() : undefined,
        created_by_user: row[27] ? String(row[27]).trim() : 'Operator System',
        created_by_role: row[28] ? String(row[28]).trim() : 'Operator Kelurahan',
        created_at: row[29] ? String(row[29]).trim() : new Date().toISOString(),
        updated_at: row[30] ? String(row[30]).trim() : new Date().toISOString()
      });
    }
  }
  return list;
}

function getSheetPengguna() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return [];
  var sheet = ss.getSheetByName("PENGGUNA");
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var lastRow = sheet.getLastRow();
  var values = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
  var list = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var id = row[0] ? String(row[0]).trim() : '';
    var username = row[1] ? String(row[1]).trim() : '';
    if (id || username) {
      list.push({
        id: id || ('usr-' + (i + 1)),
        username: username,
        nama: row[2] ? String(row[2]).trim() : username,
        nip: row[3] ? String(row[3]).trim() : '-',
        role: row[4] ? String(row[4]).trim() : 'Operator Kelurahan',
        kelurahan_id: row[5] ? String(row[5]).trim() : '',
        kelurahan_nama: row[6] ? String(row[6]).trim() : '',
        email: row[7] ? String(row[7]).trim() : '',
        no_hp: row[8] ? String(row[8]).trim() : '',
        is_active: String(row[9]).toLowerCase() !== 'nonaktif'
      });
    }
  }
  return list;
}

function getSheetActivityLogs() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return [];
  var sheet = ss.getSheetByName("LOG_AKTIVITAS");
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var lastRow = sheet.getLastRow();
  var values = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  var list = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    if (row[0]) {
      list.push({
        id: String(row[0]).trim(),
        timestamp: row[1] ? String(row[1]).trim() : new Date().toISOString(),
        username: row[2] ? String(row[2]).trim() : 'system',
        nama_user: row[3] ? String(row[3]).trim() : 'Pengguna',
        role: row[4] ? String(row[4]).trim() : 'Admin Kantor Pertanahan',
        aktivitas: row[5] ? String(row[5]).trim() : 'Aktivitas',
        detail: row[6] ? String(row[6]).trim() : '',
        ip_address: row[7] ? String(row[7]).trim() : '127.0.0.1'
      });
    }
  }
  return list;
}`;

  const indexHtmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SIGAP PRO - Kantor Pertanahan Kota Parepare</title>
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Font Inter -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <!-- Leaflet CSS & JS (Peta GIS) -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <!-- React 18 & Babel Standalone -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <style>
    body { font-family: 'Inter', sans-serif; }
    #map { height: 420px; width: 100%; border-radius: 1rem; }
    @media print {
      .no-print { display: none !important; }
      .print-only { display: block !important; }
    }
  </style>
</head>
<body class="bg-slate-100 text-slate-800 antialiased min-h-screen flex flex-col">

  <div id="root"></div>

  <!-- React Application Bundle Component -->
  <script type="text/babel">
    const { useState, useEffect, useRef } = React;

    // Master 22 Kelurahan Parepare Centroid Data (Default jika offline/preview)
    const DEFAULT_KELURAHAN_PAREPARE = [
      { id: 'KEL-20180101', nama: 'Galung Maloang', kecamatan: 'Bacukiki', lat: -4.017922, lng: 119.662628 },
      { id: 'KEL-20180102', nama: 'Lemoe', kecamatan: 'Bacukiki', lat: -4.036218, lng: 119.659498 },
      { id: 'KEL-20180103', nama: 'Lompoe', kecamatan: 'Bacukiki', lat: -4.016955, lng: 119.651175 },
      { id: 'KEL-20180104', nama: 'Watang Bacukiki', kecamatan: 'Bacukiki', lat: -4.055409, lng: 119.654699 },
      { id: 'KEL-20180201', nama: 'Bumi Harapan', kecamatan: 'Bacukiki Barat', lat: -4.030275, lng: 119.63327 },
      { id: 'KEL-20180202', nama: 'Cappa Galung', kecamatan: 'Bacukiki Barat', lat: -4.037406, lng: 119.626008 },
      { id: 'KEL-20180203', nama: 'Kampung Baru', kecamatan: 'Bacukiki Barat', lat: -4.020121, lng: 119.625438 },
      { id: 'KEL-20180204', nama: 'Lumpue', kecamatan: 'Bacukiki Barat', lat: -4.057548, lng: 119.625638 },
      { id: 'KEL-20180205', nama: 'Sumpang Minangae', kecamatan: 'Bacukiki Barat', lat: -4.041905, lng: 119.625487 },
      { id: 'KEL-20180206', nama: 'Tiro Sompe', kecamatan: 'Bacukiki Barat', lat: -4.025043, lng: 119.62911 },
      { id: 'KEL-20180301', nama: 'Bukit Harapan', kecamatan: 'Soreang', lat: -3.989515, lng: 119.648573 },
      { id: 'KEL-20180302', nama: 'Bukit Indah', kecamatan: 'Soreang', lat: -4.001366, lng: 119.640152 },
      { id: 'KEL-20180303', nama: 'Kampung Pisang', kecamatan: 'Soreang', lat: -4.005006, lng: 119.625209 },
      { id: 'KEL-20180304', nama: 'Lakessi', kecamatan: 'Soreang', lat: -4.006587, lng: 119.627497 },
      { id: 'KEL-20180305', nama: 'Ujung Baru', kecamatan: 'Soreang', lat: -4.008773, lng: 119.632315 },
      { id: 'KEL-20180306', nama: 'Ujung Lare', kecamatan: 'Soreang', lat: -4.008414, lng: 119.6305 },
      { id: 'KEL-20180307', nama: 'Watang Soreang', kecamatan: 'Soreang', lat: -3.995677, lng: 119.636516 },
      { id: 'KEL-20180401', nama: 'Labukkang', kecamatan: 'Ujung', lat: -4.018213, lng: 119.621762 },
      { id: 'KEL-20180402', nama: 'Lapadde', kecamatan: 'Ujung', lat: -3.995024, lng: 119.650082 },
      { id: 'KEL-20180403', nama: 'Mallusetasi', kecamatan: 'Ujung', lat: -4.012689, lng: 119.623344 },
      { id: 'KEL-20180404', nama: 'Ujung Bulu', kecamatan: 'Ujung', lat: -4.015669, lng: 119.622509 },
      { id: 'KEL-20180405', nama: 'Ujung Sabbang', kecamatan: 'Ujung', lat: -4.00622, lng: 119.622864 }
    ];

    // Initial Mock Complaints Data
    const INITIAL_COMPLAINTS = [
      {
        id: 'PGD-2026-000001',
        nomor_agenda: 'AGD/2026/0142',
        tanggal_pengaduan: '2026-07-15',
        nama_pelapor: 'H. Andi Muhammad Tahir',
        nik_pelapor: '7372011205750001',
        no_hp: '081242334455',
        kelurahan_id: 'KEL_01',
        kelurahan_nama: 'Soreang',
        kecamatan_nama: 'Soreang',
        no_hak_sertipikat: 'M.00241/Soreang',
        lokasi_tanah: 'Jl. Ahmad Yani No. 45, RT 02/RW 01',
        luas_tanah_m2: 450,
        sumber_nama: 'Loket Kantah',
        jenis_pengaduan_nama: 'Sengketa Batas Tanah',
        uraian_pengaduan: 'Terdapat pematokan sepihak oleh tetangga sebelah timur yang menggeser patok batas sejauh 1.5 meter.',
        status_pengaduan: 'Diproses',
        petugas_penanggung_jawab: 'Administrator Kantor Pertanahan'
      },
      {
        id: 'PGD-2026-000002',
        nomor_agenda: 'AGD/2026/0189',
        tanggal_pengaduan: '2026-07-20',
        nama_pelapor: 'Dra. Hj. Nurhayani',
        nik_pelapor: '7372024408800003',
        no_hp: '085299887766',
        kelurahan_id: 'KEL_07',
        kelurahan_nama: 'Ujung Bulu',
        kecamatan_nama: 'Ujung',
        no_hak_sertipikat: 'M.00512/Ujung Bulu',
        lokasi_tanah: 'Jl. Sultan Hasanuddin No. 12',
        luas_tanah_m2: 320,
        sumber_nama: 'SPAN-LAPOR',
        jenis_pengaduan_nama: 'Tumpang Tindih Sertipikat',
        uraian_pengaduan: 'Muncul sertipikat baru atas nama pihak ketiga di atas tanah hak milik pelapor yang terbit tahun 1998.',
        status_pengaduan: 'Baru',
        petugas_penanggung_jawab: 'Petugas Seksi Pertanahan'
      }
    ];

    function App() {
      const [activeTab, setActiveTab] = useState('dashboard');
      const [complaints, setComplaints] = useState(INITIAL_COMPLAINTS);
      const [kelurahanList, setKelurahanList] = useState(DEFAULT_KELURAHAN_PAREPARE);
      const [showModal, setShowModal] = useState(false);
      const [selectedKelurahan, setSelectedKelurahan] = useState(null);
      const mapRef = useRef(null);
      const leafletMap = useRef(null);

      // Fetch dynamic Master Kelurahan from Spreadsheet on mount if running inside Google Apps Script
      useEffect(() => {
        if (typeof google !== 'undefined' && google.script && google.script.run) {
          google.script.run
            .withSuccessHandler((data) => {
              if (data && Array.isArray(data) && data.length > 0) {
                setKelurahanList(data);
              }
            })
            .getKelurahanFromSheet();
        }
      }, []);

      // Form State
      const [formData, setFormData] = useState({
        nama_pelapor: '',
        nik_pelapor: '',
        no_hp: '',
        kelurahan_id: 'KEL-20180101',
        no_hak_sertipikat: '',
        lokasi_tanah: '',
        luas_tanah_m2: '',
        sumber_nama: 'Loket Kantah',
        jenis_pengaduan_nama: 'Sengketa Batas Tanah',
        uraian_pengaduan: ''
      });

      // Initialize Leaflet Map
      useEffect(() => {
        if (activeTab === 'peta' && mapRef.current && !leafletMap.current) {
          leafletMap.current = L.map(mapRef.current).setView([-4.015, 119.632], 12);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap & ATR/BPN Kota Parepare'
          }).addTo(leafletMap.current);

          // Add Markers for Kelurahan using dynamic kelurahanList
          kelurahanList.forEach((kel) => {
            const complaintCount = complaints.filter(c => c.kelurahan_id === kel.id || c.kelurahan_nama === kel.nama).length;
            const markerColor = complaintCount > 0 ? '#ef4444' : '#10b981';
            
            const circle = L.circleMarker([kel.lat, kel.lng], {
              color: markerColor,
              fillColor: markerColor,
              fillOpacity: 0.6,
              radius: 10 + (complaintCount * 4)
            }).addTo(leafletMap.current);

            circle.bindPopup(\`
              <div style="font-family: Inter, sans-serif; padding: 4px;">
                <strong style="font-size: 13px; color: #1e293b;">Kel. \${kel.nama}</strong><br/>
                <span style="font-size: 11px; color: #64748b;">Kec. \${kel.kecamatan}</span><br/>
                <span style="font-size: 12px; font-weight: bold; color: \${complaintCount > 0 ? '#dc2626' : '#059669'};">
                  \${complaintCount} Pengaduan Aktif
                </span>
              </div>
            \`);
          });
        }
      }, [activeTab, complaints, kelurahanList]);

      const handleSubmitForm = (e) => {
        e.preventDefault();
        const kelObj = kelurahanList.find(k => k.id === formData.kelurahan_id);
        const newComplaint = {
          id: \`PGD-2026-\${String(complaints.length + 1).padStart(6, '0')}\`,
          nomor_agenda: \`AGD/2026/\${String(Math.floor(Math.random() * 800) + 100)}\`,
          tanggal_pengaduan: new Date().toISOString().split('T')[0],
          ...formData,
          kelurahan_nama: kelObj ? kelObj.nama : 'Soreang',
          kecamatan_nama: kelObj ? kelObj.kecamatan : 'Soreang',
          status_pengaduan: 'Baru',
          petugas_penanggung_jawab: 'Petugas Loket'
        };

        setComplaints([newComplaint, ...complaints]);
        setShowModal(false);
        alert('Pengaduan baru berhasil disimpan!');

        // Call Google Apps Script backend if deployed
        if (typeof google !== 'undefined' && google.script && google.script.run) {
          google.script.run.initializeDatabase();
        }
      };

      return (
        <div className="min-h-screen flex flex-col">
          {/* Top Navbar */}
          <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm no-print">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-600 text-white font-extrabold rounded-xl text-lg shadow">
                  ATR
                </div>
                <div>
                  <h1 className="text-base font-extrabold text-slate-900 leading-tight tracking-tight">SIGAP PRO PAREPARE</h1>
                  <p className="text-[11px] text-slate-500 font-medium">Sistem Informasi Pengaduan Pertanahan — BPN Kota Parepare</p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="flex items-center space-x-1 overflow-x-auto bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={\`px-3 py-1.5 rounded-lg font-bold transition \${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}\`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('peta')}
                  className={\`px-3 py-1.5 rounded-lg font-bold transition \${activeTab === 'peta' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}\`}
                >
                  Peta GIS (22 Kel)
                </button>
                <button
                  onClick={() => setActiveTab('laporan')}
                  className={\`px-3 py-1.5 rounded-lg font-bold transition \${activeTab === 'laporan' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}\`}
                >
                  Cetak Laporan PDF
                </button>
              </nav>

              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow flex items-center justify-center space-x-1.5 transition active:scale-95 shrink-0"
              >
                <span>+ Buat Pengaduan Baru</span>
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full space-y-6">

            {/* TAB 1: DASHBOARD ANALYTICS */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="text-slate-500 text-xs font-bold uppercase">Total Pengaduan</span>
                    <p className="text-2xl font-extrabold text-slate-900">{complaints.length}</p>
                    <p className="text-[11px] text-blue-600">Seluruh Kota Parepare</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="text-slate-500 text-xs font-bold uppercase">Status Baru</span>
                    <p className="text-2xl font-extrabold text-amber-600">{complaints.filter(c => c.status_pengaduan === 'Baru').length}</p>
                    <p className="text-[11px] text-slate-500">Menunggu Penanganan</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="text-slate-500 text-xs font-bold uppercase">Sedang Diproses</span>
                    <p className="text-2xl font-extrabold text-blue-600">{complaints.filter(c => c.status_pengaduan === 'Diproses').length}</p>
                    <p className="text-[11px] text-slate-500">Mediasi / Olah Lapangan</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="text-slate-500 text-xs font-bold uppercase">Selesai</span>
                    <p className="text-2xl font-extrabold text-emerald-600">{complaints.filter(c => c.status_pengaduan === 'Selesai').length}</p>
                    <p className="text-[11px] text-emerald-600">Terlibat Kesepakatan</p>
                  </div>
                </div>

                {/* Complaint Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-sm font-bold text-slate-800">DAFTAR PENGADUAN PERTANAHAN TERKINI</h2>
                    <span className="text-xs text-slate-500">22 Kelurahan Parepare</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">No. Agenda</th>
                          <th className="py-2.5 px-3">Nama Pelapor</th>
                          <th className="py-2.5 px-3">Kelurahan</th>
                          <th className="py-2.5 px-3">No. Sertipikat</th>
                          <th className="py-2.5 px-3">Klasifikasi</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {complaints.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-mono font-bold text-blue-600">{item.nomor_agenda}</td>
                            <td className="py-3 px-3">
                              <strong className="block text-slate-800">{item.nama_pelapor}</strong>
                              <span className="text-[10px] text-slate-400 font-mono">NIK: {item.nik_pelapor}</span>
                            </td>
                            <td className="py-3 px-3 font-semibold">Kel. {item.kelurahan_nama}</td>
                            <td className="py-3 px-3 font-mono">{item.no_hak_sertipikat || '-'}</td>
                            <td className="py-3 px-3 text-slate-600">{item.jenis_pengaduan_nama}</td>
                            <td className="py-3 px-3 text-center">
                              <span className={\`text-[10px] font-bold px-2 py-0.5 rounded border \${
                                item.status_pengaduan === 'Diproses' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                              }\`}>
                                {item.status_pengaduan}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PETA GIS INTERAKTIF */}
            {activeTab === 'peta' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">PETA SEBARAN PENGADUAN PERTANAHAN PAREPARE</h2>
                    <p className="text-xs text-slate-500">Centroid Koordinat 22 Kelurahan se-Kota Parepare</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                    22 Kelurahan Terpetakan
                  </span>
                </div>
                <div id="map" ref={mapRef}></div>
              </div>
            )}

            {/* TAB 3: CETAK LAPORAN REKAPITULASI */}
            {activeTab === 'laporan' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                <div className="flex justify-between items-center no-print border-b border-slate-100 pb-4">
                  <h2 className="text-sm font-bold text-slate-800">CETAK DOKUMEN REKAPITULASI LAPORAN (PDF)</h2>
                  <button
                    onClick={() => window.print()}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow"
                  >
                    Cetak / Simpan PDF
                  </button>
                </div>

                {/* Kop Surat BPN Parepare */}
                <div className="text-center border-b-4 border-blue-600 pb-4 space-y-1">
                  <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                    KEMENTERIAN AGRARIA DAN TATA RUANG / BADAN PERTANAHAN NASIONAL
                  </h3>
                  <h2 className="text-lg font-black text-slate-900 tracking-wider">
                    KANTOR PERTANAHAN KOTA PAREPARE
                  </h2>
                  <p className="text-[11px] text-slate-500 italic">
                    Jl. Jend. Sudirman No. 28, Kota Parepare, Sulawesi Selatan • Telp: (0421) 21543
                  </p>
                  <div className="pt-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
                    REKAPITULASI PENYELESAIAN PENGADUAN PERTANAHAN (SIGAP)
                  </div>
                </div>

                {/* Report Table */}
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-y border-slate-200">
                      <th className="py-2 px-2 border border-slate-200">No</th>
                      <th className="py-2 px-2 border border-slate-200">Agenda</th>
                      <th className="py-2 px-2 border border-slate-200">Pelapor & NIK</th>
                      <th className="py-2 px-2 border border-slate-200">Kelurahan</th>
                      <th className="py-2 px-2 border border-slate-200">No. Sertipikat</th>
                      <th className="py-2 px-2 border border-slate-200">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="py-2 px-2 border border-slate-200 text-center font-mono">{idx + 1}</td>
                        <td className="py-2 px-2 border border-slate-200 font-mono font-bold text-blue-600">{item.nomor_agenda}</td>
                        <td className="py-2 px-2 border border-slate-200">
                          <strong>{item.nama_pelapor}</strong><br/>
                          <span className="text-[10px] text-slate-500">{item.nik_pelapor}</span>
                        </td>
                        <td className="py-2 px-2 border border-slate-200">Kel. {item.kelurahan_nama}</td>
                        <td className="py-2 px-2 border border-slate-200 font-mono">{item.no_hak_sertipikat || '-'}</td>
                        <td className="py-2 px-2 border border-slate-200 font-bold text-center">{item.status_pengaduan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </main>

          {/* Form Modal for New Complaint */}
          {showModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-800">FORMULIR PENGADUAN PERTANAHAN BARU</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                </div>

                <form onSubmit={handleSubmitForm} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Nama Lengkap Pelapor *</label>
                      <input
                        type="text"
                        required
                        value={formData.nama_pelapor}
                        onChange={(e) => setFormData({...formData, nama_pelapor: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 outline-none focus:border-blue-500"
                        placeholder="Sesuai KTP..."
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">NIK Pelapor *</label>
                      <input
                        type="text"
                        required
                        maxLength={16}
                        value={formData.nik_pelapor}
                        onChange={(e) => setFormData({...formData, nik_pelapor: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 outline-none focus:border-blue-500 font-mono"
                        placeholder="16 digit NIK..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Lokasi Kelurahan *</label>
                      <select
                        value={formData.kelurahan_id}
                        onChange={(e) => setFormData({...formData, kelurahan_id: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 outline-none focus:border-blue-500"
                      >
                        {kelurahanList.map((k) => (
                          <option key={k.id} value={k.id}>Kel. {k.nama} ({k.kecamatan})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">No. Hak Sertipikat</label>
                      <input
                        type="text"
                        value={formData.no_hak_sertipikat}
                        onChange={(e) => setFormData({...formData, no_hak_sertipikat: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 outline-none focus:border-blue-500 font-mono"
                        placeholder="M.00123/Kelurahan..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Uraian Ringkas Pengaduan *</label>
                    <textarea
                      rows={3}
                      required
                      value={formData.uraian_pengaduan}
                      onChange={(e) => setFormData({...formData, uraian_pengaduan: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 outline-none focus:border-blue-500"
                      placeholder="Jelaskan kronologi singkat pengaduan pertanahan..."
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow"
                    >
                      Simpan Pengaduan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <footer className="bg-white border-t border-slate-200 text-center py-4 text-xs text-slate-500 no-print">
            &copy; 2026 Kantor Pertanahan Kota Parepare — Kementerian ATR/BPN
          </footer>
        </div>
      );
    }

    ReactDOM.render(<App />, document.getElementById('root'));
  </script>
</body>
</html>`;

  const handleSyncNow = async () => {
    if (!gasUrl.trim()) {
      alert("Masukkan URL Web App Google Apps Script Anda terlebih dahulu!");
      return;
    }
    try {
      setIsSyncing(true);
      localStorage.setItem('sigap_gas_url', gasUrl.trim());
      const res = await fetch('/api/gas/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: gasUrl.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal sinkronisasi');
      setInitResult(data.message);
      alert("BERHASIL! Seluruh data (Pengguna, Pengaduan, Penanggung Jawab, Master) telah dikirim dan disinkronkan ke Google Spreadsheet Anda.");
    } catch (err: any) {
      alert("Gagal Sinkronisasi: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullNow = async () => {
    if (!gasUrl.trim()) {
      alert("Masukkan URL Web App Google Apps Script Anda terlebih dahulu!");
      return;
    }
    try {
      setIsPulling(true);
      localStorage.setItem('sigap_gas_url', gasUrl.trim());
      const res = await fetch('/api/gas/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: gasUrl.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menarik data');
      setInitResult(data.message);
      alert("BERHASIL! Data (Pengaduan, Pengguna, Penanggung Jawab, Log) berhasil ditarik dari Google Spreadsheet ke Web App.");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      alert("Gagal Menarik Data: " + err.message);
    } finally {
      setIsPulling(false);
    }
  };

  const handleCopyGs = () => {
    navigator.clipboard.writeText(kodeGsContent);
    setCopiedGs(true);
    setTimeout(() => setCopiedGs(false), 2500);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(indexHtmlContent);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  const handleRunInstallerSim = async () => {
    try {
      setIsRunningInit(true);
      setInitResult(null);
      const res = await initializeDatabaseGAS();
      setInitResult(res.message);
    } catch (err: any) {
      setInitResult('Error: ' + err.message);
    } finally {
      setIsRunningInit(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">KODE GOOGLE APPS SCRIPT (2 FILE: .GS & .HTML)</h2>
            <p className="text-xs text-slate-500">
              Cukup salin 2 file ini langsung ke editor Google Apps Script Anda (seperti di screenshot)
            </p>
          </div>
        </div>

        <button
          onClick={handleRunInstallerSim}
          disabled={isRunningInit}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow flex items-center space-x-2 transition active:scale-95"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{isRunningInit ? 'Menjalankan Installer...' : 'Jalankan initializeDatabase()'}</span>
        </button>
      </div>

      {/* Post-Deployment Guide Card */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 shadow-sm space-y-4 text-slate-800">
        <div className="border-b border-emerald-200 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-emerald-900 tracking-tight flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>SETELAH ANDA DEPLOY (TERAPKAN), APA LANGKAH SELANJUTNYA?</span>
          </h3>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-md border border-emerald-300">
            Langkah Terakhir
          </span>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">
          Selamat! Setelah Anda berhasil melakukan <strong>Deploy (Terapkan ➔ Penerapan Baru ➔ Jenis: Aplikasi Web)</strong> di Google Apps Script, Anda akan mendapatkan sebuah <strong>URL Web App</strong> yang berakhiran <code className="bg-emerald-100/80 px-1.5 py-0.5 rounded font-mono text-emerald-900 font-bold">/exec</code>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-2 shadow-xs">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>Pilihan 1: Akses Portal Web App Langsung</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Buka <strong>URL Web App</strong> tersebut langsung di browser Anda (atau bagikan ke staf/pelapor). Tampilan dari file <code className="font-mono text-blue-600">Index.html</code> akan langsung dapat diakses secara publik dan terhubung ke <code className="font-mono text-blue-600">Kode.gs</code>.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-2 shadow-xs">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Pilihan 2: Hubungkan Dashboard SIGAP PRO Ini</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Tempelkan URL Web App tersebut ke formulir di bawah ini agar Dashboard SIGAP PRO lengkap ini (Peta GIS 22 Kelurahan, Approval, Cetak Laporan PDF) dapat langsung mengirim data real-time ke Google Sheets Anda!
            </p>
          </div>
        </div>

        {/* URL Input Form */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-3 pt-3">
          <label className="block text-xs font-bold text-slate-800">
            Masukkan Google Apps Script Web App URL Anda:
          </label>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={gasUrl}
              onChange={(e) => setGasUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:border-blue-500 outline-none"
            />
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={handlePullNow}
                disabled={isPulling}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>{isPulling ? 'Menarik Data...' : 'Tarik Data dari Spreadsheet (Import ke Web)'}</span>
              </button>
              <button
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center space-x-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Kirim Data Web ke Spreadsheet (Export)'}</span>
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic">
            *<strong>Tarik Data (Import)</strong> akan mengambil seluruh Pengaduan, Pengguna, dan Penanggung Jawab dari Spreadsheet tanpa menimpa data Spreadsheet Anda.<br />
            *Pastikan opsi akses saat Deploy di Apps Script diatur ke: <strong>Siapa saja (Anyone)</strong>.
          </p>
        </div>
      </div>

      {/* Execution Result Alert */}
      {initResult && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start space-x-3 text-xs text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-emerald-900">Status Eksekusi Installer:</p>
            <p className="text-emerald-700 mt-1">{initResult}</p>
          </div>
        </div>
      )}

      {/* Direct Instructions Step-by-Step */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-6 shadow-sm space-y-4 text-slate-800">
        <h3 className="text-sm font-bold text-blue-900 tracking-tight flex items-center space-x-2 border-b border-blue-200 pb-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span>CARA MEMASUKKAN KODE KE GOOGLE APPS SCRIPT (2 HANYA DUA FILE)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">1</span>
              <strong className="text-slate-800 text-xs">FILE 1: Skrip (Kode.gs)</strong>
            </div>
            <p className="text-slate-600 leading-relaxed">
              1. Klik tombol <strong>+ (Tambah)</strong> di Apps Script ➔ Pilih <strong>Skrip</strong>.<br/>
              2. Beri nama <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-blue-600">Kode.gs</code>.<br/>
              3. Hapus kode bawaan dan tempel kode dari tab <strong>Kode.gs</strong> di bawah.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">2</span>
              <strong className="text-slate-800 text-xs">FILE 2: HTML (Index.html)</strong>
            </div>
            <p className="text-slate-600 leading-relaxed">
              1. Klik tombol <strong>+ (Tambah)</strong> di Apps Script ➔ Pilih <strong>HTML</strong>.<br/>
              2. Beri nama <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-blue-600">Index</code>.<br/>
              3. Hapus kode bawaan dan tempel kode dari tab <strong>Index.html</strong> di bawah.
            </p>
          </div>
        </div>
      </div>

      {/* Code Inspector Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        {/* Tab Switcher */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveCodeTab('gs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                activeCodeTab === 'gs'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>1. Kode.gs (Backend Script)</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('html')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                activeCodeTab === 'html'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>2. Index.html (Frontend Interface)</span>
            </button>
          </div>

          {activeCodeTab === 'gs' ? (
            <button
              onClick={handleCopyGs}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-blue-600 font-bold rounded-xl text-xs border border-slate-200 flex items-center space-x-1.5 transition"
            >
              {copiedGs ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedGs ? 'Kode.gs Tersalin!' : 'Salin Kode.gs'}</span>
            </button>
          ) : (
            <button
              onClick={handleCopyHtml}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-blue-600 font-bold rounded-xl text-xs border border-slate-200 flex items-center space-x-1.5 transition"
            >
              {copiedHtml ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedHtml ? 'Index.html Tersalin!' : 'Salin Index.html'}</span>
            </button>
          )}
        </div>

        {/* Code View */}
        <div>
          {activeCodeTab === 'gs' ? (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 block">Isi untuk file <code className="font-mono text-blue-600 font-bold">Kode.gs</code>:</span>
              <pre className="bg-slate-900 p-4 rounded-xl text-slate-200 font-mono text-[11px] overflow-x-auto max-h-96 border border-slate-800 leading-relaxed">
                {kodeGsContent}
              </pre>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 block">Isi untuk file <code className="font-mono text-blue-600 font-bold">Index.html</code>:</span>
              <pre className="bg-slate-900 p-4 rounded-xl text-slate-200 font-mono text-[11px] overflow-x-auto max-h-96 border border-slate-800 leading-relaxed">
                {indexHtmlContent}
              </pre>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

