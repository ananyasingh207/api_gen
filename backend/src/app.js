const express = require("express");
const cors = require("cors");

const generateSpecRoute = require("./routes/generateSpec");
const mockRouter = require("./routes/mockRoute");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/generate-spec", generateSpecRoute);
app.use("/", mockRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;
