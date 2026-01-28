const express = require("express");
const cors = require("cors");

const generateSpecRoute = require("./routes/generateSpec");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/generate-spec", generateSpecRoute);

module.exports = app;
