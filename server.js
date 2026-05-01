const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// 🔥 disable cache (PENTING)
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

// ================= FIREBASE INIT =================
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
    try {
        serviceAccount = require('./firebase-service-account.json');
    } catch (err) {
        console.error('❌ Firebase service account credentials not found!');
        console.error('   Option 1: Set FIREBASE_SERVICE_ACCOUNT env variable with JSON credentials');
        console.error('   Option 2: Copy firebase-service-account.json.example to firebase-service-account.json and fill in your credentials');
        process.exit(1);
    }
}

const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://smgicn.firebaseio.com';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseURL
});

console.log(`✅ Connected to Firebase Realtime Database: ${databaseURL}`);

const db = admin.database();
const DATA_REF = db.ref('data');

// ================= API =================
app.get('/api/data', async (req, res) => {
    try {
        const snapshot = await DATA_REF.once('value');
        const firebaseData = snapshot.val() || {};
        
        // Map Firebase structure to frontend expected structure
        const data = {
            contents: firebaseData.contents || [],
            hargaLayanan: firebaseData.pricing || [],
            feedbacks: firebaseData.feedback || [],
            classifications: firebaseData.classifications || ['INFO', 'KATEGORI', 'PROMO'],
            quickLinks: firebaseData.quickLinks || [],
            lampiran: firebaseData.lampiran || []
        };
        
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.post('/api/contents', async (req, res) => {
    try {
        const item = {
            id: Date.now().toString(),
            title: req.body.title,
            subject: req.body.subject,
            content: req.body.content,
            date: new Date().toISOString(),
            classification: req.body.classification || 'INFO',
            status: req.body.status || 'berlaku',
            externalLinks: req.body.externalLinks || []
        };

        // Get current contents, add new item at beginning
        const snapshot = await DATA_REF.child('contents').once('value');
        const contents = snapshot.val() || [];
        contents.unshift(item);
        await DATA_REF.child('contents').set(contents);

        res.json(item);
    } catch (error) {
        console.error('Error creating content:', error);
        res.status(500).json({ error: 'Failed to create content' });
    }
});

app.put('/api/contents/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const snapshot = await DATA_REF.child('contents').once('value');
        const contents = snapshot.val() || [];
        
        const index = contents.findIndex(item => item.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Content not found' });
        }
        
        // Update fields
        contents[index] = {
            ...contents[index],
            ...req.body,
            id: id // preserve ID
        };
        
        await DATA_REF.child('contents').set(contents);
        res.json(contents[index]);
    } catch (error) {
        console.error('Error updating content:', error);
        res.status(500).json({ error: 'Failed to update content' });
    }
});

app.delete('/api/contents/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const snapshot = await DATA_REF.child('contents').once('value');
        const contents = snapshot.val() || [];
        
        const filtered = contents.filter(item => item.id !== id);
        await DATA_REF.child('contents').set(filtered);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting content:', error);
        res.status(500).json({ error: 'Failed to delete content' });
    }
});

// Pricing endpoints
app.get('/api/pricing', async (req, res) => {
    try {
        const snapshot = await DATA_REF.child('pricing').once('value');
        const pricing = snapshot.val() || [];
        res.json(pricing);
    } catch (error) {
        console.error('Error fetching pricing:', error);
        res.status(500).json({ error: 'Failed to fetch pricing' });
    }
});

app.post('/api/pricing', async (req, res) => {
    try {
        const item = {
            id: Date.now().toString(),
            ...req.body
        };

        const snapshot = await DATA_REF.child('pricing').once('value');
        const pricing = snapshot.val() || [];
        pricing.unshift(item);
        await DATA_REF.child('pricing').set(pricing);
        
        res.json(item);
    } catch (error) {
        console.error('Error creating pricing:', error);
        res.status(500).json({ error: 'Failed to create pricing' });
    }
});

app.delete('/api/pricing/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const snapshot = await DATA_REF.child('pricing').once('value');
        const pricing = snapshot.val() || [];
        
        const filtered = pricing.filter(item => item.id !== id);
        await DATA_REF.child('pricing').set(filtered);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting pricing:', error);
        res.status(500).json({ error: 'Failed to delete pricing' });
    }
});

// Lampiran endpoints
app.get('/api/lampiran', async (req, res) => {
    try {
        const snapshot = await DATA_REF.child('lampiran').once('value');
        const lampiran = snapshot.val() || [];
        res.json(lampiran);
    } catch (error) {
        console.error('Error fetching lampiran:', error);
        res.status(500).json({ error: 'Failed to fetch lampiran' });
    }
});

app.post('/api/lampiran', async (req, res) => {
    try {
        const item = {
            id: Date.now().toString(),
            ...req.body
        };

        const snapshot = await DATA_REF.child('lampiran').once('value');
        const lampiran = snapshot.val() || [];
        lampiran.unshift(item);
        await DATA_REF.child('lampiran').set(lampiran);
        
        res.json(item);
    } catch (error) {
        console.error('Error creating lampiran:', error);
        res.status(500).json({ error: 'Failed to create lampiran' });
    }
});

app.delete('/api/lampiran/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const snapshot = await DATA_REF.child('lampiran').once('value');
        const lampiran = snapshot.val() || [];
        
        const filtered = lampiran.filter(item => item.id !== id);
        await DATA_REF.child('lampiran').set(filtered);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting lampiran:', error);
        res.status(500).json({ error: 'Failed to delete lampiran' });
    }
});

// Feedback endpoints
app.get('/api/feedback', async (req, res) => {
    try {
        const snapshot = await DATA_REF.child('feedback').once('value');
        const feedback = snapshot.val() || [];
        res.json(feedback);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ error: 'Failed to fetch feedback' });
    }
});

app.post('/api/feedback', async (req, res) => {
    try {
        const item = {
            id: Date.now().toString(),
            name: req.body.name || 'Anonim',
            message: req.body.message,
            date: new Date().toISOString(),
            read: false
        };

        const snapshot = await DATA_REF.child('feedback').once('value');
        const feedback = snapshot.val() || [];
        feedback.unshift(item);
        await DATA_REF.child('feedback').set(feedback);
        
        res.json(item);
    } catch (error) {
        console.error('Error creating feedback:', error);
        res.status(500).json({ error: 'Failed to create feedback' });
    }
});

app.put('/api/feedback/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const snapshot = await DATA_REF.child('feedback').once('value');
        const feedback = snapshot.val() || [];
        
        const index = feedback.findIndex(item => item.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Feedback not found' });
        }
        
        feedback[index].read = true;
        await DATA_REF.child('feedback').set(feedback);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating feedback:', error);
        res.status(500).json({ error: 'Failed to update feedback' });
    }
});

app.delete('/api/feedback/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const snapshot = await DATA_REF.child('feedback').once('value');
        const feedback = snapshot.val() || [];
        
        const filtered = feedback.filter(item => item.id !== id);
        await DATA_REF.child('feedback').set(filtered);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({ error: 'Failed to delete feedback' });
    }
});

app.post('/api/data', async (req, res) => {
    try {
        const incoming = req.body;
        const update = {};
        
        // Map frontend field names to Firebase structure
        if (incoming.contents !== undefined) update.contents = incoming.contents;
        if (incoming.hargaLayanan !== undefined) update.pricing = incoming.hargaLayanan;
        if (incoming.feedbacks !== undefined) update.feedback = incoming.feedbacks;
        if (incoming.classifications !== undefined) update.classifications = incoming.classifications;
        if (incoming.quickLinks !== undefined) update.quickLinks = incoming.quickLinks;
        if (incoming.lampiran !== undefined) update.lampiran = incoming.lampiran;
        
        await DATA_REF.update(update);
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// ================= FRONTEND =================
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// ================= RUN =================
app.listen(PORT, '0.0.0.0', () => {
    console.log('Server jalan di http://localhost:' + PORT);
});