const express = require("express");
const cors = require("cors");

const generateSpecRoute = require("./routes/generateSpec");
const mockRouter = require("./routes/mockRoute");

const app = express();

app.use(cors({
    origin: [
      "https://api-gen-nu.vercel.app", // Vercel frontend
      "http://localhost:5173"          // local dev (Vite)
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use(express.json());

app.use("/generate-spec", generateSpecRoute);
app.use("/", mockRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;
