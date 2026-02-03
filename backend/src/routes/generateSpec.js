const express = require("express");
const axios = require("axios");
const router = express.Router();

const SPEC_GENERATOR_URL =
  process.env.SPEC_GENERATOR_URL || "http://localhost:8000";

const OPENAPI_VALIDATOR_URL =
  process.env.OPENAPI_VALIDATOR_URL || "http://localhost:8001";

const AMBIGUITY_ANALYZER_URL =
  process.env.AMBIGUITY_ANALYZER_URL || "http://localhost:8002";

const SECURITY_ANALYZER_URL =
  process.env.SECURITY_ANALYZER_URL || "http://localhost:8003";


router.post("/", async (req, res) => {
  console.log("🔥 GENERATE-SPEC ROUTE WITH SECURITY HIT");
  try {
    const { requirement } = req.body;
    console.log("SPEC_GENERATOR_URL =", SPEC_GENERATOR_URL);

    // -------------------------
    // Phase 1 — MUST succeed
    // -------------------------
    const genRes = await axios.post(
      `${SPEC_GENERATOR_URL}/generate`,
      { requirement }
    );

    const openapi = genRes.data.openapi;

    // -------------------------
    // Phase 2 — NON‑BLOCKING
    // -------------------------
    let validation;
    try {
      const valRes = await axios.post(
        `${OPENAPI_VALIDATOR_URL}/validate`,
        { openapi }
      );
      validation = valRes.data;
    } catch (e) {
      console.warn("Validator failed, continuing");
      validation = {
        valid: false,
        errors: ["Validation service failed or spec is invalid"]
      };
    }

    // -------------------------
    // Phase 3 — NON‑BLOCKING
    // -------------------------
    let ambiguity;
    try {
      const ambRes = await axios.post(
        `${AMBIGUITY_ANALYZER_URL}/analyze`,
        { requirement }
      );
      ambiguity = ambRes.data;
    } catch (e) {
      console.warn("Ambiguity analyzer failed, continuing");
      ambiguity = {
        ambiguities: [],
        clarification_questions: []
      };
    }

    // -------------------------
    // Phase 4 — NON‑BLOCKING (NEW)
    // -------------------------
    let security;
    try {
      const secRes = await axios.post(
        `${SECURITY_ANALYZER_URL}/analyze`,
        { openapi }
      );
      security = secRes.data;
    } catch (e) {
      console.warn("Security analyzer failed, continuing");
      security = { issues: [] };
    }

    // -------------------------
    // Final response
    // -------------------------

    console.log("FINAL RESPONSE:", { openapi, validation, ambiguity, security });
    res.json({
      openapi,
      validation,
      ambiguity,
      security
    });

  } catch (err) {
    // ONLY Phase 1 errors land here
    console.error("Spec generation failed:", err.message);
    res.status(500).json({ error: "Spec generation failed" });
  }
});

module.exports = router;
