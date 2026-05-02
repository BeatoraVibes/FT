const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // ✅ IMPORTANT CHANGE

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));

// ✅ ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// storage
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

// list files
app.get('/files', (req, res) => {
    fs.readdir('uploads', (err, files) => {
        res.json(files || []);
    });
});

// upload
app.post('/upload', upload.single('file'), (req, res) => {
    res.redirect('/');
});

// delete
app.post('/delete', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.body.name);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.redirect('/');
});

// stream
app.get('/stream/:name', (req, res) => {
    res.sendFile(path.join(__dirname, 'uploads', req.params.name));
});

// download
app.get('/download/:name', (req, res) => {
    res.download(path.join(__dirname, 'uploads', req.params.name));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log("Server running on port " + PORT);
});
