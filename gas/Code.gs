/**
 * SIGAP PRO - Kantor Pertanahan Kota Parepare
 * Google Apps Script Entry Point, RPC, & Webhook Receiver
 */

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
      .setTitle('SIGAP - Kantor Pertanahan Kota Parepare')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Webhook POST Handler for Web App Direct Synchronization
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Tidak ada data POST." }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === "initDatabase" || action === "initializeDatabase") {
      var resMsg = initializeDatabase();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: resMsg }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "sendEmailNotification" || data.sendEmailNotification) {
      var recipient = data.toEmail || data.email || "owlcity.irsyad25@gmail.com";
      var subject = data.subject || ("Notifikasi Penugasan Pengaduan Pertanahan - SIGAP Kantah Parepare (" + (data.complaintId || "") + ")");
      var defaultText = "Halo Bapak/Ibu Penanggung Jawab,\n\nAnda telah ditugaskan untuk menangani pengaduan " + (data.complaintId || "") + ".\nMohon segera menindaklanjuti pada Sistem SIGAP PRO.\n\nTerima Kasih,\nKantor Pertanahan Kota Parepare";
      var body = data.body || defaultText;
      try {
        MailApp.sendEmail({
          to: recipient,
          subject: subject,
          body: body
        });
        return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Email notifikasi penugasan berhasil dikirimkan via Apps Script MailApp ke " + recipient }))
          .setMimeType(ContentService.MimeType.JSON);
      } catch (mailErr) {
        return ContentService.createTextOutput(JSON.stringify({ status: "warning", message: "Simulasi email tercatat: " + mailErr.toString() }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    if (action === "syncAllData" || action === "syncData" || data.usersList || data.pengaduanList) {
      var payload = data.payload || data;
      syncAllToSheets(payload);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Seluruh data (Pengguna, Pengaduan, Penanggung Jawab, Master) berhasil disinkronkan ke Google Sheets!" }))
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

/**
 * Function to write full SIGAP dataset into Google Spreadsheet
 */
function syncAllToSheets(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;

  // 1. Ensure sheets exist
  initializeDatabase();

  // 2. Sync PENGGUNA
  if (payload.usersList && Array.isArray(payload.usersList)) {
    var usrSheet = ss.getSheetByName("PENGGUNA");
    if (usrSheet) {
      // Clear data rows below header
      if (usrSheet.getLastRow() > 1) {
        usrSheet.getRange(2, 1, usrSheet.getLastRow() - 1, usrSheet.getLastColumn()).clearContent();
      }
      var usrRows = payload.usersList.map(function(u) {
        return [
          u.id || '',
          u.username || '',
          u.nama || '',
          u.nip || '-',
          u.role || '',
          u.kelurahan_id || '',
          u.kelurahan_nama || 'Semua',
          u.email || '',
          u.no_hp || '',
          u.is_active !== false ? "Aktif" : "Nonaktif"
        ];
      });
      if (usrRows.length > 0) {
        usrSheet.getRange(2, 1, usrRows.length, usrRows[0].length).setValues(usrRows);
      }
    }
  }

  // 3. Sync MASTER_PENANGGUNG_JAWAB
  if (payload.masterPenanggungJawab && Array.isArray(payload.masterPenanggungJawab)) {
    var pjSheet = ss.getSheetByName("MASTER_PENANGGUNG_JAWAB");
    if (pjSheet) {
      if (pjSheet.getLastRow() > 1) {
        pjSheet.getRange(2, 1, pjSheet.getLastRow() - 1, pjSheet.getLastColumn()).clearContent();
      }
      var pjRows = payload.masterPenanggungJawab.map(function(pj) {
        return [
          pj.id || '',
          pj.nama || '',
          pj.seksi || '',
          pj.jabatan || '',
          pj.email || 'owlcity.irsyad25@gmail.com',
          pj.is_active !== false ? "Aktif" : "Nonaktif"
        ];
      });
      if (pjRows.length > 0) {
        pjSheet.getRange(2, 1, pjRows.length, pjRows[0].length).setValues(pjRows);
      }
    }
  }

  // 4. Sync PENGADUAN
  if (payload.pengaduanList && Array.isArray(payload.pengaduanList)) {
    var pgdSheet = ss.getSheetByName("PENGADUAN");
    if (pgdSheet) {
      if (pgdSheet.getLastRow() > 1) {
        pgdSheet.getRange(2, 1, pgdSheet.getLastRow() - 1, pgdSheet.getLastColumn()).clearContent();
      }
      var pgdRows = payload.pengaduanList.map(function(p) {
        return [
          p.id || '',
          p.nomor_agenda || '',
          p.tanggal_pengaduan || '',
          p.nama_pelapor || '',
          p.nik_pelapor || '',
          p.no_hp || '',
          p.email_pelapor || '',
          p.alamat_pelapor || '',
          p.kelurahan_id || '',
          p.kelurahan_nama || '',
          p.kecamatan_nama || '',
          p.lokasi_tanah || '',
          p.no_hak_sertipikat || '',
          p.luas_tanah_m2 || '',
          p.jenis_pengaduan_id || '',
          p.jenis_pengaduan_nama || '',
          p.sumber_id || '',
          p.sumber_nama || '',
          p.uraian_pengaduan || '',
          p.dokumen_lampiran ? JSON.stringify(p.dokumen_lampiran) : '',
          p.status_approval || '',
          p.alasan_penolakan || '',
          p.tanggal_approval || '',
          p.approved_by || '',
          p.status_pengaduan || '',
          p.seksi_penanggung_jawab || '',
          p.petugas_penanggung_jawab || '',
          p.created_by_user || '',
          p.created_by_role || '',
          p.created_at || '',
          p.updated_at || ''
        ];
      });
      if (pgdRows.length > 0) {
        pgdSheet.getRange(2, 1, pgdRows.length, pgdRows[0].length).setValues(pgdRows);
      }
    }
  }

  // 5. Sync LOG_AKTIVITAS
  if (payload.activityLogs && Array.isArray(payload.activityLogs)) {
    var logSheet = ss.getSheetByName("LOG_AKTIVITAS");
    if (logSheet) {
      if (logSheet.getLastRow() > 1) {
        logSheet.getRange(2, 1, logSheet.getLastRow() - 1, logSheet.getLastColumn()).clearContent();
      }
      var logRows = payload.activityLogs.map(function(l) {
        return [
          l.id || '',
          l.timestamp || '',
          l.username || '',
          l.nama_user || '',
          l.role || '',
          l.aktivitas || '',
          l.detail || '',
          l.ip_address || ''
        ];
      });
      if (logRows.length > 0) {
        logSheet.getRange(2, 1, logRows.length, logRows[0].length).setValues(logRows);
      }
    }
  }
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
}

