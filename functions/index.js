const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const PalSchema = require("../models/pal.model");
const jwt = require("jsonwebtoken");
const serverless = require("serverless-http");
const router = express.Router();
const cookieParser = require("cookie-parser");

// const config = require("./config");

// const { username, password, host, dbName, options } = config.mongo;

// const fs = require("fs");
// const path = require("path");

// Load environment variables from .env file
// const envPath = path.resolve(__dirname, "../.env");
// const envContent = fs.readFileSync(envPath, "utf8");
// const envLines = envContent.split("\n");

// envLines.forEach((line) => {
//   const [key, value] = line.split("=");
//   process.env[key] = value;
// });

router.use(
  cors({
    credentials: true,
    origin: ["http://localhost:5173", "https://hiipal.com"],
  })
);

app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:5173", "https://hiipal.com"],
  })
);

const username = process.env.MONGO_USERNAME;
const password = process.env.MONGO_PASSWORD;
const dbName = process.env.MONGO_DBNAME;
const options = process.env.MONGO_OPTIONS;
const secretKey = process.env.SECRET_KEY;

router.use(cookieParser());
app.use(express.json());

const connectionString = `mongodb+srv://${username}:${password}@cluster0.5zcxwtg.mongodb.net/${dbName}?${options}`;

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
router.get("/", (req, res) => {
  res.send("Hiipal Server is reachable 🪸");
});

// Test
const profile = [
  { name: "kris", id: 1 },
  { name: "joe", id: 2 },
];

router.post("/post/test", (req, res) => {
  const pal = { name: req.body.name };
  // console.log(profile);
  res.json({
    status: "green",
    token: jwt.sign(pal, secretKey),
  });
});

router.get("/profile/:profileId", authenticateToken, async (req, res) => {
  const profileId = req.params.profileId;
  try {
    const filteredPals = await PalSchema.find({ palid: profileId });
    res.json(filteredPals);
  } catch (err) {
    res.status(500).json({ error: "Error fetching data from the database" });
  }
});

function authenticateToken(req, res, next) {
  console.log("MyCOOKIE", req.cookies);
  // const authHeader = req.headers["authorization"];
  // const token = authHeader && authHeader.split(" ")[1];
  // const token = String(req.cookies["jwt"]);
  const token = req.cookies.HiipalAuth;

  if (token == null) return res.sendStatus(401);

  try {
    jwt.verify(token, secretKey, (err, pal) => {
      if (err) return res.sendStatus(403);
      req.pal = pal;
      next();
    });
  } catch (err) {
    res.clearCookie("token");
    return res.redirect("/");
  }
}

// Register
router.post("/api/register", async (req, res) => {
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
router.post("/api/login", async (req, res) => {
  // res.header("Access-Control-Allow-Origin", "https://hiipal.com");
  const pal = await PalSchema.findOne({
    palid: req.body.palid,
    password: req.body.password,
  });

  if (pal) {
    const token = jwt.sign({ name: pal.palid }, secretKey, {
      expiresIn: "1h",
    });
    res.cookie("HiipalAuth", token, {
      secure: true,
      httpOnly: true,
      sameSite: "None",
      // signed: true,
      maxAge: 1 * 60 * 60 * 1000,
    });
    return res.json({ status: "green", token: token, pal: pal.palid });
  } else {
    return res.json({ status: "error", token: false });
  }
});

// Logout
router.post("/api/logout", (req, res) => {
  res.clearCookie("HiipalAuth", {
    sameSite: "None",
    secure: true,
  });
  res.status(200).send("Logout successful");
});

// Pal Registered Count
router.get("/api/pal/count", async (req, res) => {
  try {
    const palRegisteredCount = await PalSchema.countDocuments();
    return res.json({ status: "green", count: palRegisteredCount });
  } catch (error) {
    res.json({ status: "error", error: "Failed to retrieve pal count" });
  }
});

// Check Existing Pal
router.post("/api/check-username", async (req, res) => {
  console.log(req);
  try {
    const pal = await PalSchema.findOne({
      palid: req.body.value,
    });
    if (pal) {
      // Username exists
      return res.json({ exists: true });
    } else {
      // Username does not exist
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking username availability:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const authMiddleware = (req, res, next) => {
  console.log("cookies", req.cookies);
  if (req.cookies && req.cookies.HiipalAuth) {
    const token = req.cookies.HiipalAuth;
    console.log(".....................", req.cookies);
    jwt.verify(token, secretKey, (err, pal) => {
      if (err) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      console.log(token);
      return next();
    });
  } else {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

router.get("/api/check-auth", authMiddleware, (req, res) => {
  res.json({ isAuthenticated: true });
});

// Server Listening
// app.listen(1337, () => {
//   console.log("Server Started on 1337");
// });

// Deploy on Netlify
app.use("/", router);
module.exports.handler = serverless(app);
