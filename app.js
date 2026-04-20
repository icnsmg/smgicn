// Kabinet - Knowledge Base Application
const DEFAULT_PASSWORDS = {
    admin: 'smg1234',
    user: 'contact1234'
};

const DB = {
    companyName: 'Kabinet',
    companyLogo: '',
    klasifikasi: ['INFO', 'KATEGORI', 'PROMO'],
    konten: [],
    harga: [],
    kritik: []
};

// Konfigurasi Firebase dari User
const firebaseConfig = {
  apiKey: "AIzaSyD-C0pQl8Zd6baTg28RijkYncQdvBW_ewE",
  authDomain: "kabinetsmg.firebaseapp.com",
  projectId: "kabinetsmg",
  storageBucket: "kabinetsmg.firebasestorage.app",
  messagingSenderId: "372702391149",
  appId: "1:372702391149:web:ed6a9bca4070cf84110864",
  measurementId: "G-H4TLG98W2M",
  // Karena loading muter terus, kemungkinan besar database Anda ada di US Central (default).
  // Mari kita gunakan format default:
  databaseURL: "https://kabinetsmg-default-rtdb.firebaseio.com"
};

// Inisialisasi Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

function initData() {
    // Tampilkan loading saat pertama kali load data dari Firebase
    document.getElementById('loadingOverlay').style.display = 'flex';

    const dbRef = database.ref('kabinetDB');
    
    // Dengarkan perubahan data secara real-time
    dbRef.on('value', (snapshot) => {
        const data = snapshot.val();
        
        if (data) {
            // Update local DB object
            Object.assign(DB, data);
            
            // Pastikan array selalu ada meskipun kosong (Firebase biasanya menghilangkan array kosong)
            DB.konten = DB.konten || [];
            DB.harga = DB.harga || [];
            DB.kritik = DB.kritik || [];
            DB.klasifikasi = DB.klasifikasi || ['INFO', 'KATEGORI', 'PROMO'];
            
            // Render ulang tampilan jika sedang login
            if (currentUser === 'admin') {
                renderContentList();
                renderKlasifikasi();
                renderHargaTable();
                renderKritikList();
            } else if (currentUser === 'user') {
                renderCards();
                renderFilterPills();
                renderUserContentList();
            }
        } else {
            // Jika database kosong, masukkan data default
            DB.konten = [
                {
                    id: 1,
                    judul: 'Cara Memesan Layanan',
                    tanggal: '2026-04-15',
                    klasifikasi: 'INFO',
                    subject: 'Panduan lengkap cara memesan layanan kami melalui platform online.',
                    content: '<p>Untuk memesan layanan kami, Anda dapat mengikuti langkah-langkah berikut:</p><ul><li>Kunjungi website resmi kami</li><li>Pilih layanan yang diinginkan</li><li>Isi formulir pemesanan</li><li>Konfirmasi pembayaran</li></ul><p>Tim kami akan menghubungi Anda dalam 24 jam untuk proses lebih lanjut.</p>',
                    links: [{ name: 'Panduan Lengkap', url: '#' }]
                },
                {
                    id: 2,
                    judul: 'Paket Layanan HEBAT',
                    tanggal: '2026-04-14',
                    klasifikasi: 'PROMO',
                    subject: 'Dapatkan paket layanan HEBAT dengan harga spesial untuk bulan ini.',
                    content: '<p>Paket HEBAT adalah solusi terbaik untuk kebutuhan internet Anda dengan berbagai keunggulan:</p><ol><li>Kecepatan tinggi hingga 100 Mbps</li><li>Unlimited quota</li><li>Gratis installasi</li><li>Priority support 24/7</li></ol><p>Ayo segera pilih paket yang paling sesuai dengan kebutuhan Anda!</p>',
                    links: [{ name: 'Daftar Sekarang', url: '#' }]
                },
                {
                    id: 3,
                    judul: 'Area Layanan Kami',
                    tanggal: '2026-04-13',
                    klasifikasi: 'KATEGORI',
                    subject: 'Kami melayani area Jawa, Bali, Sumatera, dan Kalimantan.',
                    content: '<p>Saat ini layanan kami tersedia di wilayah:</p><ul><li><strong>Jawa & Bali:</strong> Jakarta, Bogor, Depok, Tangerang, Bekasi, Surabaya, Bandung, Yogyakarta, Bali</li><li><strong>Sumatera:</strong> Medan, Palembang, Lampung, Padang</li><li><strong>Kalimantan:</strong> Banjarmasin, Samarinda, Balikpapan</li></ul><p>Kami terus memperluas jaringan untuk melayani Anda di kota-kota lain.</p>',
                    links: []
                }
            ];
            DB.harga = [
                { bulan: 'APR', regional: 'Jawa & Bali', jenis: 'Baru', paket: 'Reguler', biaya: 250000, harga: 350000 },
                { bulan: 'APR', regional: 'Jawa & Bali', jenis: 'Existing', paket: 'Reguler', biaya: 0, harga: 350000 },
                { bulan: 'APR', regional: 'Jawa & Bali', jenis: 'Baru', paket: 'HEBAT 3', biaya: 200000, harga: 450000 },
                { bulan: 'APR', regional: 'Jawa & Bali', jenis: 'Baru', paket: 'HEBAT 6', biaya: 150000, harga: 850000 },
                { bulan: 'APR', regional: 'Sumatera & Kalimantan', jenis: 'Baru', paket: 'Reguler', biaya: 300000, harga: 400000 },
                { bulan: 'APR', regional: 'Sumatera & Kalimantan', jenis: 'Existing', paket: 'Reguler', biaya: 0, harga: 400000 }
            ];
            saveData();
        }
        
        loadSettings();
        document.getElementById('loadingOverlay').style.display = 'none';
        
        // Memeriksa jika config masih YOUR_API_KEY
        if (firebaseConfig.apiKey === "YOUR_API_KEY") {
            setTimeout(() => {
                showToast('PERINGATAN: Konfigurasi Firebase belum diisi! Data tidak akan tersimpan secara online.', 'error');
            }, 1000);
        }
    });
}

function saveData() {
    // Simpan ke Firebase Realtime Database
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        database.ref('kabinetDB').set(DB)
            .catch(error => {
                console.error("Error saving data:", error);
                showToast('Gagal menyimpan data ke server.', 'error');
            });
    } else {
        console.warn("Firebase tidak terkonfigurasi. Simpan dibatalkan.");
    }
}

function loadSettings() {
    if (DB.companyName) {
        document.querySelector('.logo span').textContent = DB.companyName;
        document.getElementById('companyName').value = DB.companyName;
    }
}

let currentUser = null;
let currentFilter = 'all';
let searchQuery = '';
let currentPage = 1;
const itemsPerPage = 7;
let editingContentId = null;
let expandedCards = new Set();

document.addEventListener('DOMContentLoaded', function() {
    initData();
    checkLoginStatus();
});

let loginType = 'admin';

function showLoginModal(type) {
    loginType = type;
    document.getElementById('loginTitle').textContent = type === 'admin' ? 'Login Admin' : 'Login User';
    document.getElementById('loginModal').classList.add('active');
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').style.display = 'none';
}

function handleLogin() {
    const password = document.getElementById('loginPassword').value;
    const expected = DEFAULT_PASSWORDS[loginType];
    console.log('Login type:', loginType);
    console.log('Expected password:', expected);
    console.log('Input password:', password);
    
    if (password === expected) {
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
    if (saved) {
        currentUser = saved;
        showMainContent();
    } else {
        showLandingPage();
    }
}

function showLandingPage() {
    document.getElementById('landingPage').style.display = 'flex';
    document.getElementById('searchSection').style.display = 'none';
    document.getElementById('cardsSection').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('userPanel').style.display = 'none';
    document.getElementById('floatingBtn').classList.add('hidden');
    
    const headerActions = document.getElementById('headerActions');
    headerActions.innerHTML = `
        <button class="btn btn-outline" onclick="showLoginModal('admin')">
            <i class="fas fa-user-shield"></i> Login Admin
        </button>
        <button class="btn btn-primary" onclick="showLoginModal('user')">
            <i class="fas fa-user"></i> Login User
        </button>
    `;
}

function showMainContent() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('searchSection').style.display = 'block';
    document.getElementById('cardsSection').style.display = 'block';
    
    const headerActions = document.getElementById('headerActions');
    const floatingBtn = document.getElementById('floatingBtn');
    
    if (currentUser === 'admin') {
        headerActions.innerHTML = `
            <button class="btn btn-outline" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        `;
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('userPanel').style.display = 'none';
        document.getElementById('cardsSection').style.display = 'none';
        floatingBtn.classList.add('hidden');
        renderContentList();
        renderKlasifikasi();
        renderHargaTable();
        renderKritikList();
    } else {
        headerActions.innerHTML = `
            <button class="btn btn-outline" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        `;
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('userPanel').style.display = 'block';
        floatingBtn.classList.remove('hidden');
        renderCards();
        renderFilterPills();
        renderUserContentList();
    }
}

function handleSearch() {
    const input = document.getElementById('searchInput');
    searchQuery = input.value.trim();
    document.getElementById('searchClear').classList.toggle('visible', searchQuery.length > 0);
    currentPage = 1;
    renderCards();
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    searchQuery = '';
    document.getElementById('searchClear').classList.remove('visible');
    currentPage = 1;
    renderCards();
}

function fuzzyMatch(text, query) {
    if (!query) return true;
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    if (textLower.includes(queryLower)) return true;
    
    let mismatches = 0;
    for (let i = 0; i < queryLower.length && mismatches <= 1; i++) {
        if (!textLower.includes(queryLower[i])) {
            mismatches++;
        }
    }
    return mismatches <= 1;
}

function filterByCategory(category) {
    currentFilter = category;
    document.querySelectorAll('.filter-pills .pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.filter === category);
    });
    currentPage = 1;
    renderCards();
}

function renderFilterPills() {
    const container = document.getElementById('filterPills');
    const pills = ['all', ...DB.klasifikasi];
    container.innerHTML = pills.map(cat => `
        <button class="pill ${cat === 'all' || cat === currentFilter ? 'active' : ''}" 
                data-filter="${cat}" 
                onclick="filterByCategory('${cat}')">
            ${cat === 'all' ? 'Semua' : cat}
        </button>
    `).join('');
}

function renderCards() {
    const container = document.getElementById('cardsContainer');
    let filtered = DB.konten;
    
    if (currentFilter !== 'all') {
        filtered = filtered.filter(k => k.klasifikasi === currentFilter);
    }
    
    if (searchQuery) {
        const queryWords = searchQuery.trim().split(/\s+/).filter(w => w.length > 0);
        filtered = filtered.filter(k => {
            const subjectText = stripHtml(k.subject || '');
            const contentText = stripHtml(k.content || '');
            return queryWords.some(word =>
                fuzzyMatch(k.judul, word) ||
                fuzzyMatch(subjectText, word) ||
                fuzzyMatch(contentText, word)
            );
        });
    }
    
    filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    
    if (paginated.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <p>Tidak ada konten yang ditemukan</p>
            </div>
        `;
    } else {
        container.innerHTML = paginated.map(k => renderCard(k)).join('');
    }
    
    renderPagination(totalPages);
}

function highlightWords(text, query) {
    if (!query) return text;
    // Strip HTML tags for plain text highlighting
    const div = document.createElement('div');
    div.innerHTML = text;
    const plainText = div.textContent || div.innerText || '';
    // Split query into individual words and highlight each
    const words = query.trim().split(/\s+/).filter(w => w.length > 0);
    let result = text;
    words.forEach(word => {
        const regex = new RegExp(`(${escapeRegex(word)})`, 'gi');
        result = result.replace(regex, '<span class="highlight-text">$1</span>');
    });
    return result;
}

function renderCard(konten) {
    const expanded = expandedCards.has(konten.id);
    const subjectHtml = konten.subject || '';
    const subjectText = (() => { const d = document.createElement('div'); d.innerHTML = subjectHtml; return d.textContent || d.innerText || ''; })();
    const wordCount = subjectText.split(/\s+/).filter(w => w).length;
    const showMore = wordCount > 200;
    
    let subject = subjectHtml;
    if (searchQuery) {
        subject = highlightWords(subjectHtml, searchQuery);
    }
    
    const linksHtml = konten.links && konten.links.length > 0 ? `
        <div class="card-links-inline" onclick="event.stopPropagation()">
            ${konten.links.map(link => `
                <a href="${link.url}" class="card-btn" target="_blank" onclick="event.stopPropagation()">
                    <i class="fas fa-external-link-alt"></i> ${link.name}
                </a>
            `).join('')}
        </div>
    ` : '';
    
    return `
        <div class="content-card" onclick="toggleCard(${konten.id})">
            <div class="card-header">
                <h3 class="card-title">${konten.judul}</h3>
                <div class="card-meta">
                    <span class="card-klasifikasi">${konten.klasifikasi}</span>
                    <span class="card-date">${formatDate(konten.tanggal)}</span>
                </div>
            </div>
            <div class="card-subject">${subject}</div>
            ${linksHtml}
            <div class="card-expand ${expanded ? 'expanded' : ''}">
                <div class="card-content">${konten.content}</div>
            </div>
            ${showMore ? `
                <button class="card-btn card-btn-expand" onclick="event.stopPropagation(); toggleCard(${konten.id})">
                    ${expanded ? 'Tutup' : 'Selengkapnya'} <i class="fas fa-chevron-${expanded ? 'up' : 'down'}"></i>
                </button>
            ` : ''}
        </div>
    `;
}

function toggleCard(id) {
    if (expandedCards.has(id)) {
        expandedCards.delete(id);
    } else {
        expandedCards.add(id);
    }
    renderCards();
}

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function renderPagination(totalPages) {
    const container = document.getElementById('pagination');
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    
    html += `<button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i>
    </button>`;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<span class="pagination-btn">...</span>`;
        }
    }
    
    html += `<button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-chevron-right"></i>
    </button>`;
    
    container.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    renderCards();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchAdminTab(tab) {
    document.querySelectorAll('#adminPanel .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('#adminPanel .tab-content').forEach(content => {
        content.style.display = 'none';
    });
    document.getElementById('tab-' + tab).style.display = 'block';
    
    if (tab === 'konten') {
        renderContentList();
        renderKlasifikasi();
    } else if (tab === 'harga') {
        renderHargaTable();
    } else if (tab === 'kritik') {
        renderKritikList();
    }
}

function renderContentList() {
    const container = document.getElementById('contentList');
    const sorted = [...DB.konten].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    if (sorted.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Belum ada konten</p></div>';
        return;
    }
    
    container.innerHTML = sorted.map(k => `
        <div class="content-item">
            <div class="content-item-info">
                <div class="content-item-title">${k.judul}</div>
                <div class="content-item-meta">
                    <span>${k.klasifikasi}</span>
                    <span>${formatDate(k.tanggal)}</span>
                </div>
            </div>
            <div class="content-item-actions">
                <button class="btn btn-sm btn-outline" onclick="editContent(${k.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteContent(${k.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function renderKlasifikasi() {
    const container = document.getElementById('klasifikasiList');
    const select = document.getElementById('contentKlasifikasi');
    
    container.innerHTML = DB.klasifikasi.map(k => `
        <span class="klasifikasi-tag">
            ${k}
            <button onclick="deleteKlasifikasi('${k}')"><i class="fas fa-times"></i></button>
        </span>
    `).join('');
    
    select.innerHTML = DB.klasifikasi.map(k => `<option value="${k}">${k}</option>`).join('');
}

function showContentForm(id = null) {
    editingContentId = id;
    document.getElementById('contentModalTitle').textContent = id ? 'Edit Konten' : 'Tambah Konten';
    
    if (id) {
        const konten = DB.konten.find(k => k.id === id);
        document.getElementById('contentJudul').value = konten.judul;
        document.getElementById('contentTanggal').value = konten.tanggal;
        document.getElementById('contentKlasifikasi').value = konten.klasifikasi;
        document.getElementById('contentSubjectEditor').innerHTML = konten.subject || '';
        document.getElementById('contentEditor').innerHTML = konten.content;
        renderExternalLinks(konten.links || []);
    } else {
        document.getElementById('contentJudul').value = '';
        document.getElementById('contentTanggal').value = new Date().toISOString().split('T')[0];
        document.getElementById('contentSubjectEditor').innerHTML = '';
        document.getElementById('contentEditor').innerHTML = '';
        renderExternalLinks([]);
    }
    
    document.getElementById('contentModal').classList.add('active');
    updateSubjectCount();
}

function renderExternalLinks(links) {
    const container = document.getElementById('externalLinks');
    if (links.length === 0) {
        container.innerHTML = `
            <div class="external-link-item">
                <input type="text" placeholder="Nama file" class="link-name">
                <input type="text" placeholder="URL (Drive, PPT, Excel, dll)" class="link-url">
                <button type="button" class="btn-remove" onclick="removeLinkField(this)"><i class="fas fa-times"></i></button>
            </div>
        `;
    } else {
        container.innerHTML = links.map(link => `
            <div class="external-link-item">
                <input type="text" placeholder="Nama file" class="link-name" value="${link.name}">
                <input type="text" placeholder="URL (Drive, PPT, Excel, dll)" class="link-url" value="${link.url}">
                <button type="button" class="btn-remove" onclick="removeLinkField(this)"><i class="fas fa-times"></i></button>
            </div>
        `).join('');
    }
}

function addLinkField() {
    const container = document.getElementById('externalLinks');
    const div = document.createElement('div');
    div.className = 'external-link-item';
    div.innerHTML = `
        <input type="text" placeholder="Nama file" class="link-name">
        <input type="text" placeholder="URL (Drive, PPT, Excel, dll)" class="link-url">
        <button type="button" class="btn-remove" onclick="removeLinkField(this)"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(div);
}

function removeLinkField(btn) {
    btn.parentElement.remove();
}

function saveContent() {
    const judul = document.getElementById('contentJudul').value.trim();
    const tanggal = document.getElementById('contentTanggal').value;
    const klasifikasi = document.getElementById('contentKlasifikasi').value;
    const subjectEl = document.getElementById('contentSubjectEditor');
    const subject = subjectEl.innerHTML.trim();
    const subjectText = subjectEl.textContent.trim();
    const content = document.getElementById('contentEditor').innerHTML;
    
    if (!judul || !subjectText) {
        showToast('Judul dan Subject wajib diisi!', 'error');
        return;
    }
    
    const links = [];
    document.querySelectorAll('.external-link-item').forEach(item => {
        const name = item.querySelector('.link-name').value.trim();
        const url = item.querySelector('.link-url').value.trim();
        if (name && url) {
            links.push({ name, url });
        }
    });
    
    if (editingContentId) {
        const idx = DB.konten.findIndex(k => k.id === editingContentId);
        DB.konten[idx] = {
            id: editingContentId,
            judul,
            tanggal,
            klasifikasi,
            subject,
            content,
            links
        };
    } else {
        DB.konten.push({
            id: Date.now(),
            judul,
            tanggal,
            klasifikasi,
            subject,
            content,
            links
        });
    }
    
    saveData();
    closeModal('contentModal');
    renderContentList();
    renderCards();
    renderFilterPills();
    showToast('Konten berhasil disimpan!', 'success');
}

function editContent(id) {
    showContentForm(id);
}

function deleteContent(id) {
    if (confirm('Apakah Anda yakin ingin menghapus konten ini?')) {
        DB.konten = DB.konten.filter(k => k.id !== id);
        saveData();
        renderContentList();
        renderCards();
        showToast('Konten berhasil dihapus!', 'success');
    }
}

function addKlasifikasi() {
    const input = document.getElementById('newKlasifikasi');
    const name = input.value.trim().toUpperCase();
    
    if (name && !DB.klasifikasi.includes(name)) {
        DB.klasifikasi.push(name);
        saveData();
        input.value = '';
        renderKlasifikasi();
        renderFilterPills();
        showToast('Klasifikasi berhasil ditambahkan!', 'success');
    }
}

function deleteKlasifikasi(name) {
    if (confirm(`Hapus klasifikasi "${name}"?`)) {
        DB.klasifikasi = DB.klasifikasi.filter(k => k !== name);
        saveData();
        renderKlasifikasi();
        renderFilterPills();
        showToast('Klasifikasi berhasil dihapus!', 'success');
    }
}

function updateSubjectCount() {
    const subjectEl = document.getElementById('contentSubjectEditor');
    if (!subjectEl) return;
    const text = subjectEl.textContent || '';
    const count = text.split(/\s+/).filter(w => w).length;
    document.getElementById('subjectCount').textContent = count;
}

function formatSubject(command) {
    document.getElementById('contentSubjectEditor').focus();
    document.execCommand(command, false, null);
    updateSubjectCount();
}

function formatDoc(command) {
    document.execCommand(command, false, null);
}

function showColorPicker() {
    document.getElementById('textColorPicker').click();
}

function setTextColor(color) {
    document.execCommand('foreColor', false, color);
}

function insertHyperlink() {
    const url = prompt('Masukkan URL:');
    if (url) {
        document.execCommand('createLink', false, url);
    }
}

function renderHargaTable() {
    const container = document.getElementById('hargaTable');
    const bulan = document.getElementById('hargaBulan').value;
    const regional = document.getElementById('hargaRegional').value;
    const jenis = document.getElementById('hargaJenis').value;
    const paket = document.getElementById('hargaPaket').value;
    
    let filtered = [...DB.harga];
    
    if (bulan) filtered = filtered.filter(h => h.bulan === bulan);
    if (regional) filtered = filtered.filter(h => h.regional === regional);
    if (jenis) filtered = filtered.filter(h => h.jenis === jenis);
    if (paket) filtered = filtered.filter(h => h.paket === paket);
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Tidak ada data harga</p></div>';
        return;
    }
    
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Layanan</th>
                    <th>Biaya Pasang</th>
                    <th>Harga Paket</th>
                    <th>PPN 11%</th>
                    <th>Total</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map((h, idx) => {
                    const ppn = Math.round((parseInt(h.harga) || 0) * 0.11);
                    const total = (parseInt(h.biaya) || 0) + parseInt(h.harga) + ppn;
                    return `
                        <tr>
                            <td>${h.paket}<br><small>${h.regional} - ${h.jenis} - ${h.bulan}</small></td>
                            <td>${formatRupiah(h.biaya)}</td>
                            <td>${formatRupiah(h.harga)}</td>
                            <td>${formatRupiah(ppn)}</td>
                            <td><strong>${formatRupiah(total)}</strong></td>
                            <td>
                                <button class="btn btn-sm btn-danger" onclick="deleteHarga(${idx})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function filterHarga() {
    renderHargaTable();
}

function saveHarga() {
    const bulan = document.getElementById('hargaBulanInput').value;
    const regional = document.getElementById('hargaRegionalInput').value;
    const jenis = document.getElementById('hargaJenisInput').value;
    const paket = document.getElementById('hargaPaketInput').value;
    const biaya = parseInt(document.getElementById('hargaBiayaPasang').value) || 0;
    const harga = parseInt(document.getElementById('hargaPaket').value) || 0;
    
    if (!harga) {
        showToast('Harga wajib diisi!', 'error');
        return;
    }
    
    DB.harga.push({ bulan, regional, jenis, paket, biaya, harga });
    saveData();
    renderHargaTable();
    
    document.getElementById('hargaBiayaPasang').value = '';
    document.getElementById('hargaPaket').value = '';
    
    showToast('Harga berhasil disimpan!', 'success');
}

function deleteHarga(idx) {
    if (confirm('Hapus data ini?')) {
        DB.harga.splice(idx, 1);
        saveData();
        renderHargaTable();
        showToast('Data berhasil dihapus!', 'success');
    }
}

function downloadTemplate() {
    showToast('Template download - Fitur coming soon!', 'info');
}

function uploadExcel(event) {
    showToast('Upload Excel - Fitur coming soon!', 'info');
}

function renderKritikList() {
    const container = document.getElementById('kritikList');
    const sorted = [...DB.kritik].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    if (sorted.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Belum ada kritik/saran</p></div>';
        return;
    }
    
    container.innerHTML = sorted.map((k, idx) => `
        <div class="kritik-item">
            <div class="kritik-item-info">
                <div class="kritik-item-header">
                    <span class="kritik-item-nama">${k.nama || 'Anonim'}</span>
                    <span class="kritik-item-tanggal">${formatDate(k.tanggal)}</span>
                    <span class="kritik-item-status ${k.dibaca ? 'baca' : ''}">${k.dibaca ? 'Sudah dibaca' : 'Baru'}</span>
                </div>
                <div class="kritik-item-isi">${k.isi}</div>
            </div>
            <div class="kritik-item-actions">
                <button class="btn btn-sm ${k.dibaca ? 'btn-outline' : 'btn-success'}" onclick="toggleBaca(${idx})">
                    <i class="fas fa-${k.dibaca ? 'envelope' : 'envelope-open'}"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteKritik(${idx})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function toggleBaca(idx) {
    DB.kritik[idx].dibaca = !DB.kritik[idx].dibaca;
    saveData();
    renderKritikList();
}

function deleteKritik(idx) {
    if (confirm('Hapus pesan ini?')) {
        DB.kritik.splice(idx, 1);
        saveData();
        renderKritikList();
        showToast('Pesan berhasil dihapus!', 'success');
    }
}

function showKritikModal() {
    document.getElementById('kritikModal').classList.add('active');
    document.getElementById('kritikNamaModal').value = '';
    document.getElementById('kritikIsiModal').value = '';
}

function submitKritikModal() {
    const nama = document.getElementById('kritikNamaModal').value.trim();
    const isi = document.getElementById('kritikIsiModal').value.trim();
    
    if (!isi) {
        showToast('Kritik/Saran wajib diisi!', 'error');
        return;
    }
    
    DB.kritik.push({
        id: Date.now(),
        nama,
        isi,
        tanggal: new Date().toISOString(),
        dibaca: false
    });
    
    saveData();
    closeModal('kritikModal');
    showToast('Terima kasih atas masukan Anda!', 'success');
}

function submitKritik() {
    const nama = document.getElementById('kritikNama').value.trim();
    const isi = document.getElementById('kritikIsi').value.trim();
    
    if (!isi) {
        showToast('Kritik/Saran wajib diisi!', 'error');
        return;
    }
    
    DB.kritik.push({
        id: Date.now(),
        nama,
        isi,
        tanggal: new Date().toISOString(),
        dibaca: false
    });
    
    saveData();
    document.getElementById('kritikNama').value = '';
    document.getElementById('kritikIsi').value = '';
    showToast('Terima kasih atas masukan Anda!', 'success');
}

function switchUserTab(tab) {
    document.querySelectorAll('#userPanel .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('#userPanel .tab-content').forEach(content => {
        content.style.display = 'none';
    });
    document.getElementById('user-' + tab).style.display = 'block';
}

function renderUserContentList() {
    const container = document.getElementById('userContentList');
    const sorted = [...DB.konten].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    if (sorted.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Belum ada konten</p></div>';
        return;
    }
    
    container.innerHTML = sorted.map(k => `
        <div class="content-item">
            <div class="content-item-info">
                <div class="content-item-title">${k.judul}</div>
                <div class="content-item-meta">
                    <span>${k.klasifikasi}</span>
                    <span>${formatDate(k.tanggal)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function updateSettings() {
    DB.companyName = document.getElementById('companyName').value.trim() || 'Kabinet';
    DB.companyLogo = document.getElementById('companyLogoUrl').value.trim();
    saveData();
    loadSettings();
    showToast('Pengaturan berhasil disimpan!', 'success');
}

function changeAdminPassword() {
    showToast('Hubungi developer untuk mengubah password default!', 'info');
}

function changeUserPassword() {
    showToast('Hubungi developer untuk mengubah password default!', 'info');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const btn = input.nextElementSibling;
    if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        input.type = 'password';
        btn.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRupiah(amount) {
    if (!amount) return 'Rp 0';
    return 'Rp ' + parseInt(amount).toLocaleString('id-ID');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
    }
});