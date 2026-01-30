const express = require("express");
const axios = require("axios");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    // Phase 1: generate spec
    const genRes = await axios.post(
      "http://localhost:8000/generate",
      { requirement: req.body.requirement }
    );

    // Phase 2: validate spec
    const valRes = await axios.post(
      "http://localhost:8001/validate",
      { openapi: genRes.data.openapi }
    );

    res.json({
      openapi: genRes.data.openapi,
      validation: valRes.data
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Spec generation or validation failed" });
  }
});

module.exports = router;
