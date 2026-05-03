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

/* =========================
   📁 SERVE FRONTEND
========================= */
app.use(express.static(__dirname));
app.use(express.json());

/* =========================
   📁 TEMP UPLOAD
========================= */
const upload = multer({ dest: "temp/" });

/* =========================
   💾 LOCAL STORAGE (JSON)
========================= */
const DATA_FILE = "data.json";

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

/* =========================
   📤 UPLOAD TO CLOUDINARY
========================= */
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto"
    });

    fs.unlinkSync(req.file.path); // delete temp

    res.json({
      url: result.secure_url,
      name: result.original_filename || req.file.originalname
    });

  } catch (err) {
    console.log(err);
    res.status(500).send("Upload failed");
  }
});

/* =========================
   📜 GET FILES
========================= */
app.get("/files", async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      resource_type: "video",
      type: "upload",
      max_results: 100
    });

    const files = result.resources.map(f => ({
      url: f.secure_url,
      name: f.public_id
    }));

    res.json(files);

  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching files");
  }
});

/* =========================
   💾 SAVE FILE
========================= */
app.post("/save", express.json(), (req, res) => {
  console.log("SAVE HIT:", req.body); // 👈 debug

  const files = loadData();
  files.push(req.body);
  saveData(files);

  res.send("Saved");
});

/* =========================
   ❌ DELETE FILE
========================= */
app.post("/delete", express.json(), (req, res) => {
  let files = loadData();
  files = files.filter(f => f.url !== req.body.url);
  saveData(files);

  res.send("Deleted");
});
/* =========================
   🚀 START SERVER
========================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
