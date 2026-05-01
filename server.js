const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());

// 🔥 disable cache (PENTING)
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

const DATA_FILE = path.join(__dirname, 'data.json');

// ================= DATA =================
let data = {
    contents: []
};

// load file
if (fs.existsSync(DATA_FILE)) {
    data = JSON.parse(fs.readFileSync(DATA_FILE));
} else {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function save() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ================= API =================
app.get('/api/data', (req, res) => {
    res.json(data);
});

app.post('/api/contents', (req, res) => {
    const item = {
        id: Date.now().toString(),
        title: req.body.title,
        subject: req.body.subject,
        content: req.body.content,
        date: new Date().toISOString()
    };

    data.contents.unshift(item);
    save();

    res.json(item);
});

app.delete('/api/contents/:id', (req, res) => {
    data.contents = data.contents.filter(x => x.id !== req.params.id);
    save();
    res.json({ success: true });
});

// ================= FRONTEND =================
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>KB App</title>
</head>
<body>

<h2>Tambah Konten</h2>
<input id="title" placeholder="Judul"><br><br>
<input id="subject" placeholder="Subject"><br><br>
<textarea id="content" placeholder="Isi"></textarea><br><br>
<button onclick="add()">Tambah</button>

<h2>Data</h2>
<div id="list"></div>

<script>
const API = location.origin + '/api';

async function load() {
    const res = await fetch(API + '/data');
    const data = await res.json();

    const el = document.getElementById('list');
    el.innerHTML = '';

    data.contents.forEach(item => {
        el.innerHTML += \`
            <div style="border:1px solid #000; margin:10px; padding:10px">
                <h3>\${item.title}</h3>
                <p>\${item.subject}</p>
                <button onclick="hapus('\${item.id}')">Hapus</button>
            </div>
        \`;
    });
}

async function add() {
    await fetch(API + '/contents', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
            title: document.getElementById('title').value,
            subject: document.getElementById('subject').value,
            content: document.getElementById('content').value
        })
    });

    load(); // 🔥 reload dari server
}

async function hapus(id) {
    await fetch(API + '/contents/' + id, {
        method: 'DELETE'
    });

    load(); // 🔥 reload
}

// 🔥 auto sync semua device
setInterval(load, 3000);

load();
</script>

</body>
</html>
    `);
});

// ================= RUN =================
app.listen(PORT, '0.0.0.0', () => {
    console.log('Server jalan di http://localhost:' + PORT);
});