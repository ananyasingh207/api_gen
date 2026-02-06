const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();
app.use(bodyParser.json());

let prismProcess = null;

const IS_PROD = !!process.env.RENDER_EXTERNAL_URL;
const PORT = process.env.PORT || 3000;

const PRISM_PORT = IS_PROD ? PORT : 4010;
const MOCK_URL = IS_PROD
  ? process.env.RENDER_EXTERNAL_URL
  : `http://localhost:${PRISM_PORT}`;

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.post("/start", (req, res) => {
  if (prismProcess) {
    return res.json({
      message: "Mock server already running",
      mock_url: MOCK_URL
    });
  }

  const { openapi } = req.body;
  if (!openapi) {
    return res.status(400).json({ error: "OpenAPI spec required" });
  }

  fs.writeFileSync("openapi.json", JSON.stringify(openapi, null, 2));

  prismProcess = exec(
    `npx prism mock openapi.json --host 0.0.0.0 --port ${PRISM_PORT}`
  );

  res.json({
    message: "Mock server started",
    mock_url: MOCK_URL
  });
});

app.post("/stop", (_, res) => {
  if (prismProcess) {
    prismProcess.kill("SIGTERM");
    prismProcess = null;
    return res.json({ message: "Mock server stopped" });
  }

  res.json({ message: "Mock server was not running" });
});

app.listen(PORT, () => {
  console.log(`Mock Server Controller running on port ${PORT}`);
});
