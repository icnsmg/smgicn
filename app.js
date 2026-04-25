// ===== KABINET APP (Modified: 2026-04-24) =====
const DEFAULT_PASSWORDS = { admin: 'smg1234', user: 'Contact1234' };

const DB = { 
    companyName: 'Kabinet', 
    companyLogo: '', 
    klasifikasi: ['INFO', 'Kategori Tiket', 'PROMO'], 
    headerLinks: [], 
    konten: [], 
    harga: [], 
    kritik: [],
    lampiranLinks: [],
    lampiranImages: []
};

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

function initFirebase() {
    if (typeof firebase === 'undefined') {
        setTimeout(initFirebase, 100);
        return;
    }
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    initData(database);
}

// ===== STATE =====
let currentUser = null;
let currentTab = 'konten';
let searchQuery = '';
let currentHargaFilters = {
    regional: 'JAWA & BALI',
    jenis: 'PELANGGAN BARU',
    paket: 'REGULER'
};
let currentFilter = 'all';
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
let editingContentId = null;
let expandedCards = new Set();
let searchMatches = [];
let searchActiveIndex = -1;
let searchNavActive = false;
let hargaSortCol = null;
let hargaSortDir = 1;
let loginType = 'admin';
let topCardId = null;

// ===== DEBOUNCE =====
function debounce(fn, ms) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// ===== FIREBASE =====
function initData(database) {
    document.getElementById('loadingOverlay').style.display = 'flex';
    database.ref('kabinetDB').on('value', snap => {
        const data = snap.val();
        if (data) {
            DB.companyName = data.companyName || 'Kabinet';
            DB.companyLogo = data.companyLogo || '';
            DB.klasifikasi = (data.klasifikasi || ['INFO', 'Kategori Tiket', 'PROMO']).map(k => k === 'KATEGORI' ? 'Kategori Tiket' : k);
            DB.headerLinks = data.headerLinks || [];
            DB.konten = (data.konten || []).map(k => {
                if (k.klasifikasi === 'KATEGORI') k.klasifikasi = 'Kategori Tiket';
                return k;
            });
            DB.harga = data.harga || [];
            DB.kritik = data.kritik || [];
            DB.lampiranLinks = data.lampiranLinks || [];
            DB.lampiranImages = data.lampiranImages || [];
        } else {
            DB.konten = [
                { id: 1, judul: 'Cara Memesan Layanan', tanggal: '2026-04-15', klasifikasi: 'INFO', subject: 'Panduan lengkap cara memesan layanan kami melalui platform online.', content: '<p>Ikuti langkah-langkah berikut:</p><ul><li>Kunjungi website resmi</li><li>Pilih layanan</li><li>Isi formulir</li><li>Konfirmasi pembayaran</li></ul>', links: [{ name: 'Panduan Lengkap', url: '#' }] }
            ];
            saveData();
        }
        loadSettings();
        document.getElementById('loadingOverlay').style.display = 'none';
        if (currentUser) refreshCurrentTab();
    });
}

function saveData() {
    if (firebaseConfig.apiKey !== 'YOUR_API_KEY') {
        const database = firebase.database();
        database.ref('kabinetDB').set(DB).catch(() => showToast('Gagal menyimpan data', 'error'));
    }
}

function loadSettings() {
    if (DB.companyName) {
        document.querySelector('.logo span').textContent = DB.companyName;
        const el = document.getElementById('companyName');
        if (el) el.value = DB.companyName;
    }
}

// ===== AUTH =====
document.addEventListener('DOMContentLoaded', () => { 
    initFirebase(); 
    checkLoginStatus(); 
});

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
    document.getElementById('floatingBtn').style.display = 'none';
    document.getElementById('headerActions').innerHTML = `
    <button class="btn btn-outline" onclick="showLoginModal('admin')"><i class="fas fa-user-shield"></i> Login Admin</button>
    <button class="btn btn-primary" onclick="showLoginModal('user')"><i class="fas fa-user"></i> Login User</button>`;
}

function hideAllViews() {
    document.querySelectorAll('main > section').forEach(section => {
        section.style.display = 'none';
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
    const view = document.getElementById('view' + tab.charAt(0).toUpperCase() + tab.slice(1));
    if (view) view.style.display = 'block';
    
    if (tab === 'konten') renderKontenView();
    else if (tab === 'harga') { renderHargaFilters(); renderHargaView(); }
    else if (tab === 'lampiran') renderLampiranView();
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

// ===== SEARCH & FILTER =====
const debouncedSearch = debounce(() => {
    const s = document.getElementById('mainSearchInput');
    const val = (s ? s.value : '').trim();
    syncSearch(val);
}, 280);

function syncSearch(val) {
    const s = document.getElementById('mainSearchInput');
    if (s) s.value = val;
    searchQuery = val.trim();
    const msc = document.getElementById('mainSearchClear');
    if (msc) msc.classList.toggle('visible', searchQuery.length > 0);
    exitSearchNav();
    currentPage = 1;
    renderCards();
}

function onSearchKeyDown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (searchNavActive) nextMatch();
        else enterSearchNav();
    }
}

function clearSearch() {
    const s = document.getElementById('mainSearchInput');
    if (s) s.value = '';
    searchQuery = '';
    const msc = document.getElementById('mainSearchClear');
    if (msc) msc.classList.remove('visible');
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
    const isn = document.getElementById('inlineSearchNav');
    if (isn) isn.style.display = 'flex';
}

function exitSearchNav() {
    searchNavActive = false;
    const isn = document.getElementById('inlineSearchNav');
    if (isn) isn.style.display = 'none';
    searchMatches.forEach(el => el.classList.remove('highlight-active'));
    searchMatches = [];
    searchActiveIndex = -1;
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
    const pos = document.getElementById('snbPos');
    if (pos) pos.textContent = `${searchActiveIndex + 1} / ${searchMatches.length}`;
}

function fuzzyMatch(text, query) {
    if (!query) return true;
    const t = text.toLowerCase(), q = query.toLowerCase();
    if (t.includes(q)) return true;
    const words = q.split(/\s+/).filter(w => w.length > 0);
    if (words.length > 1) return words.every(w => t.includes(w));
    if (q.length > 3) {
        let mismatches = 0;
        for (let i = 0; i < q.length && mismatches <= 1; i++) {
            if (!t.includes(q[i])) mismatches++;
        }
        return mismatches <= 1;
    }
    return false;
}

function calculateRelevance(item, query) {
    if (!query) return 0;
    const q = query.toLowerCase().trim();
    const judul = (item.judul || '').toLowerCase();
    const subject = stripHtml(item.subject || '').toLowerCase();
    const content = stripHtml(item.content || '').toLowerCase();
    let score = 0;
    if (judul === q) score += 5000;
    else if (judul.includes(q)) { score += 2000; if (judul.startsWith(q)) score += 500; }
    if (subject.includes(q)) score += 500;
    if (content.includes(q)) score += 200;
    return score;
}

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function stripHtml(html) { if (!html) return ''; const d = document.createElement('div'); d.innerHTML = html; return d.textContent || d.innerText || ''; }
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
    c.innerHTML = cats.map(cat => `<button class="pill ${cat === currentFilter ? 'active' : ''}" onclick="filterByCategory('${cat}')">${cat === 'all' ? 'SEMUA' : cat}</button>`).join('');
}

// ===== CARD RENDERING =====
function renderCards() {
    const c = document.getElementById('cardsContainer');
    if (!c) return;
    let items = [...DB.konten];
    if (currentFilter !== 'all') items = items.filter(k => k.klasifikasi === currentFilter);
    if (searchQuery) {
        const words = searchQuery.trim().split(/\s+/).filter(w => w.length > 0);
        items = items.filter(k => words.every(w => fuzzyMatch(k.judul, w) || fuzzyMatch(stripHtml(k.subject || ''), w) || fuzzyMatch(stripHtml(k.content || ''), w)));
        items.forEach(item => { item._score = calculateRelevance(item, searchQuery); });
    }
    items.sort((a, b) => {
        if (searchQuery && (b._score || 0) !== (a._score || 0)) return (b._score || 0) - (a._score || 0);
        if (a.id === topCardId) return -1;
        if (b.id === topCardId) return 1;
        return new Date(b.tanggal) - new Date(a.tanggal);
    });
    const total = Math.ceil(items.length / ITEMS_PER_PAGE);
    const paged = items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    if (!paged.length) c.innerHTML = '<div class="empty-state"><i class="fas fa-folder-open"></i><p>Tidak ada konten ditemukan</p></div>';
    else c.innerHTML = paged.map(k => renderCard(k)).join('');
    renderPagination(total);
}

function renderCard(k) {
    const expanded = expandedCards.has(k.id);
    const subjectHtml = k.subject || '';
    const showMore = k.content && stripHtml(k.content).trim().length > 0;
    let subjectDisplay = searchQuery ? highlightWords(subjectHtml, searchQuery) : subjectHtml;
    let contentDisplay = searchQuery ? highlightWords(k.content || '', searchQuery) : (k.content || '');
    let judulDisplay = searchQuery ? highlightWords(k.judul || '', searchQuery) : (k.judul || '');

    const linksHtml = (k.links && k.links.length) ? `<div class="card-links-inline">${k.links.map(l => `<a href="${l.url}" class="card-btn" target="_blank"><i class="fas fa-external-link-alt"></i> ${l.name}</a>`).join('')}</div>` : '';
    const statusBadge = k.status === 'Tidak Berlaku' ? `<span class="card-status invalid">TIDAK BERLAKU</span>` : `<span class="card-status valid">BERLAKU</span>`;

    return `<div class="content-card ${k.status === 'Tidak Berlaku' ? 'inactive-card' : ''} ${k.id === topCardId ? 'active-glow' : ''}" onclick="toggleCard(${k.id})">
        <div class="card-header">
            <div class="card-info">
                <h3 class="card-title">${judulDisplay}</h3>
                <div class="card-meta">${statusBadge}<span class="card-klasifikasi">${k.klasifikasi}</span><span class="card-date">${formatDate(k.tanggal)}</span></div>
            </div>
            ${currentUser === 'admin' ? `<div class="card-admin-actions"><button class="btn-icon" onclick="event.stopPropagation();showContentForm(${k.id})"><i class="fas fa-edit"></i></button><button class="btn-icon btn-icon-danger" onclick="event.stopPropagation();deleteContent(${k.id})"><i class="fas fa-trash"></i></button></div>` : ''}
        </div>
        <div class="card-subject">${subjectDisplay}</div>
        ${linksHtml}
        ${showMore ? `<div class="card-expand ${expanded ? 'expanded' : ''}"><div class="card-content">${contentDisplay}</div></div><button class="card-btn card-btn-expand" onclick="event.stopPropagation();toggleCard(${k.id})">${expanded ? 'Tutup' : 'Selengkapnya'} <i class="fas fa-chevron-${expanded ? 'up' : 'down'}"></i></button>` : ''}
    </div>`;
}

function toggleCard(id) {
    if (expandedCards.has(id)) expandedCards.delete(id);
    else { expandedCards.add(id); topCardId = id; }
    renderCards();
}

function renderPagination(total) {
    const c = document.getElementById('pagination');
    if (!c || total <= 1) { if (c) c.innerHTML = ''; return; }
    let h = `<button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
    for (let i = 1; i <= total; i++) h += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    h += `<button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${currentPage === total ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
    c.innerHTML = h;
}

function changePage(p) { currentPage = p; renderCards(); window.scrollTo({ top: 0, behavior: 'smooth' }); }

// ===== HARGA LAYANAN =====
function renderHargaView() {
    const panel = document.getElementById('hargaInputPanel');
    if (panel) panel.style.display = currentUser === 'admin' ? 'block' : 'none';
    renderHargaTable();
}

function setHargaFilter(key, val) {
    currentHargaFilters[key] = val;
    renderHargaFilters();
    renderHargaTable();
}

function renderHargaFilters() {
    const regionals = ['JAWA & BALI', 'SUMATERA & KALIMANTAN', 'INDONESIA TIMUR', 'NUSA TENGGARA TIMUR', 'NATUNA'];
    const types = ['PELANGGAN BARU', 'PELANGGAN EXISTING'];
    const packages = ['REGULER', 'HEBAT-3', 'HEBAT-6', 'HEBAT-12', 'HEBAT-24', 'UPGRADE HARGA KHUSUS'];

    const pReg = document.getElementById('pillsRegional');
    const pJen = document.getElementById('pillsJenis');
    const pPak = document.getElementById('pillsPaket');
    
    if (pReg) pReg.innerHTML = regionals.map(r => `<button class="harga-pill ${currentHargaFilters.regional === r ? 'active' : ''}" onclick="setHargaFilter('regional', '${r}')">${r}</button>`).join('');
    if (pJen) pJen.innerHTML = types.map(t => `<button class="harga-pill ${currentHargaFilters.jenis === t ? 'active' : ''}" onclick="setHargaFilter('jenis', '${t}')">${t}</button>`).join('');
    if (pPak) pPak.innerHTML = packages.map(p => `<button class="harga-pill ${currentHargaFilters.paket === p ? 'active' : ''}" onclick="setHargaFilter('paket', '${p}')">${p}</button>`).join('');
}

function renderHargaTable() {
    const c = document.getElementById('hargaTable');
    if (!c) return;
    let items = [...DB.harga].filter(h => {
        const hRegional = (h.regional || '').toUpperCase().trim();
        const hJenis = (h.jenis || '').toUpperCase().trim().includes('BARU') ? 'PELANGGAN BARU' : 'PELANGGAN EXISTING';
        const hPaket = (h.paket || '').toUpperCase().trim();
        return hRegional === currentHargaFilters.regional && hJenis === currentHargaFilters.jenis && hPaket === currentHargaFilters.paket;
    });
    if (!items.length) { c.innerHTML = '<div class="empty-state"><i class="fas fa-table"></i><p>Tidak ada data harga</p></div>'; return; }
    c.innerHTML = `<table><thead><tr><th>Layanan</th><th>Biaya Pasang</th><th>Harga Paket</th><th>PPN 11%</th><th>Total</th>${currentUser === 'admin' ? '<th>Aksi</th>' : ''}</tr></thead>
    <tbody>${items.map((h, i) => {
        const ppn = Math.round(((h.biaya || 0) + (h.harga || 0)) * 0.11);
        const total = (h.biaya || 0) + (h.harga || 0) + ppn;
        return `<tr><td><strong>${h.paket} ${h.speed || ''}</strong></td><td>${formatRupiah(h.biaya)}</td><td>${formatRupiah(h.harga)}</td><td>${formatRupiah(ppn)}</td><td><strong>${formatRupiah(total)}</strong></td>${currentUser === 'admin' ? `<td><button class="btn btn-sm btn-danger" onclick="deleteHarga(${DB.harga.indexOf(h)})"><i class="fas fa-trash"></i></button></td>` : ''}</tr>`;
    }).join('')}</tbody></table>`;
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
    saveData(); renderHargaTable(); showToast('Harga disimpan!', 'success');
}

function deleteHarga(idx) { if (confirm('Hapus data ini?')) { DB.harga.splice(idx, 1); saveData(); renderHargaTable(); } }

// ===== LAMPIRAN VIEW =====
function renderLampiranView() {
    const bar = document.getElementById('adminLampiranBar');
    if (bar) bar.style.display = currentUser === 'admin' ? 'grid' : 'none';
    renderLampiranLinks();
    renderLampiranGallery();
}

function addLampiranLink() {
    const name = document.getElementById('lampiranLinkName').value.trim();
    const url = document.getElementById('lampiranLinkUrl').value.trim();
    if (!name || !url) { showToast('Nama dan URL wajib diisi!', 'error'); return; }
    DB.lampiranLinks.push({ id: Date.now(), name, url });
    saveData();
    document.getElementById('lampiranLinkName').value = '';
    document.getElementById('lampiranLinkUrl').value = '';
    renderLampiranLinks();
    showToast('Link ditambahkan!', 'success');
}

function deleteLampiranLink(id) {
    if (confirm('Hapus link ini?')) {
        DB.lampiranLinks = DB.lampiranLinks.filter(l => l.id !== id);
        saveData();
        renderLampiranLinks();
    }
}

function renderLampiranLinks() {
    const c = document.getElementById('lampiranLinksGrid');
    if (!c) return;
    if (!DB.lampiranLinks.length) { c.innerHTML = '<p class="empty-hint">Belum ada link eksternal</p>'; return; }
    c.innerHTML = DB.lampiranLinks.map(l => `
        <div class="link-card-admin">
            <a href="${l.url}" target="_blank" class="btn btn-outline"><i class="fas fa-external-link-alt"></i> ${l.name}</a>
            ${currentUser === 'admin' ? `<button class="link-delete-btn" onclick="deleteLampiranLink(${l.id})"><i class="fas fa-times"></i></button>` : ''}
        </div>`).join('');
}

function addLampiranImage() {
    const url = document.getElementById('lampiranImgUrl').value.trim();
    const caption = document.getElementById('lampiranImgCaption').value.trim();
    if (!url) { showToast('URL Gambar wajib diisi!', 'error'); return; }
    DB.lampiranImages.push({ id: Date.now(), url, caption });
    saveData();
    document.getElementById('lampiranImgUrl').value = '';
    document.getElementById('lampiranImgCaption').value = '';
    renderLampiranGallery();
    showToast('Gambar ditambahkan!', 'success');
}

function deleteLampiranImage(id) {
    if (confirm('Hapus gambar ini?')) {
        DB.lampiranImages = DB.lampiranImages.filter(img => img.id !== id);
        saveData();
        renderLampiranGallery();
    }
}

function renderLampiranGallery() {
    const c = document.getElementById('lampiranGallery');
    if (!c) return;
    if (!DB.lampiranImages.length) { c.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><i class="fas fa-image"></i><p>Belum ada foto</p></div>'; return; }
    c.innerHTML = DB.lampiranImages.map(img => `
        <div class="gallery-item" onclick="openLightbox('${img.url}', '${img.caption}')">
            <img src="${img.url}" alt="${img.caption}" class="gallery-img" loading="lazy">
            ${img.caption ? `<div class="gallery-caption">${img.caption}</div>` : ''}
            ${currentUser === 'admin' ? `<div class="gallery-admin-actions" onclick="event.stopPropagation()"><button class="btn-icon btn-icon-danger" onclick="deleteLampiranImage(${img.id})"><i class="fas fa-trash"></i></button></div>` : ''}
        </div>`).join('');
}

function openLightbox(url, caption) {
    const modal = document.getElementById('lightboxModal');
    document.getElementById('lightboxImg').src = url;
    document.getElementById('lightboxCaption').textContent = caption || '';
    modal.classList.add('active');
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
}

function renderKritikThreads() {
    const c = document.getElementById('kritikThreads');
    if (!c) return;
    const sorted = [...(DB.kritik || [])].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    if (!sorted.length) { c.innerHTML = '<div class="empty-state"><i class="fas fa-comments"></i><p>Belum ada kritik/saran</p></div>'; return; }
    c.innerHTML = sorted.map(k => `
        <div class="thread-card">
            <div class="thread-header">
                <div class="thread-avatar">${(k.nama || 'A').charAt(0).toUpperCase()}</div>
                <div class="thread-meta"><div class="thread-name">${k.nama || 'Anonim'}</div><div class="thread-date">${formatDate(k.tanggal)}</div></div>
            </div>
            <div class="thread-isi">${k.isi}</div>
            ${currentUser === 'admin' ? `<div class="thread-actions"><button class="btn btn-sm btn-danger" onclick="deleteKritik(${DB.kritik.indexOf(k)})"><i class="fas fa-trash"></i></button></div>` : ''}
        </div>`).join('');
}

function deleteKritik(idx) { if (confirm('Hapus pesan ini?')) { DB.kritik.splice(idx, 1); saveData(); renderKritikThreads(); } }

// ===== ADMIN KONTEN =====
function showAdminKontenModal() { renderContentList(); document.getElementById('adminKontenModal').classList.add('active'); }
function renderKlasifikasi() {
    const c = document.getElementById('klasifikasiList');
    const sel = document.getElementById('contentKlasifikasi');
    if (c) c.innerHTML = DB.klasifikasi.map(k => `<span class="klasifikasi-tag">${k}<button onclick="deleteKlasifikasi('${k}')"><i class="fas fa-times"></i></button></span>`).join('');
    if (sel) sel.innerHTML = DB.klasifikasi.map(k => `<option value="${k}">${k}</option>`).join('');
}
function addKlasifikasi() {
    const inp = document.getElementById('newKlasifikasi');
    const name = inp.value.trim().toUpperCase();
    if (name && !DB.klasifikasi.includes(name)) { DB.klasifikasi.push(name); saveData(); inp.value = ''; renderKlasifikasi(); renderFilterPills(); }
}
function deleteKlasifikasi(name) { if (confirm(`Hapus klasifikasi "${name}"?`)) { DB.klasifikasi = DB.klasifikasi.filter(k => k !== name); saveData(); renderKlasifikasi(); renderFilterPills(); } }
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
}
function renderExternalLinks(links) {
    const c = document.getElementById('externalLinks');
    c.innerHTML = (links.length ? links : [{}]).map(l => `<div class="external-link-item"><input type="text" placeholder="Nama file" class="link-name" value="${l.name || ''}"><input type="text" placeholder="URL" class="link-url" value="${l.url || ''}"><button type="button" class="btn-remove" onclick="removeLinkField(this)"><i class="fas fa-times"></i></button></div>`).join('');
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
    const subject = document.getElementById('contentSubjectEditor').innerHTML;
    const content = document.getElementById('contentEditor').innerHTML;
    if (!judul || !stripHtml(subject).trim()) { showToast('Judul dan Subject wajib diisi!', 'error'); return; }
    const links = [];
    document.querySelectorAll('.external-link-item').forEach(item => {
        const n = item.querySelector('.link-name').value.trim(), u = item.querySelector('.link-url').value.trim();
        if (n && u) links.push({ name: n, url: u });
    });
    if (editingContentId) {
        const idx = DB.konten.findIndex(k => k.id === editingContentId);
        DB.konten[idx] = { id: editingContentId, judul, tanggal, klasifikasi, status, subject, content, links };
    } else { DB.konten.push({ id: Date.now(), judul, tanggal, klasifikasi, status, subject, content, links }); }
    saveData(); closeModal('contentModal'); renderKontenView(); showToast('Konten disimpan!', 'success');
}
function renderContentList() {
    const c = document.getElementById('contentList');
    if (!c) return;
    const sorted = [...DB.konten].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    c.innerHTML = sorted.map(k => `<div class="content-item"><div class="content-item-info"><div class="content-item-title">${k.judul}</div><div class="content-item-meta"><span>${k.klasifikasi}</span><span>${formatDate(k.tanggal)}</span></div></div><div class="content-item-actions"><button class="btn btn-sm btn-outline" onclick="showContentForm(${k.id})"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-danger" onclick="deleteContent(${k.id})"><i class="fas fa-trash"></i></button></div></div>`).join('');
}
function deleteContent(id) { if (confirm('Hapus konten ini?')) { DB.konten = DB.konten.filter(k => k.id !== id); saveData(); renderContentList(); renderCards(); } }

// ===== UTILS & MODALS =====
function updateSettings() { DB.companyName = document.getElementById('companyName').value.trim() || 'Kabinet'; saveData(); loadSettings(); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function togglePassword(id) { const el = document.getElementById(id); el.type = el.type === 'password' ? 'text' : 'password'; }
function showToast(msg, type = 'info') {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
}
function formatDate(s) { if (!s) return ''; return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
function formatRupiah(n) { if (!n) return 'Rp 0'; return 'Rp ' + parseInt(n).toLocaleString('id-ID'); }
function formatSubject(cmd) { document.execCommand(cmd, false, null); }
function formatDoc(cmd) { document.execCommand(cmd, false, null); }
function showColorPicker() { document.getElementById('textColorPicker').click(); }
function setTextColor(c) { document.execCommand('foreColor', false, c); }
function insertHyperlink() { const u = prompt('URL:'); if (u) document.execCommand('createLink', false, u); }
function updateSubjectCount() {
    const el = document.getElementById('contentSubjectEditor');
    if (el) document.getElementById('subjectCount').textContent = stripHtml(el.innerHTML).trim().split(/\s+/).filter(w => w).length;
}
