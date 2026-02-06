/**
 * Mock Server Controller
 * - Local: starts/stops Prism mock server
 * - Production (Render): mock execution disabled by design
 */

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();

/* ------------------------- */
/* Middleware */
/* ------------------------- */
app.use(cors());
app.use(bodyParser.json());

/* ------------------------- */
/* Environment */
/* ------------------------- */
const PORT = process.env.PORT || 3000;
const IS_PROD =
  process.env.NODE_ENV === "production" ||
  Boolean(process.env.RENDER_EXTERNAL_URL);

/* ------------------------- */
/* Local-only state */
/* ------------------------- */
let prismProcess = null;
const LOCAL_PRISM_PORT = 4010;
const LOCAL_MOCK_URL = `http://localhost:${LOCAL_PRISM_PORT}`;

/* ------------------------- */
/* Health check (Render) */
/* ------------------------- */
app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    environment: IS_PROD ? "production" : "local"
  });
});

/* ------------------------- */
/* Start mock server */
/* ------------------------- */
app.post("/start", (req, res) => {
  /* 🚫 Production guard */
  if (IS_PROD) {
    return res.status(403).json({
      message:
        "Mock API execution is disabled in production. Use local environment."
    });
  }

  /* Already running */
  if (prismProcess) {
    return res.json({
      message: "Mock server already running",
      mock_url: LOCAL_MOCK_URL
    });
  }

  const { openapi } = req.body;
  if (!openapi) {
    return res.status(400).json({
      error: "OpenAPI spec is required to start mock server"
    });
  }

  /* Write OpenAPI spec */
  const specPath = path.join(__dirname, "openapi.json");
  fs.writeFileSync(specPath, JSON.stringify(openapi, null, 2));

  /* Start Prism */
  prismProcess = exec(
    `npx prism mock "${specPath}" --host 0.0.0.0 --port ${LOCAL_PRISM_PORT}`,
    { stdio: "ignore" }
  );

  prismProcess.on("exit", () => {
    prismProcess = null;
  });

  res.json({
    message: "Mock server started",
    mock_url: LOCAL_MOCK_URL
  });
});

/* ------------------------- */
/* Stop mock server */
/* ------------------------- */
app.post("/stop", (_, res) => {
  if (!prismProcess) {
    return res.json({
      message: "Mock server is not running"
    });
  }

  prismProcess.kill("SIGTERM");
  prismProcess = null;

  res.json({
    message: "Mock server stopped"
  });
});

/* ------------------------- */
/* Start server */
/* ------------------------- */
app.listen(PORT, () => {
  console.log(
    `Mock Server Controller running on port ${PORT} [${
      IS_PROD ? "PROD" : "LOCAL"
    }]`
  );
});
