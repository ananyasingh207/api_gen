const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  const { requirement } = req.body;

  // Phase 0 dummy response
  res.json({
    openapi: "3.0.3",
    info: {
      title: "Dummy API",
      version: "1.0.0"
    },
    paths: {
      "/health": {
        get: {
          summary: "Health check",
          responses: {
            "200": {
              description: "OK"
            }
          }
        }
      }
    }
  });
});

module.exports = router;
