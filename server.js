const express = require("express");
const multer = require("multer");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ========= CLOUDINARY ========= */
cloudinary.config({
  cloud_name: "YOUR_CLOUD_NAME",
  api_key: "YOUR_API_KEY",
  api_secret: "YOUR_API_SECRET"
});

/* ========= MEMORY STORAGE ========= */
let rooms = [];   // {id, code}
let files = [];   // {roomId, url, publicId}

/* ========= MULTER ========= */
const upload = multer({ dest: "uploads/" });

/* ========= GENERATE CODE ========= */
function generateCode(){
  return Math.random().toString(36).substring(2,8).toUpperCase();
}

/* ========= CREATE ROOM ========= */
app.post("/create-room", (req, res) => {
  const id = Date.now().toString();
  const code = generateCode();

  rooms.push({ id, code });

  res.json({ roomId: id, code });
});

/* ========= JOIN ROOM ========= */
app.post("/join-room", (req, res) => {
  const { code } = req.body;

  const room = rooms.find(r => r.code === code);
  if(!room) return res.status(404).send("Invalid code");

  res.json({ roomId: room.id });
});

/* ========= UPLOAD ========= */
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const roomId = req.body.roomId;

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto"
    });

    const file = {
      roomId,
      url: result.secure_url,
      publicId: result.public_id
    };

    files.push(file);

    res.json(file);

  } catch (err) {
    console.log(err);
    res.status(500).send("Upload error");
  }
});

/* ========= GET FILES ========= */
app.get("/files", (req, res) => {
  const roomId = req.query.roomId;
  const roomFiles = files.filter(f => f.roomId === roomId);

  res.json(roomFiles);
});

/* ========= DELETE ========= */
app.post("/delete", async (req, res) => {
  const { publicId, roomId } = req.body;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "auto"
    });

    files = files.filter(f => f.publicId !== publicId);

    res.send("Deleted");

  } catch (err) {
    res.status(500).send("Delete error");
  }
});

/* ========= START ========= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running"));
