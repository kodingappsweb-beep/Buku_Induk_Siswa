// app.js — wrapper API ke Web App Google Apps Script + helper auth.
// GANTI nilai ini dengan URL Web App Anda setelah deploy (diakhiri /exec).
const API_BASE_URL = "PASTE_URL_WEB_APP_GAS_DI_SINI";

// -------------------------------------------------------------------- API --
// POST dikirim dengan Content-Type: text/plain supaya browser TIDAK mengirim
// preflight OPTIONS (Apps Script Web App tidak menangani OPTIONS dengan baik).
async function apiCall(action, params) {
  const token = localStorage.getItem("bis_token") || "";
  const body = JSON.stringify({ action, params, token });
  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body,
  });
  const data = await res.json();
  if (data && data.unauthorized) {
    localStorage.removeItem("bis_token");
    window.location.href = "index.html";
    throw new Error("Sesi berakhir");
  }
  return data;
}

function requireAuth() {
  if (!localStorage.getItem("bis_token")) {
    window.location.href = "index.html";
  }
}

async function doLogout() {
  try { await apiCall("logout", {}); } catch (e) { /* abaikan */ }
  localStorage.removeItem("bis_token");
  window.location.href = "index.html";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str === null || str === undefined ? "" : str;
  return div.innerHTML;
}

// Panggil di setiap halaman setelah DOM siap, untuk menampilkan nama sekolah/
// aplikasi dari Settings di navbar bila elemen #app-title / #school-name ada.
async function loadBranding() {
  try {
    const settings = await apiCall("getSettings", {});
    const titleEl = document.getElementById("app-title");
    if (titleEl) titleEl.textContent = settings.app_title || "Buku Induk Siswa";
    document.title = settings.app_title || "Buku Induk Siswa";
    if (settings.theme_color) {
      document.documentElement.style.setProperty("--primary", settings.theme_color);
    }
    return settings;
  } catch (e) {
    return {};
  }
}

// Konversi file <input type="file"> menjadi base64 (tanpa prefix data:...) —
// dipakai untuk upload foto siswa/logo lewat action "uploadImage".
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
