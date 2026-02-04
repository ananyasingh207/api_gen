const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();
app.use(bodyParser.json());

let prismProcess = null;

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.post("/start", (req, res) => {
  const { openapi } = req.body;
  if (!openapi) {
    return res.status(400).json({ error: "OpenAPI spec required" });
  }

  fs.writeFileSync("openapi.json", JSON.stringify(openapi, null, 2));

  prismProcess = exec(
    "npx prism mock openapi.json --host 0.0.0.0 --port 4010"
  );

  res.json({
    message: "Mock server started",
    mock_url: "http://localhost:4010"
  });
});

app.post("/stop", (_, res) => {
  if (prismProcess) {
    prismProcess.kill();
    prismProcess = null;
  }
  res.json({ message: "Mock server stopped" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Mock Server Controller running on port ${PORT}`);
});
