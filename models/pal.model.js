const mongoose = require("mongoose");

const PalSchema = new mongoose.Schema(
  {
    palid: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, match: /^[0-9]{10}$/, unique: true },
    joinDate: { type: Date, default: Date.now },
    online: { type: Boolean, default: false },
    bio: { type: String },
  },
  { collection: "pal" }
);

module.exports = mongoose.model("Pal", PalSchema);
