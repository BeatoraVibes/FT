const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;

const app = express();

/* ========= MIDDLEWARE ========= */
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ========= FIX ROOT ========= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ========= CLOUDINARY ========= */
cloudinary.config({
  cloud_name: "YOUR_CLOUD_NAME",
  api_key: "YOUR_API_KEY",
  api_secret: "YOUR_API_SECRET",
  secure: true
});

/* ========= FILE DB ========= */
const dbPath = path.join(__dirname, "db.json");

if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({ rooms: [], files: [] }, null, 2));
}

function readDB() {
  return JSON.parse(fs.readFileSync(dbPath));
}

function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

/* ========= MULTER ========= */
const upload = multer({ dest: "uploads/" });

/* ========= CODE GENERATOR ========= */
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/* ========= CREATE ROOM ========= */
app.post("/create-room", (req, res) => {
  const db = readDB();

  const id = Date.now().toString();
  const code = generateCode();

  db.rooms.push({ id, code });
  writeDB(db);

  res.json({ roomId: id, code });
});

/* ========= JOIN ROOM ========= */
app.post("/join-room", (req, res) => {
  const db = readDB();
  const { code } = req.body;

  const room = db.rooms.find(r => r.code === code);
  if (!room) return res.status(404).send("Invalid code");

  res.json({ roomId: room.id });
});

/* ========= UPLOAD ========= */
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { roomId } = req.body;

    if (!roomId) return res.status(400).send("Room ID required");

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto"
    });

    const db = readDB();

    const file = {
      roomId,
      url: result.secure_url,
      publicId: result.public_id
    };

    db.files.push(file);
    writeDB(db);

    res.json(file);

  } catch (err) {
    console.log(err);
    res.status(500).send("Upload error");
  }
});

/* ========= GET FILES ========= */
app.get("/files", (req, res) => {
  const db = readDB();
  const { roomId } = req.query;

  if (!roomId) return res.json([]);

  const roomFiles = db.files.filter(f => f.roomId === roomId);
  res.json(roomFiles);
});

/* ========= DELETE ========= */
app.post("/delete", async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) return res.status(400).send("publicId required");

    await cloudinary.uploader.destroy(publicId, {
      resource_type: "auto"
    });

    const db = readDB();
    db.files = db.files.filter(f => f.publicId !== publicId);
    writeDB(db);

    res.send("Deleted");

  } catch (err) {
    console.log(err);
    res.status(500).send("Delete error");
  }
});

/* ========= START ========= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
