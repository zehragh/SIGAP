/**
 * SIGAP - Sistem Informasi Pengaduan Pertanahan
 * Kantor Pertanahan Kota Parepare
 * 
 * File: SpreadsheetBuilder.gs
 * Description: Database Installer, Schema Auto-Provisioner, and Realtime Webhook Sync for Google Sheets
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

  Logger.log("Starting SIGAP Database Initialization...");

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
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Body request kosong" }))
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
      var defaultBody = "Halo Bapak/Ibu Penanggung Jawab,\n\nAnda telah ditugaskan untuk menangani pengaduan " + (data.complaintId || "") + ".\nMohon segera menindaklanjuti pada Sistem SIGAP PRO.\n\nTerima Kasih,\nKantor Pertanahan Kota Parepare";
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
  var sheet = ss.getSheetByName("PENGADUAN") || ss.getSheetByName("DATA_PENGADUAN");
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
  var sheet = ss.getSheetByName("PENGGUNA") || ss.getSheetByName("DATA_PENGGUNA");
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
  var sheet = ss.getSheetByName("LOG_AKTIVITAS") || ss.getSheetByName("DATA_LOG_AKTIVITAS");
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var lastRow = sheet.getLastRow();
  var values = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  var list = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var id = row[0] ? String(row[0]).trim() : '';
    if (id) {
      list.push({
        id: id,
        timestamp: row[1] ? String(row[1]).trim() : new Date().toISOString(),
        username: row[2] ? String(row[2]).trim() : 'system',
        nama_user: row[3] ? String(row[3]).trim() : 'System Administrator',
        role: row[4] ? String(row[4]).trim() : 'Admin Kantor Pertanahan',
        aktivitas: row[5] ? String(row[5]).trim() : 'Aktivitas',
        detail: row[6] ? String(row[6]).trim() : '',
        ip_address: row[7] ? String(row[7]).trim() : ''
      });
    }
  }
  return list;
}
