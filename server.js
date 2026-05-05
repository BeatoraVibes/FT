const express = require("express");
const multer = require("multer");
const cors = require("cors");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

const app = express();

/* ========= MIDDLEWARE ========= */
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

/* ========= CLOUDINARY ========= */
cloudinary.config({
  cloud_name: "dsrrhjgok",
  api_key: "153621739232641",
  api_secret: "JvXtJJZwkKLXsaBO1oekq9LYAN4",
});

/* ========= MONGODB ========= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ MongoDB error:", err.message));
/* ========= SCHEMAS ========= */
const roomSchema = new mongoose.Schema({
  code: String
});

const fileSchema = new mongoose.Schema({
  roomId: String,
  url: String,
  publicId: String
});

const Room = mongoose.model("Room", roomSchema);
const File = mongoose.model("File", fileSchema);

/* ========= MULTER ========= */
const upload = multer({ dest: "uploads/" });

/* ========= GENERATE CODE ========= */
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/* ========= CREATE ROOM ========= */
app.post("/create-room", async (req, res) => {
  const code = generateCode();

  const room = await Room.create({ code });

  res.json({ roomId: room._id, code });
});

/* ========= JOIN ROOM ========= */
app.post("/join-room", async (req, res) => {
  const { code } = req.body;

  const room = await Room.findOne({ code });

  if (!room) return res.status(404).send("Invalid code");

  res.json({ roomId: room._id });
});

/* ========= UPLOAD ========= */
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { roomId } = req.body;

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto"
    });

    const file = await File.create({
      roomId,
      url: result.secure_url,
      publicId: result.public_id
    });

    res.json(file);

  } catch (err) {
    console.log(err);
    res.status(500).send("Upload error");
  }
});

/* ========= GET FILES ========= */
app.get("/files", async (req, res) => {
  const { roomId } = req.query;

  const files = await File.find({ roomId });

  res.json(files);
});

/* ========= DELETE ========= */
app.post("/delete", async (req, res) => {
  try {
    const { publicId } = req.body;

    await cloudinary.uploader.destroy(publicId, {
      resource_type: "auto"
    });

    await File.deleteOne({ publicId });

    res.send("Deleted");

  } catch (err) {
    res.status(500).send("Delete error");
  }
});

/* ========= START ========= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
