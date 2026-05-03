const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;

const app = express();

/* =========================
   🔐 CLOUDINARY CONFIG
========================= */

cloudinary.config({
  cloud_name: "dsrrhjgok",
  api_key: "985917868938864",
  api_secret: "vI9k2kSAQ_NL83TSlNrDBBP2YPw"
});
app.use(express.static(__dirname));

/* =========================
   📁 MULTER (TEMP STORAGE)
========================= */

const upload = multer({ dest: "temp/" });

/* =========================
   📤 UPLOAD TO CLOUD
========================= */

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto"
    });

    fs.unlinkSync(req.file.path); // delete temp file

    res.json({
      url: result.secure_url,
      name: result.original_filename
    });

  } catch (err) {
    res.status(500).send("Upload failed");
  }
});

/* =========================
   📜 GET FILES (DEMO STORAGE)
========================= */

let files = [];

app.get("/files", (req, res) => {
  res.json(files);
});

/* =========================
   💾 SAVE FILE AFTER UPLOAD
========================= */

app.post("/save", express.json(), (req, res) => {
  files.push(req.body);
  res.send("Saved");
});

/* =========================
   ❌ DELETE (ONLY UI LEVEL)
========================= */

app.post("/delete", express.urlencoded({ extended: true }), (req, res) => {
  files = files.filter(f => f.url !== req.body.url);
  res.send("Deleted");
});

/* =========================
   🚀 START
========================= */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
