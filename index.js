const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const PalSchema = require("./models/pal.model");
const jwt = require("jsonwebtoken");
const config = require("./config");

const { username, password, host, dbName, options } = config.mongo;

app.use(cors());
app.use(express.json());

const connectionString = `mongodb+srv://${username}:${password}@${host}/${dbName}?${options}`;

// Connect to MongoDB
mongoose
  .connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// Greet
app.get("/hello", (req, res) => {
  res.send("KRISHNA KANT HATI");
});

// Register
app.post("/api/register", async (req, res) => {
  console.log(req.body);
  try {
    await PalSchema.create({
      palid: req.body.palid,
      password: req.body.password,
      phone: req.body.phone,
      joinDate: new Date(),
      online: false,
      bio: req.body.bio,
    });
    res.json({ status: "green" });
  } catch (error) {
    res.json({ status: "error", error: "Duplicate ID or Phone" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const pal = await PalSchema.findOne({
    palid: req.body.palid,
    password: req.body.password,
  });

  if (pal) {
    const token = jwt.sign({ palid: pal.palid }, config.secretKey);
    return res.json({ status: "green", pal: token });
  } else {
    return res.json({ status: "error", pal: false });
  }
});

// Pal Registered Count
app.get("/api/pal/count", async (req, res) => {
  try {
    const palRegisteredCount = await PalSchema.countDocuments();
    return res.json({ status: "green", count: palRegisteredCount });
  } catch (error) {
    res.json({ status: "error", error: "Failed to retrieve pal count" });
  }
});

// Server Listening
app.listen(1337, () => {
  console.log("Server Started on 1337");
});
