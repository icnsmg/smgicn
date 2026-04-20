// ===== KABINET APP =====
const DEFAULT_PASSWORDS = { admin: 'smg1234', user: 'contact1234' };

const DB = { companyName: 'Kabinet', companyLogo: '', klasifikasi: ['INFO', 'KATEGORI', 'PROMO'], konten: [], harga: [], kritik: [] };

const firebaseConfig = {
    apiKey: "AIzaSyD-C0pQl8Zd6baTg28RijkYncQdvBW_ewE",
    authDomain: "kabinetsmg.firebaseapp.com",
    projectId: "kabinetsmg",
    storageBucket: "kabinetsmg.firebasestorage.app",
    messagingSenderId: "372702391149",
    appId: "1:372702391149:web:ed6a9bca4070cf84110864",
    measurementId: "G-H4TLG98W2M",
    databaseURL: "https://kabinetsmg-default-rtdb.firebaseio.com"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ===== STATE =====
let currentUser = null;
let currentTab = 'konten';
let currentFilter = 'all';
let searchQuery = '';
let currentPage = 1;
const ITEMS_PER_PAGE = 7;
let editingContentId = null;
let expandedCards = new Set();
let searchMatches = [];
let searchActiveIndex = -1;
let searchNavActive = false;
let hargaSortCol = null;
let hargaSortDir = 1;
let loginType = 'admin';

// ===== DEBOUNCE =====
function debounce(fn, ms) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// ===== FIREBASE =====
function initData() {
    document.getElementById('loadingOverlay').style.display = 'flex';
    database.ref('kabinetDB').on('value', snap => {
        const data = snap.val();
        if (data) {
            Object.assign(DB, data);
            DB.konten = DB.konten || [];
            DB.harga = DB.harga || [];
            DB.kritik = DB.kritik || [];
            DB.klasifikasi = DB.klasifikasi || ['INFO', 'KATEGORI', 'PROMO'];
        } else {
            DB.konten = [
                { id: 1, judul: 'Cara Memesan Layanan', tanggal: '2026-04-15', klasifikasi: 'INFO', subject: 'Panduan lengkap cara memesan layanan kami melalui platform online.', content: '<p>Ikuti langkah-langkah berikut:</p><ul><li>Kunjungi website resmi</li><li>Pilih layanan</li><li>Isi formulir</li><li>Konfirmasi pembayaran</li></ul>', links: [{ name: 'Panduan Lengkap', url: '#' }] },
                { id: 2, judul: 'Paket Layanan HEBAT', tanggal: '2026-04-14', klasifikasi: 'PROMO', subject: 'Dapatkan paket HEBAT dengan harga spesial bulan ini.', content: '<p>Keunggulan paket HEBAT:</p><ol><li>100 Mbps</li><li>Unlimited quota</li><li>Gratis instalasi</li></ol>', links: [{ name: 'Daftar Sekarang', url: '#' }] },
                { id: 3, judul: 'Area Layanan', tanggal: '2026-04-13', klasifikasi: 'KATEGORI', subject: 'Kami melayani Jawa, Bali, Sumatera, dan Kalimantan.', content: '<p>Tersedia di: Jawa & Bali, Sumatera, Kalimantan.</p>', links: [] }
            ];
            DB.harga = [
                { bulan: 'APR', regional: 'Jawa & Bali', jenis: 'Baru', paket: 'Reguler', biaya: 250000, harga: 350000 },
                { bulan: 'APR', regional: 'Jawa & Bali', jenis: 'Existing', paket: 'Reguler', biaya: 0, harga: 350000 }
            ];
            saveData();
        }
        loadSettings();
        document.getElementById('loadingOverlay').style.display = 'none';
        if (currentUser) refreshCurrentTab();
    });
}

function saveData() {
    if (firebaseConfig.apiKey !== 'YOUR_API_KEY')
        database.ref('kabinetDB').set(DB).catch(() => showToast('Gagal menyimpan data', 'error'));
}

function loadSettings() {
    if (DB.companyName) {
        document.querySelector('.logo span').textContent = DB.companyName;
        const el = document.getElementById('companyName');
        if (el) el.value = DB.companyName;
    }
}

// ===== AUTH =====
document.addEventListener('DOMContentLoaded', () => { initData(); checkLoginStatus(); });

function showLoginModal(type) {
    loginType = type;
    document.getElementById('loginTitle').textContent = type === 'admin' ? 'Login Admin' : 'Login User';
    document.getElementById('loginModal').classList.add('active');
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').style.display = 'none';
}

function handleLogin() {
    const pw = document.getElementById('loginPassword').value;
    if (pw === DEFAULT_PASSWORDS[loginType]) {
        currentUser = loginType;
        localStorage.setItem('kabinetUser', loginType);
        closeModal('loginModal');
        showMainContent();
        showToast('Berhasil login sebagai ' + (loginType === 'admin' ? 'Admin' : 'User'), 'success');
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('kabinetUser');
    showLandingPage();
    showToast('Berhasil logout', 'info');
}

function checkLoginStatus() {
    const saved = localStorage.getItem('kabinetUser');
    if (saved) { currentUser = saved; showMainContent(); }
    else showLandingPage();
}

function showLandingPage() {
    document.getElementById('landingPage').style.display = 'flex';
    hideAllViews();
    document.getElementById('mainNav').classList.remove('visible');
    const hs = document.getElementById('headerSearch');
    if (hs) hs.style.display = 'none';
    document.getElementById('floatingBtn').style.display = 'none';
    document.getElementById('headerActions').innerHTML = `
    <button class="btn btn-outline" onclick="showLoginModal('admin')"><i class="fas fa-user-shield"></i> Login Admin</button>
    <button class="btn btn-primary" onclick="showLoginModal('user')"><i class="fas fa-user"></i> Login User</button>`;
}

function hideAllViews() {
    ['viewKonten', 'viewHarga', 'viewKritik', 'viewSettings'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function showMainContent() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('mainNav').classList.add('visible');
    document.getElementById('floatingBtn').style.display = currentUser === 'user' ? 'flex' : 'none';
    const ha = document.getElementById('headerActions');
    if (currentUser === 'admin') {
        ha.innerHTML = `
      <button class="btn btn-sm btn-outline" onclick="switchTab('settings')"><i class="fas fa-cog"></i></button>
      <button class="btn btn-sm btn-outline" onclick="showAdminKontenModal()"><i class="fas fa-list"></i> Kelola</button>
      <button class="btn btn-sm btn-outline" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</button>`;
    } else {
        ha.innerHTML = `<button class="btn btn-outline" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</button>`;
    }
    switchTab('konten');
}

// ===== TAB NAVIGATION =====
function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    hideAllViews();
    const hs = document.getElementById('headerSearch');
    if (hs) hs.style.display = tab === 'konten' && currentUser ? 'flex' : 'none';
    const view = document.getElementById('view' + tab.charAt(0).toUpperCase() + tab.slice(1));
    if (view) view.style.display = 'block';
    if (tab === 'konten') renderKontenView();
    else if (tab === 'harga') renderHargaView();
    else if (tab === 'kritik') renderKritikView();
}

function refreshCurrentTab() { switchTab(currentTab); }

// ===== KONTEN VIEW =====
function renderKontenView() {
    renderFilterPills();
    const bar = document.getElementById('adminKontenBar');
    if (bar) bar.style.display = currentUser === 'admin' ? 'flex' : 'none';
    if (currentUser === 'admin') renderKlasifikasi();
    renderCards();
}

// ===== SEARCH =====
const debouncedSearch = debounce(() => {
    searchQuery = document.getElementById('searchInput').value.trim();
    document.getElementById('searchClear').classList.toggle('visible', searchQuery.length > 0);
    exitSearchNav();
    currentPage = 1;
    renderCards();
}, 280);

function onSearchKeyDown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (searchNavActive) {
            nextMatch();
        } else {
            enterSearchNav();
        }
    }
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    searchQuery = '';
    document.getElementById('searchClear').classList.remove('visible');
    exitSearchNav();
    currentPage = 1;
    renderCards();
}

function enterSearchNav() {
    searchMatches = [...document.querySelectorAll('#cardsContainer .highlight-text')];
    if (!searchMatches.length) { showToast('Tidak ada hasil ditemukan', 'info'); return; }
    searchNavActive = true;
    searchActiveIndex = 0;
    updateActiveHighlight();
    showSearchNavBar();
}

function exitSearchNav() {
    searchNavActive = false;
    searchMatches = [];
    searchActiveIndex = -1;
    document.querySelectorAll('.highlight-active').forEach(el => {
        el.classList.remove('highlight-active');
    });
    const nb = document.getElementById('searchNavBar');
    if (nb) nb.style.display = 'none';
}

function nextMatch() {
    if (!searchMatches.length) return;
    searchActiveIndex = (searchActiveIndex + 1) % searchMatches.length;
    updateActiveHighlight();
}

function prevMatch() {
    if (!searchMatches.length) return;
    searchActiveIndex = (searchActiveIndex - 1 + searchMatches.length) % searchMatches.length;
    updateActiveHighlight();
}

function updateActiveHighlight() {
    searchMatches.forEach((el, i) => el.classList.toggle('highlight-active', i === searchActiveIndex));
    if (searchMatches[searchActiveIndex]) {
        searchMatches[searchActiveIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    document.getElementById('snbPos').textContent = `${searchActiveIndex + 1} / ${searchMatches.length}`;
}

function showSearchNavBar() {
    const nb = document.getElementById('searchNavBar');
    nb.style.display = 'flex';
    document.getElementById('snbCount').textContent = `${searchMatches.length} hasil ditemukan`;
    document.getElementById('snbPos').textContent = `1 / ${searchMatches.length}`;
}

function fuzzyMatch(text, query) {
    if (!query) return true;
    const t = text.toLowerCase(), q = query.toLowerCase();
    if (t.includes(q)) return true;
    let mismatches = 0;
    for (let i = 0; i < q.length && mismatches <= 1; i++) {
        if (!t.includes(q[i])) mismatches++;
    }
    return mismatches <= 1;
}

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function stripHtml(html) {
    const d = document.createElement('div'); d.innerHTML = html;
    return d.textContent || d.innerText || '';
}

function highlightWords(html, query) {
    if (!query) return html;
    const words = query.trim().split(/\s+/).filter(w => w.length > 0);
    let result = html;
    words.forEach(word => {
        const rx = new RegExp(`(${escapeRegex(word)})`, 'gi');
        result = result.replace(rx, '<span class="highlight-text">$1</span>');
    });
    return result;
}

// ===== FILTER =====
function filterByCategory(cat) {
    currentFilter = cat;
    document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.toggle('active', p.dataset.filter === cat));
    currentPage = 1;
    renderCards();
}

function renderFilterPills() {
    const c = document.getElementById('filterPills');
    if (!c) return;
    const cats = ['all', ...DB.klasifikasi];
    c.innerHTML = cats.map(cat => `<button class="pill ${cat === currentFilter || (!currentFilter && cat === 'all') ? 'active' : ''}" data-filter="${cat}" onclick="filterByCategory('${cat}')">${cat === 'all' ? 'Semua' : cat}</button>`).join('');
}

// ===== RENDER CARDS =====
function renderCards() {
    const c = document.getElementById('cardsContainer');
    if (!c) return;
    let items = [...DB.konten];
    if (currentFilter !== 'all') items = items.filter(k => k.klasifikasi === currentFilter);
    if (searchQuery) {
        const words = searchQuery.trim().split(/\s+/).filter(w => w.length > 0);
        items = items.filter(k => words.some(w =>
            fuzzyMatch(k.judul, w) || fuzzyMatch(stripHtml(k.subject || ''), w) || fuzzyMatch(stripHtml(k.content || ''), w)
        ));
        const rb = document.getElementById('resultBar');
        if (rb) { rb.style.display = 'block'; document.getElementById('resultBarText').textContent = `${items.length} konten ditemukan untuk "${searchQuery}"`; }
    } else {
        const rb = document.getElementById('resultBar'); if (rb) rb.style.display = 'none';
    }
    items.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    const total = Math.ceil(items.length / ITEMS_PER_PAGE);
    if (currentPage > total) currentPage = 1;
    const paged = items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    if (!paged.length) {
        c.innerHTML = '<div class="empty-state"><i class="fas fa-folder-open"></i><p>Tidak ada konten ditemukan</p></div>';
    } else {
        c.innerHTML = paged.map(k => renderCard(k)).join('');
    }
    renderPagination(total);
}

function renderCard(k) {
    let isAutoExpanded = false;
    if (searchQuery) {
        const words = searchQuery.trim().split(/\s+/).filter(w => w.length > 0);
        isAutoExpanded = words.some(w => fuzzyMatch(stripHtml(k.content || ''), w));
    }
    const expanded = expandedCards.has(k.id) || isAutoExpanded;
    const subjectHtml = k.subject || '';
    const subjectText = stripHtml(subjectHtml);
    const wc = subjectText.split(/\s+/).filter(w => w).length;
    const showMore = k.content && stripHtml(k.content).trim().length > 0;
    let subjectDisplay = searchQuery ? highlightWords(subjectHtml, searchQuery) : subjectHtml;
    let contentDisplay = searchQuery ? highlightWords(k.content || '', searchQuery) : (k.content || '');
    let judulDisplay = searchQuery ? highlightWords(k.judul || '', searchQuery) : (k.judul || '');

    const linksHtml = (k.links && k.links.length)
        ? `<div class="card-links-inline" onclick="event.stopPropagation()">${k.links.map(l => `<a href="${l.url}" class="card-btn" target="_blank" onclick="event.stopPropagation()"><i class="fas fa-external-link-alt"></i> ${l.name}</a>`).join('')}</div>` : '';

    let statusBadge = '';
    if (k.status === 'Tidak Berlaku') {
        statusBadge = `<span class="card-status invalid" style="padding:.2rem .65rem;font-size:.7rem;font-weight:700;text-transform:uppercase;border-radius:var(--radius-full);background:var(--error);color:#fff">TIDAK BERLAKU</span>`;
    } else {
        statusBadge = `<span class="card-status valid" style="padding:.2rem .65rem;font-size:.7rem;font-weight:700;text-transform:uppercase;border-radius:var(--radius-full);background:var(--success);color:#fff">BERLAKU</span>`;
    }

    return `<div class="content-card ${k.status === 'Tidak Berlaku' ? 'inactive-card' : ''}" onclick="toggleCard(${k.id})">
    <div class="card-header">
      <h3 class="card-title">${judulDisplay}</h3>
      <div class="card-meta">
        ${statusBadge}
        <span class="card-klasifikasi">${k.klasifikasi}</span>
        <span class="card-date">${formatDate(k.tanggal)}</span>
      </div>
    </div>
    <div class="card-subject">${subjectDisplay}</div>
    ${linksHtml}
    ${showMore ? `
    <div class="card-expand ${expanded ? 'expanded' : ''}">
      <div class="card-content">${contentDisplay}</div>
    </div>
    <button class="card-btn card-btn-expand" onclick="event.stopPropagation();toggleCard(${k.id})">
      ${expanded ? 'Tutup' : 'Selengkapnya'} <i class="fas fa-chevron-${expanded ? 'up' : 'down'}"></i>
    </button>` : ''}
  </div>`;
}

function toggleCard(id) {
    if (window.getSelection().toString().length > 0) return;
    if (expandedCards.has(id)) expandedCards.delete(id); else expandedCards.add(id);
    renderCards();
    if (searchNavActive) setTimeout(() => {
        searchMatches = [...document.querySelectorAll('#cardsContainer .highlight-text')];
        if (searchActiveIndex >= searchMatches.length) searchActiveIndex = 0;
        updateActiveHighlight();
    }, 450);
}

function renderPagination(total) {
    const c = document.getElementById('pagination');
    if (!c || total <= 1) { if (c) c.innerHTML = ''; return; }
    let h = `<button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= currentPage - 2 && i <= currentPage + 2)) h += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        else if (i === currentPage - 3 || i === currentPage + 3) h += `<span class="pagination-btn">...</span>`;
    }
    h += `<button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${currentPage === total ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
    c.innerHTML = h;
}

function changePage(p) { currentPage = p; renderCards(); window.scrollTo({ top: 0, behavior: 'smooth' }); }

// ===== ADMIN KONTEN =====
function showAdminKontenModal() {
    renderContentList();
    document.getElementById('adminKontenModal').classList.add('active');
}

function renderKlasifikasi() {
    const c = document.getElementById('klasifikasiList');
    const sel = document.getElementById('contentKlasifikasi');
    if (c) c.innerHTML = DB.klasifikasi.map(k => `<span class="klasifikasi-tag">${k}<button onclick="deleteKlasifikasi('${k}')"><i class="fas fa-times"></i></button></span>`).join('');
    if (sel) sel.innerHTML = DB.klasifikasi.map(k => `<option value="${k}">${k}</option>`).join('');
}

function addKlasifikasi() {
    const inp = document.getElementById('newKlasifikasi');
    const name = inp.value.trim().toUpperCase();
    if (name && !DB.klasifikasi.includes(name)) {
        DB.klasifikasi.push(name); saveData(); inp.value = ''; renderKlasifikasi(); renderFilterPills(); showToast('Klasifikasi ditambahkan', 'success');
    }
}

function deleteKlasifikasi(name) {
    if (confirm(`Hapus klasifikasi "${name}"?`)) {
        DB.klasifikasi = DB.klasifikasi.filter(k => k !== name); saveData(); renderKlasifikasi(); renderFilterPills(); showToast('Klasifikasi dihapus', 'success');
    }
}

function showContentForm(id = null) {
    editingContentId = id;
    document.getElementById('contentModalTitle').textContent = id ? 'Edit Konten' : 'Tambah Konten';
    renderKlasifikasi();
    if (id) {
        const k = DB.konten.find(x => x.id === id);
        document.getElementById('contentJudul').value = k.judul;
        document.getElementById('contentTanggal').value = k.tanggal;
        document.getElementById('contentKlasifikasi').value = k.klasifikasi;
        document.getElementById('contentStatus').value = k.status || 'Berlaku';
        document.getElementById('contentSubjectEditor').innerHTML = k.subject || '';
        document.getElementById('contentEditor').innerHTML = k.content || '';
        renderExternalLinks(k.links || []);
    } else {
        document.getElementById('contentJudul').value = '';
        document.getElementById('contentTanggal').value = new Date().toISOString().split('T')[0];
        document.getElementById('contentStatus').value = 'Berlaku';
        document.getElementById('contentSubjectEditor').innerHTML = '';
        document.getElementById('contentEditor').innerHTML = '';
        renderExternalLinks([]);
    }
    document.getElementById('contentModal').classList.add('active');
    updateSubjectCount();
}

function renderExternalLinks(links) {
    const c = document.getElementById('externalLinks');
    c.innerHTML = (links.length ? links : [{}]).map(l => `
    <div class="external-link-item">
      <input type="text" placeholder="Nama file" class="link-name" value="${l.name || ''}">
      <input type="text" placeholder="URL" class="link-url" value="${l.url || ''}">
      <button type="button" class="btn-remove" onclick="removeLinkField(this)"><i class="fas fa-times"></i></button>
    </div>`).join('');
}

function addLinkField() {
    const c = document.getElementById('externalLinks'), d = document.createElement('div');
    d.className = 'external-link-item';
    d.innerHTML = `<input type="text" placeholder="Nama file" class="link-name"><input type="text" placeholder="URL" class="link-url"><button type="button" class="btn-remove" onclick="removeLinkField(this)"><i class="fas fa-times"></i></button>`;
    c.appendChild(d);
}
function removeLinkField(btn) { btn.parentElement.remove(); }

function saveContent() {
    const judul = document.getElementById('contentJudul').value.trim();
    const tanggal = document.getElementById('contentTanggal').value;
    const klasifikasi = document.getElementById('contentKlasifikasi').value;
    const status = document.getElementById('contentStatus').value;
    const subjectEl = document.getElementById('contentSubjectEditor');
    const subject = subjectEl.innerHTML.trim();
    const subjectText = subjectEl.textContent.trim();
    const content = document.getElementById('contentEditor').innerHTML;
    if (!judul || !subjectText) { showToast('Judul dan Subject wajib diisi!', 'error'); return; }
    const links = [];
    document.querySelectorAll('.external-link-item').forEach(item => {
        const n = item.querySelector('.link-name').value.trim(), u = item.querySelector('.link-url').value.trim();
        if (n && u) links.push({ name: n, url: u });
    });
    if (editingContentId) {
        const idx = DB.konten.findIndex(k => k.id === editingContentId);
        DB.konten[idx] = { id: editingContentId, judul, tanggal, klasifikasi, status, subject, content, links };
    } else {
        DB.konten.push({ id: Date.now(), judul, tanggal, klasifikasi, status, subject, content, links });
    }
    saveData(); closeModal('contentModal'); renderKontenView(); showToast('Konten berhasil disimpan!', 'success');
}

function renderContentList() {
    const c = document.getElementById('contentList');
    if (!c) return;
    const sorted = [...DB.konten].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    if (!sorted.length) { c.innerHTML = '<div class="empty-state"><p>Belum ada konten</p></div>'; return; }
    c.innerHTML = sorted.map(k => `
    <div class="content-item">
      <div class="content-item-info">
        <div class="content-item-title">${k.judul}</div>
        <div class="content-item-meta"><span>${k.klasifikasi}</span><span>${formatDate(k.tanggal)}</span></div>
      </div>
      <div class="content-item-actions">
        <button class="btn btn-sm btn-outline" onclick="showContentForm(${k.id})"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteContent(${k.id})"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
}

function editContent(id) { closeModal('adminKontenModal'); showContentForm(id); }

function deleteContent(id) {
    if (confirm('Hapus konten ini?')) {
        DB.konten = DB.konten.filter(k => k.id !== id); saveData(); renderContentList(); renderCards(); showToast('Konten dihapus', 'success');
    }
}

function updateSubjectCount() {
    const el = document.getElementById('contentSubjectEditor'); if (!el) return;
    document.getElementById('subjectCount').textContent = el.textContent.trim().split(/\s+/).filter(w => w).length;
}
function formatSubject(cmd) { document.getElementById('contentSubjectEditor').focus(); document.execCommand(cmd, false, null); updateSubjectCount(); }
function formatDoc(cmd) { document.execCommand(cmd, false, null); }
function showColorPicker() { document.getElementById('textColorPicker').click(); }
function setTextColor(c) { document.execCommand('foreColor', false, c); }
function insertHyperlink() { const u = prompt('URL:'); if (u) document.execCommand('createLink', false, u); }

// ===== HARGA VIEW =====
function renderHargaView() {
    const panel = document.getElementById('hargaInputPanel');
    if (panel) panel.style.display = currentUser === 'admin' ? 'block' : 'none';
    renderHargaTable();
}

function switchInputMethod(method) {
    document.querySelectorAll('.method-btn').forEach(b => b.classList.toggle('active', b.dataset.method === method));
    document.querySelectorAll('.method-content').forEach(c => c.style.display = 'none');
    const el = document.getElementById('method-' + method);
    if (el) el.style.display = 'block';
}

function calcHargaPreview() {
    const biaya = parseInt(document.getElementById('hargaBiayaPasang').value) || 0;
    const harga = parseInt(document.getElementById('hargaPaketHarga').value) || 0;
    if (!biaya && !harga) { document.getElementById('hargaPreview').style.display = 'none'; return; }
    const ppn = Math.round(harga * 0.11);
    const total = biaya + harga + ppn;
    document.getElementById('hargaPreview').style.display = 'flex';
    document.getElementById('previewPPN').textContent = formatRupiah(ppn);
    document.getElementById('previewTotal').textContent = formatRupiah(total);
}

function saveHarga() {
    const bulan = document.getElementById('hargaBulanInput').value;
    const regional = document.getElementById('hargaRegionalInput').value;
    const jenis = document.getElementById('hargaJenisInput').value;
    const paket = document.getElementById('hargaPaketInput').value;
    const biaya = parseInt(document.getElementById('hargaBiayaPasang').value) || 0;
    const harga = parseInt(document.getElementById('hargaPaketHarga').value) || 0;
    if (!harga) { showToast('Harga wajib diisi!', 'error'); return; }
    DB.harga.push({ bulan, regional, jenis, paket, biaya, harga });
    saveData(); renderHargaTable();
    document.getElementById('hargaBiayaPasang').value = '';
    document.getElementById('hargaPaketHarga').value = '';
    document.getElementById('hargaPreview').style.display = 'none';
    showToast('Harga berhasil disimpan!', 'success');
}

function parsePastedData() {
    const raw = document.getElementById('pasteExcelData').value.trim();
    if (!raw) { showToast('Data kosong!', 'error'); return; }
    const lines = raw.split('\n').filter(l => l.trim());
    let count = 0;
    // Detect header row
    const firstCols = lines[0].split('\t').map(c => c.trim().toLowerCase());
    const hasHeader = firstCols.some(c => ['bulan', 'regional', 'jenis', 'paket'].includes(c));
    const dataLines = hasHeader ? lines.slice(1) : lines;
    dataLines.forEach(line => {
        const cols = line.split('\t').map(c => c.trim());
        if (cols.length >= 6) {
            DB.harga.push({ bulan: cols[0].toUpperCase(), regional: cols[1], jenis: cols[2], paket: cols[3], biaya: parseInt(cols[4]) || 0, harga: parseInt(cols[5]) || 0 });
            count++;
        } else if (cols.length >= 5) {
            DB.harga.push({ bulan: cols[0].toUpperCase(), regional: cols[1], jenis: cols[2], paket: cols[3], biaya: 0, harga: parseInt(cols[4]) || 0 });
            count++;
        }
    });
    if (count) { saveData(); renderHargaTable(); document.getElementById('pasteExcelData').value = ''; showToast(`${count} data berhasil diimport!`, 'success'); }
    else showToast('Format data tidak valid. Pastikan kolom dipisah dengan Tab.', 'error');
}

function handleFileDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processExcelFile(file);
}

function uploadExcel(e) {
    const file = e.target.files[0];
    if (file) processExcelFile(file);
}

function processExcelFile(file) {
    if (!window.XLSX) { showToast('Library Excel belum dimuat', 'error'); return; }
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const wb = XLSX.read(e.target.result, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
            let count = 0;
            const headerRow = rows[0].map(c => String(c).trim().toLowerCase());
            const hasHeader = headerRow.some(c => ['bulan', 'regional', 'jenis', 'paket'].includes(c));
            const dataRows = hasHeader ? rows.slice(1) : rows;
            dataRows.forEach(row => {
                if (row.length >= 5 && row.some(c => c !== '')) {
                    DB.harga.push({
                        bulan: String(row[0]).toUpperCase().trim(),
                        regional: String(row[1]).trim(),
                        jenis: String(row[2]).trim(),
                        paket: String(row[3]).trim(),
                        biaya: parseInt(row[4]) || 0,
                        harga: parseInt(row[5]) || 0
                    });
                    count++;
                }
            });
            if (count) { saveData(); renderHargaTable(); showToast(`${count} data berhasil diimport dari Excel!`, 'success'); }
            else showToast('Tidak ada data valid di file', 'error');
        } catch (err) { showToast('Gagal membaca file: ' + err.message, 'error'); }
    };
    reader.readAsArrayBuffer(file);
}

function filterHarga() { renderHargaTable(); }

function renderHargaTable() {
    const c = document.getElementById('hargaTable');
    if (!c) return;
    const bulan = document.getElementById('hargaBulan').value;
    const regional = document.getElementById('hargaRegional').value;
    const jenis = document.getElementById('hargaJenis').value;
    const paket = document.getElementById('hargaPaketFilter').value;
    let items = [...DB.harga];
    if (bulan) items = items.filter(h => h.bulan === bulan);
    if (regional) items = items.filter(h => h.regional === regional);
    if (jenis) items = items.filter(h => h.jenis === jenis);
    if (paket) items = items.filter(h => h.paket === paket);
    if (!items.length) { c.innerHTML = '<div class="empty-state"><i class="fas fa-table"></i><p>Tidak ada data harga</p></div>'; return; }
    c.innerHTML = `<table>
    <thead><tr><th>Bulan</th><th>Regional</th><th>Jenis</th><th>Paket</th><th>Biaya Pasang</th><th>Harga Paket</th><th>PPN 11%</th><th>Total</th>${currentUser === 'admin' ? '<th>Aksi</th>' : ''}</tr></thead>
    <tbody>${items.map((h, i) => {
        const ppn = Math.round((h.harga || 0) * 0.11);
        const total = (h.biaya || 0) + (h.harga || 0) + ppn;
        const realIdx = DB.harga.indexOf(h);
        return `<tr>
        <td>${h.bulan}</td><td>${h.regional}</td><td>${h.jenis}</td><td>${h.paket}</td>
        <td>${formatRupiah(h.biaya)}</td><td>${formatRupiah(h.harga)}</td>
        <td>${formatRupiah(ppn)}</td><td><strong>${formatRupiah(total)}</strong></td>
        ${currentUser === 'admin' ? `<td><button class="btn btn-sm btn-danger" onclick="deleteHarga(${realIdx})"><i class="fas fa-trash"></i></button></td>` : ''}
      </tr>`;
    }).join('')}</tbody></table>`;
}

function deleteHarga(idx) {
    if (confirm('Hapus data ini?')) {
        DB.harga.splice(idx, 1); saveData(); renderHargaTable(); showToast('Data dihapus', 'success');
    }
}

function downloadTemplate() {
    if (!window.XLSX) { showToast('Library Excel belum dimuat', 'error'); return; }
    const ws = XLSX.utils.aoa_to_sheet([
        ['Bulan', 'Regional', 'Jenis', 'Paket', 'Biaya Pasang', 'Harga Paket'],
        ['APR', 'Jawa & Bali', 'Baru', 'Reguler', 250000, 350000],
        ['APR', 'Sumatera & Kalimantan', 'Baru', 'HEBAT 3', 200000, 450000]
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Harga');
    XLSX.writeFile(wb, 'template_harga.xlsx');
    showToast('Template didownload!', 'success');
}

// ===== KRITIK & SARAN =====
function renderKritikView() {
    const formCard = document.getElementById('kritikFormCard');
    if (formCard) formCard.style.display = currentUser === 'admin' ? 'none' : 'block';
    renderKritikThreads();
}

function submitKritikNew() {
    const nama = document.getElementById('kritikNamaInput').value.trim();
    const isi = document.getElementById('kritikIsiInput').value.trim();
    if (!isi) { showToast('Kritik/Saran wajib diisi!', 'error'); return; }
    DB.kritik.push({ id: Date.now(), nama, isi, tanggal: new Date().toISOString(), dibaca: false, replies: [] });
    saveData();
    document.getElementById('kritikNamaInput').value = '';
    document.getElementById('kritikIsiInput').value = '';
    renderKritikThreads();
    showToast('Terima kasih atas masukan Anda!', 'success');
}

function renderKritikThreads() {
    const c = document.getElementById('kritikThreads');
    if (!c) return;
    const sorted = [...(DB.kritik || [])].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    if (!sorted.length) { c.innerHTML = '<div class="empty-state"><i class="fas fa-comments"></i><p>Belum ada kritik/saran</p></div>'; return; }
    c.innerHTML = sorted.map((k, i) => {
        const realIdx = DB.kritik.findIndex(x => x.id === k.id);
        const initials = (k.nama || 'A').charAt(0).toUpperCase();
        const replies = (k.replies || []).map(r => `
      <div class="reply-card">
        <div class="reply-header">
          <div class="reply-avatar" style="background:var(--accent)">A</div>
          <span class="reply-name">Admin</span>
          <span class="reply-date">${formatDate(r.tanggal)}</span>
        </div>
        <div class="reply-isi">${r.isi}</div>
      </div>`).join('');
        const replyForm = currentUser === 'admin' ? `
      <div class="admin-reply-form">
        <textarea id="replyInput-${realIdx}" placeholder="Tulis balasan..." rows="2"></textarea>
        <button class="btn btn-sm btn-primary" onclick="submitReply(${realIdx})"><i class="fas fa-reply"></i> Balas</button>
      </div>` : '';
        const adminActions = currentUser === 'admin' ? `
      <button class="btn btn-sm ${k.dibaca ? 'btn-outline' : 'btn-success'}" onclick="toggleBaca(${realIdx})">
        <i class="fas fa-${k.dibaca ? 'envelope' : 'envelope-open'}"></i> ${k.dibaca ? 'Belum Dibaca' : 'Tandai Dibaca'}
      </button>
      <button class="btn btn-sm btn-danger" onclick="deleteKritik(${realIdx})"><i class="fas fa-trash"></i></button>` : '';
        return `<div class="thread-card">
      <div class="thread-header">
        <div class="thread-avatar">${initials}</div>
        <div class="thread-meta">
          <div class="thread-name">${k.nama || 'Anonim'}</div>
          <div class="thread-date">${formatDate(k.tanggal)}</div>
        </div>
        <span class="thread-badge ${k.dibaca ? 'read' : ''}">${k.dibaca ? 'Dibaca' : 'Baru'}</span>
      </div>
      <div class="thread-isi">${k.isi}</div>
      <div class="thread-actions">${adminActions}</div>
      ${replies || replyForm ? `<div class="thread-replies">${replies}${replyForm}</div>` : ''}
    </div>`;
    }).join('');
}

function submitReply(idx) {
    const el = document.getElementById('replyInput-' + idx);
    const isi = el ? el.value.trim() : '';
    if (!isi) { showToast('Balasan tidak boleh kosong', 'error'); return; }
    if (!DB.kritik[idx].replies) DB.kritik[idx].replies = [];
    DB.kritik[idx].replies.push({ isi, tanggal: new Date().toISOString() });
    DB.kritik[idx].dibaca = true;
    saveData(); renderKritikThreads(); showToast('Balasan terkirim!', 'success');
}

function toggleBaca(idx) {
    DB.kritik[idx].dibaca = !DB.kritik[idx].dibaca;
    saveData(); renderKritikThreads();
}

function deleteKritik(idx) {
    if (confirm('Hapus pesan ini?')) {
        DB.kritik.splice(idx, 1); saveData(); renderKritikThreads(); showToast('Pesan dihapus', 'success');
    }
}

// ===== SETTINGS =====
function updateSettings() {
    DB.companyName = document.getElementById('companyName').value.trim() || 'Kabinet';
    DB.companyLogo = document.getElementById('companyLogoUrl').value.trim();
    saveData(); loadSettings(); showToast('Pengaturan disimpan!', 'success');
}

// ===== MODAL =====
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function togglePassword(inputId) {
    const el = document.getElementById(inputId);
    el.type = el.type === 'password' ? 'text' : 'password';
    el.nextElementSibling.innerHTML = `<i class="fas fa-eye${el.type === 'password' ? '' : '-slash'}"></i>`;
}

document.addEventListener('click', e => { if (e.target.classList.contains('modal')) e.target.classList.remove('active'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active')); });

// ===== TOAST =====
function showToast(msg, type = 'info') {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
}

// ===== UTILS =====
function formatDate(s) {
    if (!s) return '';
    return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatRupiah(n) { if (!n) return 'Rp 0'; return 'Rp ' + parseInt(n).toLocaleString('id-ID'); }
