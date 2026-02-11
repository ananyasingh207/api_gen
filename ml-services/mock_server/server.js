const express = require("express");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type"]
  })
);

app.use(express.json());

const PORT = process.env.PORT || 3000;

let currentSpec = null;

/* ------------------------- */
/* Health */
/* ------------------------- */
app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

/* ------------------------- */
/* Start Mock */
/* ------------------------- */
app.post("/start-mock", (req, res) => {
  const { openapi } = req.body;

  if (!openapi) {
    return res.status(400).json({
      error: "OpenAPI spec required"
    });
  }

  currentSpec = openapi;

  res.json({
    message: "Mock routes registered successfully",
    mock_url: process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`
  });
});

/* ------------------------- */
/* Stop Mock */
/* ------------------------- */
app.post("/stop-mock", (_, res) => {
  currentSpec = null;

  res.json({
    message: "Mock routes cleared"
  });
});

/* ------------------------- */
/* Dynamic Mock Handler */
/* ------------------------- */
app.use((req, res, next) => {
  if (!currentSpec) return next();

  const method = req.method.toLowerCase();
  const requestPath = req.path;

  const paths = currentSpec.paths || {};

  for (const specPath in paths) {
    // Convert OpenAPI path to regex
    const regexPath = specPath.replace(/{[^}]+}/g, "[^/]+");
    const regex = new RegExp(`^${regexPath}$`);

    if (regex.test(requestPath) && paths[specPath][method]) {
      const operation = paths[specPath][method];
      const responses = operation.responses || {};
      const firstKey = Object.keys(responses)[0];
      const firstResponse = responses[firstKey];

      const example =
        firstResponse?.content?.["application/json"]?.example ||
        firstResponse?.content?.["application/json"]?.examples?.default?.value;

      return res.json(
        example || {
          message: `Mock response for ${method.toUpperCase()} ${requestPath}`
        }
      );
    }
  }

  next();
});

/* ------------------------- */
/* Fallback */
/* ------------------------- */
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found in mock spec"
  });
});

/* ------------------------- */
/* Start Server */
/* ------------------------- */
app.listen(PORT, () => {
  console.log(`Mock Server running on port ${PORT}`);
});

