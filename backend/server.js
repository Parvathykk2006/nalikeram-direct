if (!process.env.RENDER) require("dns").setServers(["8.8.8.8", "1.1.1.1"]); // fixes a DNS lookup problem on some home networks
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// --- Middleware ---
// FRONTEND_URL = the address of your live website (set it on Render).
// If it is not set (local testing), any site can call this API.
const FRONTEND_URL = process.env.FRONTEND_URL;
const corsOptions = FRONTEND_URL
  ? { origin: FRONTEND_URL.split(",").map((u) => u.trim().replace(/\/+$/, "")) }
  : {};
app.use(cors(corsOptions));
app.use(express.json({ limit: "10kb" }));

// --- 1. Connect to MongoDB Atlas ---
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI is missing. Add it to your .env file (or Render environment variables).");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, { dbName: "nalikeram" })
  .then(() => console.log("MongoDB Connected Successfully!"))
  .catch((err) => console.error("MongoDB Connection Error:", err.message));

// --- 2. Database schema for coconut listings ---
const listingSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  sellerName: { type: String, required: true, trim: true, maxlength: 60 },
  sellerPhone: { type: String, required: true, maxlength: 15 },
  village: { type: String, required: true, trim: true, maxlength: 80 },
  qty: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 1 },
  quality: { type: String, enum: ["good", "average"], default: "good" },
  createdAt: { type: Date, default: Date.now }
});

const Listing = mongoose.model("Listing", listingSchema);

// --- 3. API routes ---

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Nalikeram Direct Backend API is running!" });
});

// GET /api/listings - fetch all coconut listings (newest first)
app.get("/api/listings", async (req, res) => {
  try {
    let listings = await Listing.find().sort({ createdAt: -1 }).limit(200);

    // Add sample data if the database is empty (handy for portfolio demos)
    if (listings.length === 0) {
      const sampleListings = [
        { id: 101, sellerName: "Rajan", sellerPhone: "98XXXXXX23", village: "Thekkekara", qty: 150, price: 32, quality: "good" },
        { id: 102, sellerName: "Mathew", sellerPhone: "94XXXXXX45", village: "Harippad", qty: 300, price: 30, quality: "average" },
        { id: 103, sellerName: "Anitha", sellerPhone: "95XXXXXX89", village: "Mannar", qty: 80, price: 35, quality: "good" }
      ];
      listings = await Listing.insertMany(sampleListings);
    }

    res.json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// POST /api/listings - create a new coconut listing
app.post("/api/listings", async (req, res) => {
  try {
    const { sellerName, sellerPhone, village, qty, price, quality } = req.body || {};

    if (!sellerName || !sellerPhone || !village || !qty || !price) {
      return res.status(400).json({ error: "Please fill in all required fields" });
    }
    if (!/^[A-Za-z0-9]{4,15}$/.test(String(sellerPhone))) {
      return res.status(400).json({ error: "Phone number must be 4 to 15 letters or numbers" });
    }
    if (!(Number(qty) >= 1) || !(Number(price) >= 1)) {
      return res.status(400).json({ error: "Quantity and price must be at least 1" });
    }

    const newListing = new Listing({
      id: Date.now(),
      sellerName: String(sellerName),
      sellerPhone: String(sellerPhone),
      village: String(village),
      qty: Number(qty),
      price: Number(price),
      quality: quality === "average" ? "average" : "good"
    });

    await newListing.save();
    res.status(201).json({ success: true, message: "Listing created!", listing: newListing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create listing" });
  }
});

// DELETE /api/listings/:id - delete a listing by id
app.delete("/api/listings/:id", async (req, res) => {
  try {
    const listingId = Number(req.params.id);
    const deleted = await Listing.findOneAndDelete({ id: listingId });

    if (!deleted) {
      return res.status(404).json({ error: "Listing not found" });
    }

    res.json({ success: true, message: "Listing deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete listing" });
  }
});

// --- 4. Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
