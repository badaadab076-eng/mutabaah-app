/**
 * ============================================================
 *  MUTABAAH YAUMIYAH — BACKEND (Google Apps Script + Sheets)
 * ============================================================
 * Cara pakai (lihat PANDUAN_LENGKAP.md untuk detail lengkap):
 *  Sebagai TEMPLATE MASTER (dipasang Adab sekali saja):
 *   1. Buat Google Sheet baru, Extensions > Apps Script, tempel file ini.
 *   2. Isi TEMPLATE_SPREADSHEET_ID di bawah dengan ID Sheet ini (lihat URL).
 *   3. JANGAN jalankan bootstrap / deploy di file ini — guard di bawah akan menolaknya.
 *   4. Share "Anyone with link -> Viewer" (izinkan copy), salin link-nya.
 *
 *  Sebagai SALINAN milik kelompok/user baru (otomatis lewat wizard app):
 *   1. Buka menu 🕌 Setup Mutabaah -> Langkah 1: Inisialisasi Database
 *   2. Extensions > Apps Script -> Deploy > New deployment > Web app
 *      Execute as: Me · Who has access: Anyone
 *   3. Salin URL /exec, tempel di wizard aplikasi.
 * ============================================================
 */

/* ---------------------------------------------------------- */
/* KONFIGURASI                                                 */
/* ---------------------------------------------------------- */

const SHEET_NAMES = {
  MEMBERS: "Members",
  CONFIG: "Config",
  CUSTOM_ITEMS: "CustomItems",
  KAS: "KasEntries",
  MUTABAAH: "Mutabaah",
  BOOKMARKS: "Bookmarks",
  IURAN_CONFIG: "IuranConfig",
  IURAN_PAYMENTS: "IuranPayments",
};

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 hari, samakan dengan sesi app lama
const APP_VERSION = "2.1.0";

// --- Anti brute-force login ---
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 5 * 60 * 1000; // 5 menit

// ID Google Sheet TEMPLATE MASTER (bukan salinan siapa pun) — dipakai untuk
// mencegah bootstrap/deploy tidak sengaja dijalankan di file ini. ID Sheet
// selalu unik dan TIDAK IKUT BERUBAH saat orang lain "Buat Salinan", jadi
// pengecekan ini otomatis tidak berlaku lagi untuk semua salinan.
// Cara lihat ID: dari URL Sheet https://docs.google.com/spreadsheets/d/ID_DI_SINI/edit
const TEMPLATE_SPREADSHEET_ID = "1XTZwPCD4M803CDQHKyZwEMFbUIS6aJjkEnVCbbf_uFw";

function guardAgainstTemplate_() {
  const id = SpreadsheetApp.getActiveSpreadsheet().getId();
  if (id === TEMPLATE_SPREADSHEET_ID) {
    throw new Error(
      "Ini file TEMPLATE MASTER — jangan diinisialisasi/deploy langsung. " +
      "Buat salinan dulu lewat menu File > Buat salinan, baru jalankan di salinannya."
    );
  }
}

/* ---------------------------------------------------------- */
/* MENU KUSTOM — muncul otomatis tiap kali Sheet ini dibuka,   */
/* supaya "Inisialisasi Database" cukup 1 klik tanpa perlu     */
/* buka editor Apps Script atau cari fungsi di dropdown.        */
/* ---------------------------------------------------------- */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🕌 Setup Mutabaah')
    .addItem('Langkah 1: Inisialisasi Database', 'runBootstrapFromMenu_')
    .addToUi();
}

function runBootstrapFromMenu_() {
  const ui = SpreadsheetApp.getUi();
  try {
    bootstrap();
    ui.alert(
      '✅ Database siap!',
      'Langkah selanjutnya (masih perlu dilakukan manual sekali ini):\n\n' +
      '1. Buka menu Extensions → Apps Script\n' +
      '2. Klik tombol biru "Deploy" (kanan atas) → New deployment\n' +
      '3. Klik ikon ⚙️ di samping "Select type" → pilih Web app\n' +
      '4. Execute as: Me · Who has access: Anyone\n' +
      '5. Klik Deploy, lalu salin URL yang berakhiran /exec\n' +
      '6. Tempel URL itu di wizard aplikasi Mutabaah',
      ui.ButtonSet.OK
    );
  } catch (err) {
    ui.alert('❌ Gagal', 'Terjadi kesalahan: ' + (err && err.message || err), ui.ButtonSet.OK);
  }
}

/* ---------------------------------------------------------- */
/* BOOTSTRAP — jalankan sekali manual dari editor Apps Script   */
/* (atau lewat menu "🕌 Setup Mutabaah" di atas, lebih mudah)   */
/* ---------------------------------------------------------- */

function bootstrap() {
  guardAgainstTemplate_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  ensureSheet_(ss, SHEET_NAMES.MEMBERS,
    ["id", "name", "phone", "username", "passwordHash", "passwordSalt", "role", "active", "lastLoginAt"]);
  ensureSheet_(ss, SHEET_NAMES.CONFIG, ["key", "value"]);
  ensureSheet_(ss, SHEET_NAMES.CUSTOM_ITEMS, ["id", "name", "unit", "weeklyTarget"]);
  ensureSheet_(ss, SHEET_NAMES.KAS,
    ["id", "type", "amount", "desc", "date", "memberId", "createdBy", "createdAt"], ["date"]);
  ensureSheet_(ss, SHEET_NAMES.MUTABAAH,
    ["key", "memberId", "monday", "dataJson", "updatedAt"], ["monday"]);
  ensureSheet_(ss, SHEET_NAMES.BOOKMARKS,
    ["memberId", "juz", "surah", "ayat", "halaman", "updatedAt"]);
  ensureSheet_(ss, SHEET_NAMES.IURAN_CONFIG,
    ["memberId", "iuranITB", "iuranIWB"]);
  ensureSheet_(ss, SHEET_NAMES.IURAN_PAYMENTS,
    ["id", "memberId", "jenis", "bulan", "nominal", "tanggal", "catatan", "kasEntryId", "recordedBy", "createdAt"],
    ["bulan", "tanggal"]);

  // Buat 1 akun admin default jika Members masih kosong
  const membersSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  if (membersSheet.getLastRow() < 2) {
    const salt = generateSalt_();
    const hash = hashPassword_("admin123", salt);
    membersSheet.appendRow([
      Utilities.getUuid(), "Admin", "", "admin", hash, salt, "admin", true,
    ]);
  }

  // Pastikan ada SECRET untuk signing token
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty("TOKEN_SECRET")) {
    props.setProperty("TOKEN_SECRET", Utilities.getUuid() + Utilities.getUuid());
  }

  Logger.log("Bootstrap selesai. Akun admin default: admin / admin123 — SEGERA GANTI setelah login pertama.");
}

// plainTextCols: nama kolom yang HARUS diformat sebagai teks biasa, supaya Google Sheets
// tidak diam-diam mengubah nilai "2026-07-05" jadi object Date (yang bikin data "hilang"
// dari filter tanggal di app setelah refresh). Dijalankan tiap bootstrap, aman diulang.
function ensureSheet_(ss, name, headers, plainTextCols) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  (plainTextCols || []).forEach(col => {
    const idx = headers.indexOf(col);
    if (idx === -1) return;
    sheet.getRange(2, idx + 1, Math.max(sheet.getMaxRows() - 1, 1), 1).setNumberFormat("@");
  });
  return sheet;
}

/**
 * RESET BERSIH — jalankan manual dari editor Apps Script kalau ingin mulai
 * ulang dari nol (mis. setelah selesai testing). Ini akan:
 *  1. Mengosongkan SEMUA baris data di 6 tab (header tetap ada)
 *  2. Membuat ulang 1 akun admin default (admin / admin123)
 *  3. Mengganti TOKEN_SECRET, otomatis membuat SEMUA sesi login lama
 *     (di semua perangkat/anggota) tidak berlaku lagi -> semua wajib login ulang
 * PERINGATAN: tindakan ini tidak bisa dibatalkan. Pastikan memang ingin reset total.
 */
function resetAllData() {
  guardAgainstTemplate_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  [SHEET_NAMES.MEMBERS, SHEET_NAMES.CONFIG, SHEET_NAMES.CUSTOM_ITEMS,
   SHEET_NAMES.KAS, SHEET_NAMES.MUTABAAH, SHEET_NAMES.BOOKMARKS,
   SHEET_NAMES.IURAN_CONFIG, SHEET_NAMES.IURAN_PAYMENTS].forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) return;
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  });

  const membersSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  const salt = generateSalt_();
  const hash = hashPassword_("admin123", salt);
  membersSheet.appendRow([
    Utilities.getUuid(), "Admin", "", "admin", hash, salt, "admin", true,
  ]);

  const props = PropertiesService.getScriptProperties();
  props.setProperty("TOKEN_SECRET", Utilities.getUuid() + Utilities.getUuid());

  Logger.log("Reset selesai. Semua data lama sudah dikosongkan, semua sesi lama sudah tidak berlaku. Akun admin baru: admin / admin123 — segera ganti setelah login pertama di semua perangkat.");
}

/* ---------------------------------------------------------- */
/* ENTRY POINT WEB APP                                          */
/* ---------------------------------------------------------- */

function doGet(e) {
  return jsonOut_({ ok: true, message: "Mutabaah backend aktif. Gunakan POST." });
}

function doPost(e) {
  try {
    // Trik hindari CORS preflight: body dikirim sebagai text/plain dari client,
    // lalu di-parse manual di sini sebagai JSON.
    const body = JSON.parse(e.postData.contents || "{}");
    const action = body.action;
    const result = routeAction_(action, body);
    return jsonOut_(result);
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err && err.message || err) });
  }
}

function routeAction_(action, body) {
  switch (action) {
    case "ping": return actionPing_(body);
    case "login": return actionLogin_(body);
    case "getGroupData": return actionGetGroupData_(body);
    case "getWeek": return actionGetWeek_(body);
    case "saveWeek": return actionSaveWeek_(body);
    case "getBookmark": return actionGetBookmark_(body);
    case "saveBookmark": return actionSaveBookmark_(body);
    case "addKas": return actionAddKas_(body);
    case "deleteKas": return actionDeleteKas_(body);
    case "saveMembers": return actionSaveMembers_(body);
    case "saveConfig": return actionSaveConfig_(body);
    case "saveCustomItems": return actionSaveCustomItems_(body);
    case "changePassword": return actionChangePassword_(body);
    case "saveIuranConfig": return actionSaveIuranConfig_(body);
    case "addIuranPayment": return actionAddIuranPayment_(body);
    case "deleteIuranPayment": return actionDeleteIuranPayment_(body);
    default: return { ok: false, error: "Aksi tidak dikenal: " + action };
  }
}

/* ---------------------------------------------------------- */
/* PING — dipakai wizard "Buat Server Baru" untuk tes koneksi   */
/* ---------------------------------------------------------- */

function actionPing_(body) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let groupName = "";
  try {
    const configRows = readAllRows_(ss.getSheetByName(SHEET_NAMES.CONFIG));
    const configRow = configRows.find(r => r.key === "config");
    if (configRow) groupName = (JSON.parse(configRow.value) || {}).groupName || "";
  } catch (e) {}
  return {
    ok: true,
    message: "Mutabaah backend aktif",
    version: APP_VERSION,
    spreadsheetName: ss.getName(),
    groupName,
  };
}

/* ---------------------------------------------------------- */
/* AUTH & TOKEN                                                 */
/* ---------------------------------------------------------- */

function generateSalt_() {
  return Utilities.getUuid();
}

// Hash sederhana dengan stretching (bukan bcrypt, tapi cukup untuk skala kecil)
function hashPassword_(password, salt) {
  let digest = password + ":" + salt;
  for (let i = 0; i < 2000; i++) {
    const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, digest);
    digest = Utilities.base64Encode(bytes);
  }
  return digest;
}

// Perbandingan waktu-konstan (constant-time) untuk mencegah timing attack
// saat membandingkan hash password.
function safeEquals_(a, b) {
  const sa = String(a || "");
  const sb = String(b || "");
  if (sa.length !== sb.length) return false;
  let diff = 0;
  for (let i = 0; i < sa.length; i++) {
    diff |= sa.charCodeAt(i) ^ sb.charCodeAt(i);
  }
  return diff === 0;
}

// --- Anti brute-force: kunci login sementara setelah beberapa kali gagal ---
function checkLoginLockout_(username) {
  const cache = CacheService.getScriptCache();
  const key = "loginfail_" + username;
  const raw = cache.get(key);
  if (!raw) return null;
  const data = JSON.parse(raw);
  if (data.count >= LOGIN_MAX_ATTEMPTS && Date.now() < data.until) {
    const remainMin = Math.ceil((data.until - Date.now()) / 60000);
    return "Terlalu banyak percobaan gagal. Coba lagi dalam " + remainMin + " menit.";
  }
  return null;
}

function registerLoginFailure_(username) {
  const cache = CacheService.getScriptCache();
  const key = "loginfail_" + username;
  const raw = cache.get(key);
  const data = raw ? JSON.parse(raw) : { count: 0, until: 0 };
  data.count += 1;
  data.until = Date.now() + LOGIN_LOCKOUT_MS;
  cache.put(key, JSON.stringify(data), Math.ceil(LOGIN_LOCKOUT_MS / 1000));
}

function clearLoginFailure_(username) {
  CacheService.getScriptCache().remove("loginfail_" + username);
}

function signToken_(payload) {
  const secret = PropertiesService.getScriptProperties().getProperty("TOKEN_SECRET");
  const payloadStr = Utilities.base64EncodeWebSafe(JSON.stringify(payload));
  const sigBytes = Utilities.computeHmacSha256Signature(payloadStr, secret);
  const sig = Utilities.base64EncodeWebSafe(sigBytes);
  return payloadStr + "." + sig;
}

function verifyToken_(token) {
  if (!token || token.indexOf(".") === -1) return null;
  const [payloadStr, sig] = token.split(".");
  const secret = PropertiesService.getScriptProperties().getProperty("TOKEN_SECRET");
  const expectedSigBytes = Utilities.computeHmacSha256Signature(payloadStr, secret);
  const expectedSig = Utilities.base64EncodeWebSafe(expectedSigBytes);
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(payloadStr)).getDataAsString());
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

function requireAuth_(body) {
  const payload = verifyToken_(body.token);
  if (!payload) throw new Error("Sesi tidak valid, silakan login ulang");
  return payload; // { sub: memberId, role, exp }
}

function requireAdmin_(body) {
  const payload = requireAuth_(body);
  if (payload.role !== "admin") throw new Error("Hanya admin yang boleh melakukan aksi ini");
  return payload;
}

/* ---------------------------------------------------------- */
/* MEMBERS HELPERS                                              */
/* ---------------------------------------------------------- */

function getMembersSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.MEMBERS);
}

// PENTING: Google Sheets otomatis mengubah string tanggal ("2026-07-05") yang ditulis
// ke sel jadi object Date asli. Kalau dibaca mentah-mentah, itu berubah jadi timestamp UTC
// penuh (bisa mundur 1 hari akibat konversi timezone) dan TIDAK COCOK LAGI dengan format
// "yyyy-MM-dd" yang dipakai app untuk mencocokkan/filter data (mis. transaksi kas jadi
// "hilang" dari tampilan padahal datanya ada di sheet). Normalisasi di sini mencegah itu.
function normalizeCellValue_(header, value, tz) {
  if (!(value instanceof Date)) return value;
  if (/^(date|monday)$/i.test(header)) {
    return Utilities.formatDate(value, tz, "yyyy-MM-dd"); // kolom tanggal-saja
  }
  return value.toISOString(); // kolom timestamp (updatedAt dll) tetap presisi penuh
}

function readAllRows_(sheet) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const tz = Session.getScriptTimeZone();
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = normalizeCellValue_(h, row[i], tz); });
    return obj;
  });
}

function findMemberRowIndex_(sheet, predicate) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const tz = Session.getScriptTimeZone();
  for (let r = 1; r < values.length; r++) {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = normalizeCellValue_(h, values[r][i], tz); });
    if (predicate(obj)) return { rowIndex: r + 1, headers, obj };
  }
  return null;
}

/* ---------------------------------------------------------- */
/* ACTION: login                                                */
/* ---------------------------------------------------------- */

function actionLogin_(body) {
  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  const lockMsg = checkLoginLockout_(username);
  if (lockMsg) return { ok: false, error: lockMsg };

  const sheet = getMembersSheet_();
  const found = findMemberRowIndex_(sheet, m => m.username === username && m.active !== false);
  if (!found) {
    registerLoginFailure_(username);
    return { ok: false, error: "Username atau password salah" };
  }

  const hash = hashPassword_(password, found.obj.passwordSalt);
  if (!safeEquals_(hash, found.obj.passwordHash)) {
    registerLoginFailure_(username);
    return { ok: false, error: "Username atau password salah" };
  }
  clearLoginFailure_(username);

  // Catat waktu login terakhir — supaya admin bisa lihat anggota yang diundang
  // sudah aktif login atau belum, tanpa perlu tanya manual.
  withLock_(() => {
    const lastLoginCol = found.headers.indexOf("lastLoginAt") + 1;
    if (lastLoginCol > 0) {
      sheet.getRange(found.rowIndex, lastLoginCol).setValue(new Date().toISOString());
    }
  });

  const payload = {
    sub: found.obj.id,
    role: found.obj.role || "member",
    name: found.obj.name,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const token = signToken_(payload);
  return {
    ok: true,
    token,
    role: payload.role,
    memberId: found.obj.id,
    name: found.obj.name,
  };
}

function actionChangePassword_(body) {
  const auth = requireAuth_(body);
  const sheet = getMembersSheet_();
  const found = findMemberRowIndex_(sheet, m => m.id === auth.sub);
  if (!found) return { ok: false, error: "Akun tidak ditemukan" };

  const oldHash = hashPassword_(String(body.oldPassword || ""), found.obj.passwordSalt);
  if (!safeEquals_(oldHash, found.obj.passwordHash)) return { ok: false, error: "Password lama salah" };
  if (!body.newPassword || String(body.newPassword).length < 4) {
    return { ok: false, error: "Password baru minimal 4 karakter" };
  }

  return withLock_(() => {
    const newSalt = generateSalt_();
    const newHash = hashPassword_(String(body.newPassword), newSalt);
    const saltCol = found.headers.indexOf("passwordSalt") + 1;
    const hashCol = found.headers.indexOf("passwordHash") + 1;
    sheet.getRange(found.rowIndex, hashCol).setValue(newHash);
    sheet.getRange(found.rowIndex, saltCol).setValue(newSalt);
    return { ok: true };
  });
}

/* ---------------------------------------------------------- */
/* ACTION: getGroupData — config, members (tanpa hash), custom items, kas */
/* ---------------------------------------------------------- */

function actionGetGroupData_(body) {
  requireAuth_(body);
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const membersRaw = readAllRows_(ss.getSheetByName(SHEET_NAMES.MEMBERS));
  const members = membersRaw
    .filter(m => m.active !== false)
    .map(m => ({ id: m.id, name: m.name, phone: m.phone, role: m.role, username: m.username }));

  const configRows = readAllRows_(ss.getSheetByName(SHEET_NAMES.CONFIG));
  let config = {};
  const configRow = configRows.find(r => r.key === "config");
  if (configRow) { try { config = JSON.parse(configRow.value); } catch (e) {} }

  const customItems = readAllRows_(ss.getSheetByName(SHEET_NAMES.CUSTOM_ITEMS));
  const kasEntries = readAllRows_(ss.getSheetByName(SHEET_NAMES.KAS));
  const bookmarks = readAllRows_(ss.getSheetByName(SHEET_NAMES.BOOKMARKS)); // untuk teks berjalan tilawah
  const iuranConfig = readAllRows_(ss.getSheetByName(SHEET_NAMES.IURAN_CONFIG));
  const iuranPayments = readAllRows_(ss.getSheetByName(SHEET_NAMES.IURAN_PAYMENTS));

  return { ok: true, config, members, customItems, kasEntries, bookmarks, iuranConfig, iuranPayments };
}

/* ---------------------------------------------------------- */
/* ACTION: mutabaah mingguan                                    */
/* ---------------------------------------------------------- */

function actionGetWeek_(body) {
  const auth = requireAuth_(body);
  const memberId = String(body.memberId || "");
  if (auth.role !== "admin" && auth.sub !== memberId) {
    throw new Error("Tidak boleh melihat data anggota lain");
  }
  const monday = String(body.monday || "");
  const key = memberId + ":" + monday;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.MUTABAAH);
  const found = findMemberRowIndex_(sheet, r => r.key === key);
  if (!found) return { ok: true, data: { days: {} } };
  let data = { days: {} };
  try { data = JSON.parse(found.obj.dataJson); } catch (e) {}
  return { ok: true, data };
}

function actionSaveWeek_(body) {
  const auth = requireAuth_(body);
  const memberId = String(body.memberId || "");
  if (auth.role !== "admin" && auth.sub !== memberId) {
    throw new Error("Tidak boleh mengubah data anggota lain");
  }
  const monday = String(body.monday || "");
  const key = memberId + ":" + monday;
  return withLock_(() => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.MUTABAAH);
    const dataJson = JSON.stringify(body.data || { days: {} });
    const now = new Date().toISOString();

    const found = findMemberRowIndex_(sheet, r => r.key === key);
    if (found) {
      const jsonCol = found.headers.indexOf("dataJson") + 1;
      const updCol = found.headers.indexOf("updatedAt") + 1;
      sheet.getRange(found.rowIndex, jsonCol).setValue(dataJson);
      sheet.getRange(found.rowIndex, updCol).setValue(now);
    } else {
      sheet.appendRow([key, memberId, monday, dataJson, now]);
    }
    return { ok: true };
  });
}

/* ---------------------------------------------------------- */
/* ACTION: bookmark tilawah                                     */
/* ---------------------------------------------------------- */

function actionGetBookmark_(body) {
  const auth = requireAuth_(body);
  const memberId = String(body.memberId || auth.sub);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.BOOKMARKS);
  const found = findMemberRowIndex_(sheet, r => r.memberId === memberId);
  if (!found) return { ok: true, data: { juz: 1, surah: 1, ayat: 1, halaman: 1 } };
  return { ok: true, data: { juz: found.obj.juz, surah: found.obj.surah, ayat: found.obj.ayat, halaman: found.obj.halaman } };
}

function actionSaveBookmark_(body) {
  const auth = requireAuth_(body);
  const memberId = String(body.memberId || auth.sub);
  if (auth.role !== "admin" && auth.sub !== memberId) {
    throw new Error("Tidak boleh mengubah bookmark anggota lain");
  }
  return withLock_(() => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.BOOKMARKS);
    const d = body.data || {};
    const now = new Date().toISOString();
    const found = findMemberRowIndex_(sheet, r => r.memberId === memberId);
    if (found) {
      sheet.getRange(found.rowIndex, 1, 1, found.headers.length).setValues([[
        memberId, d.juz || 1, d.surah || 1, d.ayat || 1, d.halaman || 1, now,
      ]]);
    } else {
      sheet.appendRow([memberId, d.juz || 1, d.surah || 1, d.ayat || 1, d.halaman || 1, now]);
    }
    return { ok: true };
  });
}

/* ---------------------------------------------------------- */
/* ACTION: kas (khusus admin untuk tambah/hapus)                */
/* ---------------------------------------------------------- */

function actionAddKas_(body) {
  const auth = requireAdmin_(body);
  return withLock_(() => {
    const e = body.entry || {};
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.KAS);
    const id = e.id || Utilities.getUuid();
    sheet.appendRow([
      id, e.type, Number(e.amount) || 0, e.desc || "", e.date || "",
      e.memberId || "", auth.sub, new Date().toISOString(),
    ]);
    return { ok: true, id };
  });
}

function actionDeleteKas_(body) {
  requireAdmin_(body);
  return withLock_(() => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.KAS);
    const found = findMemberRowIndex_(sheet, r => r.id === body.id);
    if (found) sheet.deleteRow(found.rowIndex);
    return { ok: true };
  });
}

/* ---------------------------------------------------------- */
/* ACTION: kelola anggota, config, custom items (admin only)    */
/* ---------------------------------------------------------- */

function actionSaveMembers_(body) {
  requireAdmin_(body);
  return withLock_(() => {
    const sheet = getMembersSheet_();
    const existing = readAllRows_(sheet);
    const incoming = body.members || [];

    // Hapus semua baris data lama, tulis ulang (skala kecil, aman & simpel).
    // Dibungkus withLock_ supaya 2 admin yang edit hampir bersamaan tidak
    // saling menimpa perubahan satu sama lain.
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();

    let rowNum = 2;
    incoming.forEach(m => {
      const prev = existing.find(x => x.id === m.id);
      let passwordHash = prev ? prev.passwordHash : "";
      let passwordSalt = prev ? prev.passwordSalt : "";
      // Jika admin mengisi password baru untuk anggota ini, hash ulang
      if (m.newPassword) {
        passwordSalt = generateSalt_();
        passwordHash = hashPassword_(m.newPassword, passwordSalt);
      }
      if (!passwordSalt) {
        // anggota baru tanpa password di-set eksplisit -> beri password default = no. HP atau "mutabaah123"
        passwordSalt = generateSalt_();
        passwordHash = hashPassword_(m.defaultPassword || "mutabaah123", passwordSalt);
      }
      // Username: pertahankan nilai lama kalau client tidak mengirimkannya (jangan pernah wipe ke kosong)
      const username = m.username || (prev ? prev.username : "") || "";
      const lastLoginAt = prev ? prev.lastLoginAt || "" : ""; // jangan pernah direset manual dari sini
      sheet.getRange(rowNum, 1, 1, 9).setValues([[
        m.id || Utilities.getUuid(), m.name || "", m.phone || "",
        username, passwordHash, passwordSalt,
        m.role || (prev ? prev.role : "member"), m.active !== false, lastLoginAt,
      ]]);
      rowNum++;
    });
    return { ok: true };
  });
}

function actionSaveConfig_(body) {
  requireAdmin_(body);
  return withLock_(() => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.CONFIG);
    const found = findMemberRowIndex_(sheet, r => r.key === "config");
    const value = JSON.stringify(body.config || {});
    if (found) {
      sheet.getRange(found.rowIndex, 2).setValue(value);
    } else {
      sheet.appendRow(["config", value]);
    }
    return { ok: true };
  });
}

function actionSaveCustomItems_(body) {
  requireAdmin_(body);
  return withLock_(() => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.CUSTOM_ITEMS);
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    let rowNum = 2;
    (body.items || []).forEach(it => {
      sheet.getRange(rowNum, 1, 1, 4).setValues([[
        it.id || Utilities.getUuid(), it.name || "", it.unit || "bool", Number(it.weeklyTarget) || 1,
      ]]);
      rowNum++;
    });
    return { ok: true };
  });
}

/* ---------------------------------------------------------- */
/* ACTION: iuran (ITB/IWB/Sukarela) — nominal wajib per anggota  */
/* & pencatatan pembayaran, otomatis tercatat juga di Kas        */
/* ---------------------------------------------------------- */

function actionSaveIuranConfig_(body) {
  requireAdmin_(body);
  const incoming = body.items || []; // [{memberId, iuranITB, iuranIWB}]
  return withLock_(() => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.IURAN_CONFIG);
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    let rowNum = 2;
    incoming.forEach(it => {
      sheet.getRange(rowNum, 1, 1, 3).setValues([[
        it.memberId, Number(it.iuranITB) || 0, Number(it.iuranIWB) || 0,
      ]]);
      rowNum++;
    });
    return { ok: true };
  });
}

function actionAddIuranPayment_(body) {
  const auth = requireAdmin_(body);
  const p = body.payment || {};
  const id = Utilities.getUuid();
  const kasEntryId = Utilities.getUuid();
  const now = new Date().toISOString();
  const nominal = Number(p.nominal) || 0;
  const jenisLabel = { ITB: "ITB", IWB: "IWB", Sukarela: "Sukarela" }[p.jenis] || p.jenis;

  return withLock_(() => {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const membersSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
    const memberRow = findMemberRowIndex_(membersSheet, m => m.id === p.memberId);
    const memberName = memberRow ? memberRow.obj.name : "";

    const iuranSheet = ss.getSheetByName(SHEET_NAMES.IURAN_PAYMENTS);
    iuranSheet.appendRow([
      id, p.memberId || "", p.jenis || "", p.bulan || "", nominal,
      p.tanggal || toDateKey_(new Date()), p.catatan || "", kasEntryId, auth.sub, now,
    ]);

    // Otomatis tercatat juga sebagai pemasukan di Kas, supaya saldo kelompok tetap akurat
    // dan laporan Kas tidak perlu diisi dobel manual oleh admin.
    const kasSheet = ss.getSheetByName(SHEET_NAMES.KAS);
    kasSheet.appendRow([
      kasEntryId, "masuk", nominal,
      `Iuran ${jenisLabel} — ${memberName || "anggota"} (${p.bulan || ""})`,
      p.tanggal || toDateKey_(new Date()), p.memberId || "", auth.sub, now,
    ]);

    return { ok: true, id, kasEntryId };
  });
}

function actionDeleteIuranPayment_(body) {
  requireAdmin_(body);
  return withLock_(() => {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const iuranSheet = ss.getSheetByName(SHEET_NAMES.IURAN_PAYMENTS);
    const found = findMemberRowIndex_(iuranSheet, r => r.id === body.id);
    if (found) {
      // Hapus juga entri Kas yang otomatis dibuat waktu pembayaran ini dicatat,
      // supaya saldo Kas tidak jadi salah gara-gara entri yatim (orphan).
      const kasEntryId = found.obj.kasEntryId;
      if (kasEntryId) {
        const kasSheet = ss.getSheetByName(SHEET_NAMES.KAS);
        const kasFound = findMemberRowIndex_(kasSheet, r => r.id === kasEntryId);
        if (kasFound) kasSheet.deleteRow(kasFound.rowIndex);
      }
      iuranSheet.deleteRow(found.rowIndex);
    }
    return { ok: true };
  });
}

function toDateKey_(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

/* ---------------------------------------------------------- */
/* OUTPUT HELPER                                                */
/* ---------------------------------------------------------- */

// Cegah race condition saat beberapa perangkat menulis ke sheet yang sama
// hampir bersamaan (mis. 2 admin edit anggota di saat yang sama).
function withLock_(fn) {
  const lock = LockService.getScriptLock();
  const gotLock = lock.tryLock(10000); // tunggu maks 10 detik
  if (!gotLock) throw new Error("Server sedang sibuk, coba lagi sesaat.");
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
