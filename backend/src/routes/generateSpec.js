const express = require("express");
const axios = require("axios");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const response = await axios.post(
      "http://localhost:8000/generate",
      { requirement: req.body.requirement }
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Spec generation failed" });
  }
});

module.exports = router;
