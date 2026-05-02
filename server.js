const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

app.get('/files', (req, res) => {
    fs.readdir('uploads', (err, files) => {
        res.json(files || []);
    });
});

app.post('/upload', upload.single('file'), (req, res) => {
    res.redirect('/');
});

app.post('/delete', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.body.name);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.redirect('/');
});

app.get('/stream/:name', (req, res) => {
    res.sendFile(path.join(__dirname, 'uploads', req.params.name));
});

app.get('/download/:name', (req, res) => {
    res.download(path.join(__dirname, 'uploads', req.params.name));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log("Server running...");
});