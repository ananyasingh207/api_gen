const express = require("express");
const axios = require("axios");
const router = express.Router();

router.post("/start-mock", async (req, res) => {
  const { openapi } = req.body;

  const mockRes = await axios.post(
    `${process.env.MOCK_SERVER_URL}/start`,
    { openapi }
  );

  res.json(mockRes.data);
});

router.post("/stop-mock", async (_, res) => {
  const mockRes = await axios.post(
    `${process.env.MOCK_SERVER_URL}/stop`
  );
  res.json(mockRes.data);
});

module.exports = router;
