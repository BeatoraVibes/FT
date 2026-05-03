const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();

/* =========================
   🔥 IMPORTANT SETTINGS
========================= */

// Allow large request body
app.use(express.json({ limit: "2gb" }));
app.use(express.urlencoded({ limit: "2gb", extended: true }));

// Disable timeout (important for big uploads)
app.use((req, res, next) => {
  req.setTimeout(0);
  next();
});

/* =========================
   📁 STORAGE SETUP
========================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

// 2GB upload limit
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024
  }
});

/* =========================
   📂 STATIC FILES
========================= */

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve frontend
app.use(express.static(__dirname));

/* =========================
   📤 UPLOAD ROUTE
========================= */

app.post("/upload", upload.single("file"), (req, res) => {
  res.send("Upload successful");
});

/* =========================
   📜 GET FILE LIST
========================= */

app.get("/files", (req, res) => {
  fs.readdir("uploads", (err, files) => {
    if (err) return res.json([]);
    res.json(files);
  });
});

/* =========================
   ❌ DELETE FILE
========================= */

app.post("/delete", express.urlencoded({ extended: true }), (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.body.name);

  fs.unlink(filePath, (err) => {
    if (err) return res.send("Error deleting file");
    res.send("Deleted");
  });
});

/* =========================
   🚀 START SERVER
========================= */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
