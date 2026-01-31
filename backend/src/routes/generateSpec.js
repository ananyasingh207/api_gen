const express = require("express");
const axios = require("axios");
const router = express.Router();

const SPEC_GENERATOR_URL =
  process.env.SPEC_GENERATOR_URL || "http://localhost:8000";

const OPENAPI_VALIDATOR_URL =
  process.env.OPENAPI_VALIDATOR_URL || "http://localhost:8001";

router.post("/", async (req, res) => {
  try {
    const requirement = req.body.requirement;

    // Phase 1
    const genRes = await axios.post(
      `${SPEC_GENERATOR_URL}/generate`,
      { requirement }
    );

    // Phase 2
    const valRes = await axios.post(
      `${OPENAPI_VALIDATOR_URL}/validate`,
      { openapi: genRes.data.openapi }
    );

    res.json({
      openapi: genRes.data.openapi,
      validation: valRes.data
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Spec processing failed" });
  }
});

module.exports = router;


