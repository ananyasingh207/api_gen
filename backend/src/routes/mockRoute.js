const express = require("express");
const axios = require("axios");
const router = express.Router();

const MOCK_SERVER_URL =
  process.env.MOCK_SERVER_URL || "http://localhost:3000";

router.post("/start-mock", async (req, res) => {
  try {
    console.log("Calling mock at:", MOCK_SERVER_URL);

    const { openapi } = req.body;

    // FIX: Changed from /start to /start-mock to match server.js
    const mockRes = await axios.post(
      `${MOCK_SERVER_URL}/start-mock`, 
      { openapi }
    );

    res.json(mockRes.data);
  } catch (err) {
    // Improved error logging
    console.error("Mock start failed:", err.response?.data || err.message);
    res.status(500).json({ error: "Mock start failed" });
  }
});

router.post("/stop-mock", async (_, res) => {
  try {
    // FIX: Changed from /stop to /stop-mock to match server.js
    const mockRes = await axios.post(
      `${MOCK_SERVER_URL}/stop-mock`
    );

    res.json(mockRes.data);
  } catch (err) {
    console.error("Mock stop failed:", err.message);
    res.status(500).json({ error: "Mock stop failed" });
  }
});

module.exports = router;
